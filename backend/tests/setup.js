/**
 * Test setup — shared helpers for all test files.
 *
 * With --runInBand, all test files share a single process and module cache.
 * We track migration state to avoid redundant migrate/rollback cycles.
 *
 * IMPORTANT: db.destroy() is NOT called in teardownDatabase(). In --runInBand
 * mode, Jest loads test files lazily — when file A's afterAll fires, file B
 * hasn't called setupDatabase() yet, so an activeFiles counter would hit 0
 * prematurely and destroy the pool mid-suite. Instead, pool cleanup is handled
 * by the Jest globalTeardown script (tests/globalTeardown.js) which runs once
 * after ALL test files have completed.
 */
// Ensure environment is set BEFORE requiring app (rate limiters read env at import time)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '7';
// Raise rate limits for tests — many tests hit auth endpoints repeatedly
// T-115: Use correct T-111 variable names (legacy names removed from .env)
process.env.RATE_LIMIT_AUTH_MAX = '500';
process.env.RATE_LIMIT_AUTH_WINDOW_MS = '900000';
process.env.RATE_LIMIT_STATS_MAX = '1000';
process.env.RATE_LIMIT_STATS_WINDOW_MS = '60000';
process.env.RATE_LIMIT_GLOBAL_MAX = '1000';
process.env.RATE_LIMIT_GLOBAL_WINDOW_MS = '900000';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

// Track whether migrations have been applied (shared across test files in --runInBand mode)
let migrationsApplied = false;

/**
 * Run all migrations before tests. Idempotent — safe to call from every test file.
 */
async function setupDatabase() {
  if (!migrationsApplied) {
    await db.migrate.latest();
    migrationsApplied = true;
  }
}

/**
 * Roll back migrations after a test file completes.
 * Does NOT destroy the connection pool — that is handled by globalTeardown.
 * Rollback is skipped because other test files in --runInBand mode still need
 * the schema. The globalTeardown handles final rollback + pool cleanup.
 */
async function teardownDatabase() {
  // No-op per file — cleanup is centralized in globalTeardown.js
  // This function is kept for API compatibility with all existing test files.
}

async function cleanTables() {
  await db.raw('TRUNCATE notification_preferences, care_actions, care_schedules, plants, refresh_tokens, users CASCADE');
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
