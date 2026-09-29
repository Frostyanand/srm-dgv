import BaseRepository from './BaseRepository';
import { IntegrityError } from '@/lib/utils/errors';

class AuditRepository extends BaseRepository {
  constructor() {
    super('audit_logs');
  }

  async update(id, data) {
    throw new IntegrityError('Audit logs are immutable and cannot be updated.');
  }

  async delete(id) {
    throw new IntegrityError('Audit logs are immutable and cannot be deleted.');
  }

  /**
   * Retrieves the most recent audit log to support hash chaining.
   * @returns {Promise<Object|null>}
   */
  async getLatestLog() {
    const snapshot = await this.collection
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
      
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Retrieves all logs ordered by timestamp (asc) for verification.
   * Note: In production this would need pagination for large datasets.
   * @returns {Promise<Array<Object>>}
   */
  async getAllLogsAscending() {
    const snapshot = await this.collection.orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export const auditRepository = new AuditRepository();
