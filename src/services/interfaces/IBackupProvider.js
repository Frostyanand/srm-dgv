/**
 * Interface definition for Backup Providers.
 * Implementations will handle automated disaster recovery backups.
 */
export class IBackupProvider {
  /**
   * Triggers a backup of the Firestore database
   * @returns {Promise<string>} The backup reference URI
   */
  async backupDatabase() { throw new Error('Not implemented'); }

  /**
   * Triggers a backup of the Storage buckets
   * @returns {Promise<string>} The backup reference URI
   */
  async backupStorage() { throw new Error('Not implemented'); }

  /**
   * Triggers a specialized backup for the immutable audit chain
   * @returns {Promise<string>} The backup reference URI
   */
  async backupAuditLogs() { throw new Error('Not implemented'); }
}
