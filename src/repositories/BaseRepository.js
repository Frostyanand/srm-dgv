import { adminDb } from '@/lib/firebase/admin';
import { NotFoundError, IntegrityError } from '@/lib/utils/errors';

/**
 * Base Repository for Firestore collections
 */
class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collection = adminDb.collection(collectionName);
  }

  /**
   * Retrieves a document by ID
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundError(`${this.collectionName} document with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Retrieves all documents
   * @returns {Promise<Array>}
   */
  async findAll() {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Gets the total count of documents
   * @returns {Promise<number>}
   */
  async count() {
    const snapshot = await this.collection.count().get();
    return snapshot.data().count;
  }

  /**
   * Creates a new document with an auto-generated ID or a specific ID
   * @param {Object} data 
   * @param {string} [id]
   * @returns {Promise<string>} The generated or provided ID
   */
  async create(data, id = null) {
    const docRef = id ? this.collection.doc(id) : this.collection.doc();
    
    // Safety check to ensure we don't accidentally overwrite in a pure create call
    if (id) {
      const existing = await docRef.get();
      if (existing.exists) {
        throw new IntegrityError(`Document with ID ${id} already exists in ${this.collectionName}`);
      }
    }

    await docRef.set({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return docRef.id;
  }

  /**
   * Updates an existing document
   * @param {string} id 
   * @param {Object} data 
   */
  async update(id, data) {
    const docRef = this.collection.doc(id);
    await docRef.update({
      ...data,
      updatedAt: Date.now(),
    });
  }

  /**
   * Deletes a document
   * @param {string} id 
   */
  async delete(id) {
    await this.collection.doc(id).delete();
  }
}

export default BaseRepository;
