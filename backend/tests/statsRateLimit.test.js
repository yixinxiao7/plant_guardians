/**
 * Tests for endpoint-specific rate limiting on GET /api/v1/care-actions/stats (T-071)
 *
 * Verifies that the stats endpoint returns 429 RATE_LIMIT_EXCEEDED when
 * the per-IP limit (30 req / 15 min) is exceeded.
 */

// Override the stats rate limit to a small number so we can trigger it quickly
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '7';
process.env.AUTH_RATE_LIMIT_MAX = '500';
process.env.RATE_LIMIT_MAX = '1000';

const request = require('supertest');
const db = require('../src/config/database');

// We need a fresh app import to pick up clean rate limiter state.
// However, since modules are cached, we test with the shared app.
// The stats limiter is set to 30 req/15min; we'll send 31 requests.
const app = require('../src/app');

let migrationsApplied = false;

async function setupDatabase() {
  if (!migrationsApplied) {
    await db.migrate.latest();
    migrationsApplied = true;
  }
}

async function cleanTables() {
  await db.raw('TRUNCATE care_actions, care_schedules, plants, refresh_tokens, users CASCADE');
}

async function createTestUser() {
  const userData = {
    full_name: 'Rate Test User',
    email: `ratetest-${Date.now()}@example.com`,
    password: 'password123',
  };
  const res = await request(app).post('/api/v1/auth/register').send(userData);
  return {
    accessToken: res.body.data.access_token,
  };
}

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await db.migrate.rollback(true);
  await db.destroy();
});

beforeEach(async () => {
  await cleanTables();
});

describe('GET /api/v1/care-actions/stats — rate limiting (T-071)', () => {
  it('should return 429 RATE_LIMIT_EXCEEDED after exceeding 30 requests in 15 minutes', async () => {
    const { accessToken } = await createTestUser();

    // Send 30 requests (all should succeed)
    for (let i = 0; i < 30; i++) {
      const res = await request(app)
        .get('/api/v1/care-actions/stats')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
    }

    // The 31st request should be rate-limited
    const res = await request(app)
      .get('/api/v1/care-actions/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(res.body.error.message).toBe('Too many requests.');
  });
});
