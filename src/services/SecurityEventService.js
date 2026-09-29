import { securityEventRepository } from '@/repositories/SecurityEventRepository';

class SecurityEventService {
  /**
   * Logs a security event for investigation
   * @param {string} eventType LOGIN_FAILURE, RATE_LIMIT_TRIGGER, CSRF_FAILURE, HASH_MISMATCH, PERMISSION_DENIED, SIGNATURE_FAILURE
   * @param {Object} details Context around the failure
   * @param {Object} requestInfo Request context (IP, User Agent)
   */
  async logSecurityEvent(eventType, details = {}, requestInfo = {}) {
    const eventRecord = {
      eventType,
      details,
      ipAddress: requestInfo.ipAddress || 'UNKNOWN',
      userAgent: requestInfo.userAgent || 'UNKNOWN',
      timestamp: Date.now(),
      status: 'UNRESOLVED', // Admin workflow could resolve this later
    };

    return securityEventRepository.create(eventRecord);
  }
}

export const securityEventService = new SecurityEventService();
