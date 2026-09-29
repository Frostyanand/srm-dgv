import { Resend } from 'resend';
import { env } from '@/config/env';
import { IEmailProvider } from '../interfaces/IEmailProvider';

export class ResendEmailProvider extends IEmailProvider {
  constructor() {
    super();
    this.resend = new Resend(env.email.resendApiKey);
    this.defaultFrom = 'SRM Verification <noreply@srmist.edu.in>'; // Update with verified domain later
  }

  /**
   * Sends a transactional email.
   * @param {string} to
   * @param {string} subject
   * @param {string} htmlContent
   * @returns {Promise<boolean>}
   */
  async sendEmail(to, subject, htmlContent) {
    try {
      const data = await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject,
        html: htmlContent,
      });

      if (data.error) {
        console.error('Resend Error:', data.error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Email Provider Exception:', error);
      return false;
    }
  }

  /**
   * Sends an email using a predefined template.
   * @param {string} to
   * @param {string} templateId
   * @param {Object} templateData
   * @returns {Promise<boolean>}
   */
  async sendTemplatedEmail(to, templateId, templateData) {
    // For Resend, templates are typically built with React Email, 
    // or we can map templateId to specific HTML generators here.
    const subject = `Notification for ${templateId}`;
    const htmlContent = `
      <div>
        <h1>SRM Digital Verification</h1>
        <p>A new event has occurred regarding: <strong>${templateId}</strong></p>
        <pre>${JSON.stringify(templateData, null, 2)}</pre>
      </div>
    `;
    return this.sendEmail(to, subject, htmlContent);
  }
}
