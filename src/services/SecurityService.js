import crypto from 'crypto';
import { env } from '@/config/env';
import { IntegrityError, AppError } from '@/lib/utils/errors';

/**
 * SecurityService
 * Handles Hashing, Envelope Encryption (AES-256-GCM), and Digital Signatures (ECDSA)
 */
class SecurityService {
  /**
   * Generates a SHA-256 hash from a Node.js Readable stream
   * @param {import('stream').Readable} stream 
   * @returns {Promise<string>} Hex string of the hash
   */
  async calculateHashFromStream(stream) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', err => reject(err));
    });
  }

  /**
   * Generates a SHA-256 hash from a Buffer or string
   */
  calculateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates an HMAC-SHA256 hash (used for Audit Logs)
   */
  calculateHMAC(data) {
    const key = env.security.masterAuditKey;
    if (!key) throw new AppError('MASTER_AUDIT_KEY missing');
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Generates a deterministic HMAC-SHA256 for the Forensic Verification Ledger
   */
  generateLedgerEntry(fileHash) {
    const key = env.security.masterAuditKey;
    if (!key) throw new AppError('MASTER_AUDIT_KEY missing for ledger generation');
    return crypto.createHmac('sha256', key).update(fileHash).digest('hex');
  }

  /**
   * Generates a random 32-byte Data Encryption Key (DEK)
   * @returns {Buffer}
   */
  generateDEK() {
    return crypto.randomBytes(32);
  }

  /**
   * Encrypts the DEK using the MASTER_FILE_ENCRYPTION_KEY (KEK)
   * @param {Buffer} dekBuffer 
   */
  encryptDEK(dekBuffer) {
    const masterKey = env.security.masterFileEncryptionKey;
    if (!masterKey) throw new AppError('MASTER_FILE_ENCRYPTION_KEY missing');
    
    const kek = crypto.createHash('sha256').update(masterKey).digest();
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
    let encryptedDek = cipher.update(dekBuffer, null, 'hex');
    encryptedDek += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return { encryptedDek, iv: iv.toString('hex'), authTag };
  }

  /**
   * Decrypts the DEK using the MASTER_FILE_ENCRYPTION_KEY (KEK)
   */
  decryptDEK(encryptedDekHex, ivHex, authTagHex) {
    const masterKey = env.security.masterFileEncryptionKey;
    if (!masterKey) throw new AppError('MASTER_FILE_ENCRYPTION_KEY missing');

    const kek = crypto.createHash('sha256').update(masterKey).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', kek, iv);
    decipher.setAuthTag(authTag);
    
    let decryptedDek = decipher.update(encryptedDekHex, 'hex', null);
    decryptedDek = Buffer.concat([decryptedDek, decipher.final()]);
    return decryptedDek;
  }

  /**
   * Creates an AES-256-GCM Cipher stream for file encryption using the DEK
   * @param {Buffer} dekBuffer
   */
  createEncryptionStream(dekBuffer) {
    if (dekBuffer.length !== 32) throw new AppError('DEK must be 32 bytes');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dekBuffer, iv);
    
    return {
      cipher,
      iv: iv.toString('hex'),
    };
  }

  /**
   * Creates an AES-256-GCM Decipher stream for file decryption using the DEK
   */
  createDecryptionStream(dekBuffer, ivHex, authTagHex) {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', dekBuffer, iv);
    decipher.setAuthTag(authTag);
    return decipher;
  }

  // --- ECDSA Signature Methods ---

  generateECDSAKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey };
  }

  encryptPrivateKey(privateKeyPem) {
    const masterKey = env.security.masterPrivateKeyEncryptionKey;
    if (!masterKey) throw new AppError('MASTER_PRIVATE_KEY_ENCRYPTION_KEY missing');

    const key = crypto.createHash('sha256').update(masterKey).digest();
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(privateKeyPem, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return { encryptedKey: encrypted, iv: iv.toString('hex'), authTag };
  }

  decryptPrivateKey(encryptedKeyHex, ivHex, authTagHex) {
    const masterKey = env.security.masterPrivateKeyEncryptionKey;
    if (!masterKey) throw new AppError('MASTER_PRIVATE_KEY_ENCRYPTION_KEY missing');

    const key = crypto.createHash('sha256').update(masterKey).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedKeyHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }



  /**
   * Signs a payload using ECDSA
   * @param {Object} payload 
   * @param {string} privateKeyPem 
   * @returns {string} Base64 signature
   */
  signPayload(payload, privateKeyPem) {
    const dataString = JSON.stringify(payload);
    const sign = crypto.createSign('SHA256');
    sign.update(dataString);
    sign.end();
    return sign.sign(privateKeyPem, 'base64');
  }

  /**
   * Verifies an ECDSA signature
   * @param {Object} payload 
   * @param {string} signatureBase64 
   * @param {string} publicKeyPem 
   * @returns {boolean}
   */
  verifySignature(payload, signatureBase64, publicKeyPem) {
    const dataString = JSON.stringify(payload);
    const verify = crypto.createVerify('SHA256');
    verify.update(dataString);
    verify.end();
    return verify.verify(publicKeyPem, signatureBase64, 'base64');
  }
}

export const securityService = new SecurityService();
