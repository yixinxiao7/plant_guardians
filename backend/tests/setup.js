/**
 * Test setup — shared helpers for all test files.
 */
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

// Ensure we're in test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '7';

/**
 * Run all migrations before tests and clean up after.
 */
async function setupDatabase() {
  await db.migrate.latest();
}

async function teardownDatabase() {
  await db.migrate.rollback(true);
  await db.destroy();
}

async function cleanTables() {
  await db.raw('TRUNCATE care_actions, care_schedules, plants, refresh_tokens, users CASCADE');
}

/**
 * Register a test user and return tokens + user data.
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

  return {
    user: res.body.data.user,
    accessToken: res.body.data.access_token,
    refreshToken: res.body.data.refresh_token,
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
};
