/**
 * Endpoint-specific rate limiting middleware (T-111).
 *
 * Three tiers:
 *   1. Auth (strict)   — 10 req / 15 min per IP on login, register, refresh
 *   2. Stats (moderate) — 60 req / 1 min per IP on stats, streak
 *   3. Global fallback  — 200 req / 15 min per IP on all other /api/v1/* routes
 *
 * All limiters are skipped when NODE_ENV === 'test' to avoid interference with
 * the existing test suite. Configurable via environment variables with safe defaults.
 */
const rateLimit = require('express-rate-limit');

const isTest = () => process.env.NODE_ENV === 'test';

const rateLimitMessage = {
  error: {
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
};

/**
 * Auth endpoints limiter — strictest tier.
 * Applied to POST /api/v1/auth/login, /register, /refresh.
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: rateLimitMessage,
});

/**
 * Stats/streak endpoints limiter — moderate tier.
 * Applied to GET /api/v1/care-actions/stats, /streak.
 */
const statsLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_STATS_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_STATS_MAX || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: rateLimitMessage,
});

/**
 * Global fallback limiter — most permissive tier.
 * Applied to all /api/v1/* routes.
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '200', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: rateLimitMessage,
});

module.exports = {
  authLimiter,
  statsLimiter,
  globalLimiter,
};
