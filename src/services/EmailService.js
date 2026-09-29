import { ResendEmailProvider } from './implementations/ResendEmailProvider';

class EmailService {
  constructor() {
    // We instantiate the specific provider implementation here.
    // In the future, this could be driven by a DI container or config.
    this.provider = new ResendEmailProvider();
  }

  /**
   * Send a standard HTML email
   */
  async sendEmail(to, subject, htmlContent) {
    return this.provider.sendEmail(to, subject, htmlContent);
  }

  /**
   * Send a templated email
   */
  async sendTemplatedEmail(to, templateId, templateData) {
    return this.provider.sendTemplatedEmail(to, templateId, templateData);
  }
}

export const emailService = new EmailService();
