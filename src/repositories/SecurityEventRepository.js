import BaseRepository from './BaseRepository';
import { IntegrityError } from '@/lib/utils/errors';

class SecurityEventRepository extends BaseRepository {
  constructor() {
    super('security_events');
  }

  async update(id, data) {
    throw new IntegrityError('Security Events are immutable and cannot be updated.');
  }

  async delete(id) {
    throw new IntegrityError('Security Events are immutable and cannot be deleted.');
  }
}

export const securityEventRepository = new SecurityEventRepository();
