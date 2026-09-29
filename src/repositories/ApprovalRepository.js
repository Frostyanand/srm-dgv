import BaseRepository from './BaseRepository';
import { adminDb } from '@/lib/firebase/admin';
import { IntegrityError } from '@/lib/utils/errors';

class ApprovalRepository extends BaseRepository {
  constructor() {
    // Append-only collection
    super('approvals');
  }

  /**
   * Approvals are append-only. We override update and delete to prevent mutation.
   */
  async update(id, data) {
    throw new IntegrityError('Approval records are immutable and cannot be updated.');
  }

  async delete(id) {
    throw new IntegrityError('Approval records are immutable and cannot be deleted.');
  }

  /**
   * Find all approvals for a specific document version
   * @param {string} documentId 
   * @param {string} versionId 
   * @returns {Promise<Array<Object>>}
   */
  async findByDocumentVersion(documentId, versionId) {
    const snapshot = await this.collection
      .where('documentId', '==', documentId)
      .get();
      
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(doc => doc.versionId === versionId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}

export const approvalRepository = new ApprovalRepository();
