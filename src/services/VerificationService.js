import { documentRepository } from '@/repositories/DocumentRepository';
import { approvalRepository } from '@/repositories/ApprovalRepository';
import { userRepository } from '@/repositories/UserRepository';
import { securityService } from './SecurityService';
import { securityEventService } from './SecurityEventService';

class VerificationService {
  /**
   * Verifies a document version's approval chain and signatures.
   * @param {string} documentId 
   * @param {string} versionId 
   */
  async verifyDocument(documentId, versionId) {
    const result = {
      isValid: true,
      documentId,
      versionId,
      issues: [],
      approvals: [],
    };

    try {
      // 1. Fetch Document Version
      const version = await documentRepository.getVersion(documentId, versionId);
      const document = await documentRepository.findById(documentId);
      
      // Check Version Status
      if (document.currentVersionId !== versionId) {
        result.issues.push('Warning: This is not the latest version of the document.');
      }

      // 2. Fetch Approval Chain
      const approvals = await approvalRepository.findByDocumentVersion(documentId, versionId);
      if (approvals.length === 0) {
        result.isValid = false;
        result.issues.push('No approvals found for this document version.');
        return result;
      }

      // 3. Verify Signatures & Chain
      for (const approval of approvals) {
        const signatory = await userRepository.findById(approval.approverId);
        if (!signatory || !signatory.publicKey) {
          result.isValid = false;
          result.issues.push(`Signatory ${approval.approverId} not found or missing public key.`);
          continue;
        }

        // Verify hash matches
        if (approval.documentHash !== version.fileHash) {
          result.isValid = false;
          result.issues.push(`Hash mismatch in approval ${approval.id}. Signed hash does not match document hash.`);
        }

        // Reconstruct payload
        const approvalPayload = {
          documentId: approval.documentId,
          versionId: approval.versionId,
          documentHash: approval.documentHash,
          action: approval.action,
          timestamp: approval.timestamp,
          approverId: approval.approverId,
        };

        // Verify Signature
        const isSignatureValid = securityService.verifySignature(
          approvalPayload,
          approval.signature,
          signatory.publicKey
        );

        if (!isSignatureValid) {
          result.isValid = false;
          result.issues.push(`Cryptographic signature verification failed for approval ${approval.id} by ${signatory.email}.`);
          securityEventService.logSecurityEvent('SIGNATURE_FAILURE', {
            approvalId: approval.id,
            approverId: signatory.id,
            documentId,
            versionId
          }).catch(console.error);
        }

        result.approvals.push({
          approver: signatory.email,
          action: approval.action,
          timestamp: approval.timestamp,
          signatureValid: isSignatureValid,
        });
      }

    } catch (error) {
      result.isValid = false;
      result.issues.push(`Verification Error: ${error.message}`);
    }

    return result;
  }
}

export const verificationService = new VerificationService();
