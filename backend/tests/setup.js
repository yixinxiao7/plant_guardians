/**
 * Test setup — shared helpers for all test files.
 *
 * With --runInBand, all test files share a single process and module cache.
 * We track migration state to avoid redundant migrate/rollback cycles and
 * ensure db.destroy() is only called once (via the process exit handler).
 */
// Ensure environment is set BEFORE requiring app (rate limiters read env at import time)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '7';
// Raise rate limits for tests — many tests hit auth endpoints repeatedly
process.env.AUTH_RATE_LIMIT_MAX = '500';
process.env.RATE_LIMIT_MAX = '1000';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

// Track whether migrations have been applied (shared across test files in --runInBand mode)
let migrationsApplied = false;
let activeFiles = 0;

/**
 * Run all migrations before tests. Idempotent — safe to call from every test file.
 */
async function setupDatabase() {
  activeFiles++;
  if (!migrationsApplied) {
    await db.migrate.latest();
    migrationsApplied = true;
  }
}

/**
 * Roll back migrations and destroy the connection pool.
 * Only actually runs when the last test file tears down.
 */
async function teardownDatabase() {
  activeFiles--;
  if (activeFiles <= 0) {
    await db.migrate.rollback(true);
    migrationsApplied = false;
    await db.destroy();
  }
}

async function cleanTables() {
  await db.raw('TRUNCATE care_actions, care_schedules, plants, refresh_tokens, users CASCADE');
}

/**
 * Extract the refresh_token value from Set-Cookie headers in a supertest response.
 */
function extractRefreshTokenCookie(res) {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return null;
  const arr = Array.isArray(cookies) ? cookies : [cookies];
  for (const c of arr) {
    const match = c.match(/^refresh_token=([^;]+)/);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Build a Cookie header string for sending the refresh_token cookie in requests.
 */
function refreshTokenCookieHeader(rawToken) {
  return `refresh_token=${rawToken}`;
}

/**
 * Register a test user and return tokens + user data.
 * Refresh token is extracted from the Set-Cookie header (T-053).
 */
async function createTestUser(overrides = {}) {
  const userData = {
    full_name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send(userData);

  const refreshToken = extractRefreshTokenCookie(res);

  return {
    user: res.body.data.user,
    accessToken: res.body.data.access_token,
    refreshToken,
    rawPassword: userData.password,
  };
}

/**
 * Create a test plant with optional care schedules.
 */
async function createTestPlant(accessToken, overrides = {}) {
  const plantData = {
    name: 'Test Pothos',
    type: 'Pothos',
    notes: 'A lovely test plant',
    care_schedules: [
      {
        care_type: 'watering',
        frequency_value: 7,
        frequency_unit: 'days',
      },
    ],
    ...overrides,
  };

  const res = await request(app)
    .post('/api/v1/plants')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(plantData);

  return res.body.data;
}

module.exports = {
  app,
  db,
  request,
  setupDatabase,
  teardownDatabase,
  cleanTables,
  createTestUser,
  createTestPlant,
  extractRefreshTokenCookie,
  refreshTokenCookieHeader,
};
