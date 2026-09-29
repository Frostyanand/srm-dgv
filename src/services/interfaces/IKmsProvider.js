/**
 * Interface definition for Phase 3 Key Management Service (KMS) Providers
 * Implementations (e.g., Google Cloud KMS) will conform to this interface.
 */
export class IKmsProvider {
  /**
   * Encrypts data using the KMS.
   * @param {string} keyId The fully qualified key identifier
   * @param {Buffer} plaintext
   * @returns {Promise<Buffer>}
   */
  async encrypt(keyId, plaintext) { throw new Error('Not implemented'); }

  /**
   * Decrypts data using the KMS.
   * @param {string} keyId
   * @param {Buffer} ciphertext
   * @returns {Promise<Buffer>}
   */
  async decrypt(keyId, ciphertext) { throw new Error('Not implemented'); }

  /**
   * Signs a payload asymmetrically via KMS (Hardware Signing).
   * @param {string} keyId
   * @param {Buffer} payload
   * @returns {Promise<Buffer>} The digital signature
   */
  async signAsymmetric(keyId, payload) { throw new Error('Not implemented'); }
}
