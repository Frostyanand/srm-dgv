import BaseRepository from './BaseRepository';

class WorkflowRepository extends BaseRepository {
  constructor() {
    super('workflows');
  }

  /**
   * Find a workflow by document ID
   * @param {string} documentId 
   * @returns {Promise<Object|null>}
   */
  async findByDocumentId(documentId) {
    const snapshot = await this.collection.where('documentId', '==', documentId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find workflows where a specific user is the current pending signatory
   * @param {string} signatoryId 
   * @returns {Promise<Array<Object>>}
   */
  async findPendingForSignatory(signatoryId) {
    const snapshot = await this.collection
      .where('currentSignatoryId', '==', signatoryId)
      .where('status', '==', 'PENDING')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export const workflowRepository = new WorkflowRepository();
