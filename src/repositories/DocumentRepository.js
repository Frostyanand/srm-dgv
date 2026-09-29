import BaseRepository from './BaseRepository';
import { adminDb } from '@/lib/firebase/admin';
import { IntegrityError, NotFoundError } from '@/lib/utils/errors';

class DocumentRepository extends BaseRepository {
  constructor() {
    super('documents');
  }

  /**
   * Save a new document version inside the document's subcollection
   * @param {string} documentId 
   * @param {Object} versionData 
   * @returns {Promise<string>} versionId
   */
  async addVersion(documentId, versionData) {
    const docRef = this.collection.doc(documentId);
    // Verify document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundError(`Document ${documentId} not found.`);
    }

    const versionRef = docRef.collection('versions').doc();
    await versionRef.set({
      ...versionData,
      createdAt: Date.now()
    });

    return versionRef.id;
  }

  /**
   * Find documents submitted by a specific user
   * @param {string} submitterId 
   * @returns {Promise<Array<Object>>}
   */
  async findBySubmitter(submitterId) {
    const snapshot = await this.collection.where('submitterId', '==', submitterId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  /**
   * Get a specific version of a document
   * @param {string} documentId 
   * @param {string} versionId 
   */
  async getVersion(documentId, versionId) {
    const docRef = this.collection.doc(documentId).collection('versions').doc(versionId);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundError(`Version ${versionId} not found for document ${documentId}`);
    }
    return { id: doc.id, ...doc.data() };
  }
}

export const documentRepository = new DocumentRepository();
