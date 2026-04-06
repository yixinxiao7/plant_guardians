/**
 * Tests for endpoint-specific rate limiting middleware (T-111).
 *
 * Verifies the module exports and structure. Since NODE_ENV=test causes
 * all limiters to skip, functional 429 tests would require env overrides
 * and a fresh app import (see statsRateLimit.test.js for that pattern).
 */
const { authLimiter, statsLimiter, globalLimiter } = require('../src/middleware/rateLimiter');

describe('Rate limiter middleware (T-111)', () => {
  it('should export authLimiter, statsLimiter, and globalLimiter as functions', () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe('function');
    expect(statsLimiter).toBeDefined();
    expect(typeof statsLimiter).toBe('function');
    expect(globalLimiter).toBeDefined();
    expect(typeof globalLimiter).toBe('function');
  });

  it('should be running in test environment where limiters are skipped', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
