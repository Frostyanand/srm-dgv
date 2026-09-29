import { adminAuth } from '@/lib/firebase/admin';
import { UnauthorizedError } from '@/lib/utils/errors';
import { userRepository } from '@/repositories/UserRepository';
import { securityEventService } from './SecurityEventService';

class AuthService {
  /**
   * Verifies a Firebase ID token and returns the user record from Firestore.
   * @param {string} idToken 
   * @returns {Promise<Object>} user record
   */
  async verifySession(idToken) {
    if (!idToken) {
      throw new UnauthorizedError('Missing authentication token.');
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      let user;
      try {
        user = await userRepository.findById(decodedToken.uid);
      } catch (err) {
        if (err.code === 'NOT_FOUND' || err.name === 'NotFoundError') {
          if (decodedToken.role) {
            // Self-heal: Create missing Firestore record for valid Auth user
            const authUser = await adminAuth.getUser(decodedToken.uid);
            await userRepository.create({
              email: authUser.email,
              name: authUser.displayName || 'Provisioned User',
              role: decodedToken.role,
              status: 'ACTIVE',
              departmentId: null,
              createdAt: Date.now()
            }, decodedToken.uid);
            user = await userRepository.findById(decodedToken.uid);
          } else {
            throw new UnauthorizedError('User record not found in system.');
          }
        } else {
          throw err;
        }
      }
      
      // Strict MFA Enforcement
      if (user.mfaEnabled) {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const mfaCookie = cookieStore.get('mfa_session');
        
        // Ensure the mfa_session cookie exists and matches the user's uid
        if (!mfaCookie || mfaCookie.value !== decodedToken.uid) {
          throw new UnauthorizedError('MFA Verification required.');
        }
      }
      
      return user;
    } catch (error) {
      await securityEventService.logSecurityEvent('LOGIN_FAILURE', { error: error.message, tokenPreview: idToken.substring(0, 10) });
      throw new UnauthorizedError(error.message || 'Invalid or expired authentication token.');
    }
  }

  /**
   * Validates reauthentication (Phase 1 stub).
   * Real implementation would require verifying a recent auth time or specific reauth token.
   * @param {string} idToken 
   */
  async verifyReauthentication(idToken) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const authTime = decodedToken.auth_time * 1000;
      const now = Date.now();
      
      // Reauth must have happened within the last 5 minutes
      if (now - authTime > 5 * 60 * 1000) {
        throw new UnauthorizedError('Recent authentication required for this action. Please reauthenticate.');
      }
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Failed to verify reauthentication.');
    }
  }
}

export const authService = new AuthService();
