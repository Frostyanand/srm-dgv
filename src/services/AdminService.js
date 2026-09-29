import { userRepository } from '@/repositories/UserRepository';
import { workflowRepository } from '@/repositories/WorkflowRepository';
import { securityEventRepository } from '@/repositories/SecurityEventRepository';

class AdminService {
  async getDashboardStats() {
    const totalUsers = await userRepository.count();
    const activeWorkflows = await workflowRepository.count();
    const securityEvents = await securityEventRepository.count();

    return {
      totalUsers,
      activeWorkflows,
      securityEvents
    };
  }
}

export const adminService = new AdminService();
