/**
 * Interface definition for Rate Limiting Providers.
 * This abstraction allows us to switch from Memory to Redis/Vercel KV in Phase 3.
 */
export class IRateLimitProvider {
  /**
   * Checks if a key has exceeded its rate limit.
   * @param {string} key Identifier for the rate limit (e.g., 'ip:192.168.1.1' or 'user:user123')
   * @param {number} maxRequests Maximum allowed requests in the window
   * @param {number} windowMs Time window in milliseconds
   * @returns {Promise<{ isAllowed: boolean, remaining: number, resetTime: number }>}
   */
  async checkLimit(key, maxRequests, windowMs) { throw new Error('Not implemented'); }
}
