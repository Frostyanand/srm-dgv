import { workflowTemplateRepository } from '@/repositories/WorkflowTemplateRepository';

class WorkflowTemplateService {
  async getAllTemplates() {
    return workflowTemplateRepository.findAll();
  }
}

export const workflowTemplateService = new WorkflowTemplateService();
