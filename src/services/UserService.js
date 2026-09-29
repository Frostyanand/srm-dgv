import { userRepository } from '@/repositories/UserRepository';
import { IntegrityError, NotFoundError } from '@/lib/utils/errors';
import { adminAuth } from '@/lib/firebase/admin';
import { securityService } from './SecurityService';

class UserService {
  /**
   * Create a new user (Super Admin only operation)
   * Phase 2: Generates ECDSA keys and encrypts the private key with MASTER_SIGNING_KEY.
   * @param {Object} userData 
   */
  async createUser(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new IntegrityError('User with this email already exists.');
    }

    // Create user in Firebase Auth
    const authUser = await adminAuth.createUser({
      email: userData.email,
      password: userData.password, // Temp password, user should reset
      displayName: userData.name,
    });

    // Generate ECDSA Keypair
    const { publicKey, privateKey } = securityService.generateECDSAKeyPair();

    // Encrypt Private Key
    const { encryptedKey, iv, authTag } = securityService.encryptPrivateKey(privateKey);

    // Save metadata in Firestore
    const newUserId = await userRepository.create({
      email: userData.email,
      name: userData.name,
      role: userData.role,
      departmentId: userData.departmentId || null,
      publicKey,
      encryptedPrivateKey: {
        encryptedKey,
        iv,
        authTag,
      },
    }, authUser.uid);

    return newUserId;
  }

  async getUser(userId) {
    return userRepository.findById(userId);
  }

  async updateUserEmail(targetUid, newEmail) {
    // Check if email is already in use
    const existing = await userRepository.findByEmail(newEmail);
    if (existing && existing.id !== targetUid) {
      throw new IntegrityError('Email is already in use by another account.');
    }

    // Update Firebase Auth
    await adminAuth.updateUser(targetUid, { email: newEmail });
    
    // Update Firestore
    await userRepository.update(targetUid, { email: newEmail });
  }

  async deactivateUser(targetUid) {
    // Disable in Firebase Auth
    await adminAuth.updateUser(targetUid, { disabled: true });
    
    // Revoke all active sessions immediately
    await adminAuth.revokeRefreshTokens(targetUid);

    // Mark as inactive in Firestore
    await userRepository.update(targetUid, { status: 'INACTIVE' });
  }

  async adminResetPassword(targetUid, newPassword) {
    // Update password in Firebase Auth
    await adminAuth.updateUser(targetUid, { password: newPassword });

    // Revoke all active sessions immediately so the old password's sessions are killed
    await adminAuth.revokeRefreshTokens(targetUid);

    // Inject requiresPasswordReset claim to force them to change it on next login
    const userRecord = await adminAuth.getUser(targetUid);
    const currentClaims = userRecord.customClaims || {};
    
    await adminAuth.setCustomUserClaims(targetUid, {
      ...currentClaims,
      requiresPasswordReset: true
    });
  }

  async getAllUsers() {
    return userRepository.findAll();
  }
}

export const userService = new UserService();
