import SupabaseStorageProvider from './SupabaseStorageProvider';

/**
 * StorageService acts as an abstraction layer over the underlying storage provider.
 * This ensures that changing from Supabase to Firebase Storage in Phase 3
 * will not require business logic changes.
 */
class StorageService {
  constructor() {
    // Currently hardcoded to Supabase. Dependency injection could be used here.
    this.provider = new SupabaseStorageProvider();
  }

  /**
   * Uploads an encrypted file
   * @param {string} path 
   * @param {Buffer|ReadableStream|Blob} data 
   * @returns {Promise<string>}
   */
  async uploadEncrypted(path, data) {
    // We treat encrypted files as generic octet-streams to not leak content-type 
    // info if it were somehow exposed, though metadata holds the original type.
    return this.provider.upload(path, data, 'application/octet-stream');
  }

  /**
   * Downloads an encrypted file
   * @param {string} path 
   * @returns {Promise<Blob>}
   */
  async downloadEncrypted(path) {
    return this.provider.download(path);
  }

  /**
   * Generates a short-lived signed URL for direct download (if needed)
   * @param {string} path 
   * @param {number} expiresInMinutes 
   * @returns {Promise<string>}
   */
  async generateSignedUrl(path, expiresInMinutes = 5) {
    return this.provider.generateSignedUrl(path, expiresInMinutes * 60);
  }

  /**
   * Deletes a file. Used only during upload failure cleanup.
   * @param {string} path 
   */
  async delete(path) {
    return this.provider.delete(path);
  }
}

// Export singleton instance
export const storageService = new StorageService();
