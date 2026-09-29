import BaseRepository from './BaseRepository';
import { adminDb } from '@/lib/firebase/admin';

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Find a user by email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find all users by role
   * @param {string} role 
   * @returns {Promise<Array<Object>>}
   */
  async findByRole(role) {
    const snapshot = await this.collection.where('role', '==', role).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export const userRepository = new UserRepository();
