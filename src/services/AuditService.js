import { auditRepository } from '@/repositories/AuditRepository';
import { securityService } from './SecurityService';
import { IntegrityError } from '@/lib/utils/errors';

class AuditService {
  /**
   * Logs a security event immutably.
   * @param {string} actorId 
   * @param {string} actorRole 
   * @param {string} action 
   * @param {Object} resource 
   * @param {Object} requestInfo 
   */
  async logEvent(actorId, actorRole, action, resource, requestInfo = {}) {
    // Determine previous hash for the chain
    const latestLog = await auditRepository.getLatestLog();
    const previousHash = latestLog ? latestLog.hash : 'GENESIS';

    const logData = {
      actorId,
      actorRole,
      action,
      resource,
      ipAddress: requestInfo.ipAddress || 'UNKNOWN',
      userAgent: requestInfo.userAgent || 'UNKNOWN',
      timestamp: Date.now(),
      previousHash,
    };

    // Calculate HMAC to link the chain
    const hashInput = JSON.stringify(logData);
    const hash = securityService.calculateHMAC(hashInput);

    await auditRepository.create({
      ...logData,
      hash,
    });
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain.
   * Phase 2: Simple verification reading all logs (fine for small initial scale).
   * Phase 3: Should support paginated chain verification or checkpoints.
   */
  async verifyAuditChain() {
    const logs = await auditRepository.getAllLogsAscending();
    
    let expectedPreviousHash = 'GENESIS';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      // Reconstruct payload as it was before hashing
      const payloadToHash = {
        actorId: log.actorId,
        actorRole: log.actorRole,
        action: log.action,
        resource: log.resource,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp,
        previousHash: expectedPreviousHash,
      };

      const calculatedHash = securityService.calculateHMAC(JSON.stringify(payloadToHash));

      if (calculatedHash !== log.hash || log.previousHash !== expectedPreviousHash) {
        throw new IntegrityError(`Audit Chain broken at log index ${i} (ID: ${log.id}). Tamper detected!`);
      }

      expectedPreviousHash = log.hash;
    }

    return true;
  }
}

export const auditService = new AuditService();
