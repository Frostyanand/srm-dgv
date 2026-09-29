/**
 * Interface definition for Phase 3 Email Providers
 * Implementations (e.g., Resend) will conform to this interface.
 */
export class IEmailProvider {
  /**
   * Sends a transactional email.
   * @param {string} to
   * @param {string} subject
   * @param {string} htmlContent
   * @returns {Promise<boolean>}
   */
  async sendEmail(to, subject, htmlContent) { throw new Error('Not implemented'); }

  /**
   * Sends an email using a predefined template.
   * @param {string} to
   * @param {string} templateId
   * @param {Object} templateData
   * @returns {Promise<boolean>}
   */
  async sendTemplatedEmail(to, templateId, templateData) { throw new Error('Not implemented'); }
}
