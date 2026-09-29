import { IRateLimitProvider } from './interfaces/IRateLimitProvider';

/**
 * Basic in-memory rate limiter for single-instance or development environments.
 * Uses a sliding window algorithm.
 */
class MemoryRateLimitProvider extends IRateLimitProvider {
  constructor() {
    super();
    this.store = new Map();
  }

  async checkLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    
    if (!this.store.has(key)) {
      this.store.set(key, []);
    }

    const timestamps = this.store.get(key);
    
    // Filter out expired timestamps
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      this.store.set(key, validTimestamps); // Clean up memory
      const oldestTimestamp = validTimestamps[0];
      return { 
        isAllowed: false, 
        remaining: 0, 
        resetTime: oldestTimestamp + windowMs 
      };
    }

    // Add current request
    validTimestamps.push(now);
    this.store.set(key, validTimestamps);

    return { 
      isAllowed: true, 
      remaining: maxRequests - validTimestamps.length, 
      resetTime: validTimestamps[0] + windowMs 
    };
  }
}

export const rateLimitProvider = new MemoryRateLimitProvider();
