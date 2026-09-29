import { documentRepository } from '@/repositories/DocumentRepository';
import { workflowService } from './WorkflowService';
import { storageService } from './StorageService';
import { securityService } from './SecurityService';
import { securityEventService } from './SecurityEventService';
import { Readable } from 'stream';
import { IntegrityError } from '@/lib/utils/errors';

class DocumentService {
  /**
   * Initializes a document upload process
   * @param {Object} docData 
   * @param {ReadableStream} webFileStream 
   * @param {Array<string>} requiredApprovers
   * @returns {Promise<string>} documentId
   */
  async uploadDocument(docData, webFileStream, requiredApprovers, templateId = 'CUSTOM') {
    const { departmentId, submitterId, title, description, mimeType, originalName } = docData;

    // Convert Web Stream to Node Stream for crypto operations
    // Note: requires Node.js runtime (not edge)
    const nodeStream = Readable.fromWeb(webFileStream);

    // 1. Setup Envelope Encryption Stream
    // Generate a new DEK for this specific file
    const dek = securityService.generateDEK();
    
    // Encrypt the file using the DEK
    const { cipher, iv } = securityService.createEncryptionStream(dek);
    
    // Encrypt the DEK itself using the MASTER_FILE_ENCRYPTION_KEY
    const { encryptedDek, iv: dekIv, authTag: dekAuthTag } = securityService.encryptDEK(dek);

    const hashStream = require('crypto').createHash('sha256');
    const passThrough = require('stream').PassThrough();
    nodeStream.pipe(passThrough);
    passThrough.on('data', chunk => hashStream.update(chunk));
    
    const encryptedStream = nodeStream.pipe(cipher);

    // 2. Create base document metadata
    const documentId = await documentRepository.create({
      departmentId,
      submitterId,
      title,
      description,
      status: 'PENDING',
      currentVersionId: null, 
    });

    // 3. Upload encrypted stream to Storage
    const path = `documents/${departmentId}/${documentId}/v1_${Date.now()}`;
    const storagePath = await storageService.uploadEncrypted(path, encryptedStream);

    // Wait for the hashing to finish
    const fileHash = hashStream.digest('hex');
    const fileAuthTag = cipher.getAuthTag().toString('hex');

    // 4. Create version record with envelope security metadata
    const versionId = await documentRepository.addVersion(documentId, {
      documentId,
      versionNumber: 1,
      storagePath,
      fileHash, 
      encryptionParams: { 
        iv, 
        authTag: fileAuthTag, 
        // Store encrypted DEK
        encryptedDek,
        dekIv,
        dekAuthTag
      },
      mimeType,
      originalName,
    });

    // 5. Update document with current version
    await documentRepository.update(documentId, { currentVersionId: versionId });

    // 6. Initialize Workflow Engine
    await workflowService.initializeWorkflow(documentId, requiredApprovers, templateId);

    return documentId;
  }

  async getDocument(documentId) {
    return documentRepository.findById(documentId);
  }

  /**
   * Returns a decrypted readable stream for the document version
   * @param {string} documentId 
   * @param {string} versionId 
   */
  async downloadDocumentVersion(documentId, versionId) {
    const version = await documentRepository.getVersion(documentId, versionId);
    
    // Download encrypted blob/stream from storage
    const encryptedDataBlob = await storageService.downloadEncrypted(version.storagePath);
    const encryptedNodeStream = Readable.fromWeb(encryptedDataBlob.stream());

    // Setup Decryption stream
    const { iv, authTag, encryptedDek, dekIv, dekAuthTag } = version.encryptionParams;
    
    // Decrypt the DEK first
    const dek = securityService.decryptDEK(encryptedDek, dekIv, dekAuthTag);

    // Decrypt the file using the decrypted DEK
    const decipher = securityService.createDecryptionStream(dek, iv, authTag);

    const decryptedStream = encryptedNodeStream.pipe(decipher);

    // Setup Hashing stream to verify integrity on the fly
    const hashStream = require('crypto').createHash('sha256');
    const passThrough = require('stream').PassThrough();
    
    decryptedStream.pipe(passThrough);
    
    passThrough.on('end', () => {
      const calculatedHash = hashStream.digest('hex');
      if (calculatedHash !== version.fileHash) {
        // Since we are streaming, we might not be able to abort the HTTP response cleanly 
        // after it has started, but we throw an error anyway.
        console.error(`INTEGRITY ERROR: Document ${documentId} version ${versionId} hash mismatch!`);
        securityEventService.logSecurityEvent('HASH_MISMATCH', { documentId, versionId, calculatedHash, expectedHash: version.fileHash }).catch(console.error);
        throw new IntegrityError('Document integrity verification failed. File may be tampered with.');
      }
    });

    passThrough.on('data', chunk => hashStream.update(chunk));

    return { stream: passThrough, mimeType: version.mimeType, originalName: version.originalName };
  }

  /**
   * Recalls (Deletes) a document if it is still PENDING
   * @param {string} documentId 
   * @param {string} submitterId 
   */
  async deleteDocument(documentId, submitterId) {
    const document = await documentRepository.findById(documentId);
    
    // Authorization check
    if (document.submitterId !== submitterId) {
      throw new IntegrityError('You are not authorized to delete this document.');
    }
    
    // Status check
    if (document.status !== 'PENDING') {
      throw new IntegrityError('Only pending documents can be recalled/deleted.');
    }

    // 1. Delete Workflow
    try {
      const workflow = await workflowService.workflowRepository?.findByDocumentId(documentId) || 
                       await require('@/repositories/WorkflowRepository').workflowRepository.findByDocumentId(documentId);
      if (workflow && workflow.id) {
        await require('@/repositories/WorkflowRepository').workflowRepository.delete(workflow.id);
      }
    } catch (err) {
      console.error('Error fetching/deleting workflow:', err);
    }

    // 2. Fetch and Delete Version + Storage File
    if (document.currentVersionId && typeof document.currentVersionId === 'string' && document.currentVersionId.trim() !== '') {
      try {
        const version = await documentRepository.getVersion(documentId, document.currentVersionId);
        if (version && version.storagePath) {
          try {
            await storageService.delete(version.storagePath);
          } catch(err) {
            console.error('Storage deletion skipped or failed:', err.message);
          }
        }
        // Delete version document (requires admin db access)
        const adminDb = require('@/lib/firebase/admin').adminDb;
        await adminDb.collection('documents').doc(documentId).collection('versions').doc(document.currentVersionId).delete();
      } catch (e) {
        console.error('Error cleaning up version:', e);
      }
    }

    // 3. Delete Document record
    if (documentId) {
      await documentRepository.delete(documentId);
    }
  }
}

export const documentService = new DocumentService();
