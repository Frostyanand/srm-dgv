import { supabaseClient } from '@/lib/supabase/client';
import { AppError } from '@/lib/utils/errors';

/**
 * Storage Provider implementation for Supabase Storage.
 * Designed to handle standard and large files. Note that in Node environments, 
 * standard fetch with ReadableStreams or buffers must be used.
 */
class SupabaseStorageProvider {
  constructor(bucketName = 'encrypted_documents') {
    this.bucketName = bucketName;
    this.supabase = supabaseClient;
  }

  /**
   * Uploads a file stream to Supabase Storage.
   * @param {string} path - Destination path in bucket
   * @param {Buffer|ReadableStream|Blob} data - The data to upload
   * @param {string} mimeType - The mime type
   * @returns {Promise<string>} The storage path
   */
  async upload(path, data, mimeType = 'application/octet-stream') {
    const { data: uploadData, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, data, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      throw new AppError(`Supabase Upload Error: ${error.message}`, 500, 'STORAGE_UPLOAD_ERROR');
    }

    return uploadData.path;
  }

  /**
   * Downloads a file from Supabase as a stream (or Blob depending on environment).
   * In a Node.js server environment, `download` returns a Blob that we can convert to an arrayBuffer or stream.
   * @param {string} path - Path in bucket
   * @returns {Promise<Blob>} The downloaded file blob
   */
  async download(path) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(path);

    if (error) {
      throw new AppError(`Supabase Download Error: ${error.message}`, 500, 'STORAGE_DOWNLOAD_ERROR');
    }

    return data;
  }

  /**
   * Generates a signed URL for a file
   * @param {string} path - Path in bucket
   * @param {number} expiresIn - Expiration in seconds
   * @returns {Promise<string>}
   */
  async generateSignedUrl(path, expiresIn = 300) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new AppError(`Supabase Signed URL Error: ${error.message}`, 500, 'STORAGE_SIGNED_URL_ERROR');
    }

    return data.signedUrl;
  }

  /**
   * Deletes a file (Only for cleanup, approved documents should never be deleted)
   * @param {string} path - Path in bucket
   * @returns {Promise<void>}
   */
  async delete(path) {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new AppError(`Supabase Delete Error: ${error.message}`, 500, 'STORAGE_DELETE_ERROR');
    }
  }
}

export default SupabaseStorageProvider;
