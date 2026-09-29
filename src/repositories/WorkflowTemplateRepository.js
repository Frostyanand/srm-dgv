import BaseRepository from './BaseRepository';

class WorkflowTemplateRepository extends BaseRepository {
  constructor() {
    super('workflow_templates');
  }

  /**
   * Retrieve all available workflow templates
   * @returns {Promise<Array<Object>>}
   */
  async findAll() {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export const workflowTemplateRepository = new WorkflowTemplateRepository();
