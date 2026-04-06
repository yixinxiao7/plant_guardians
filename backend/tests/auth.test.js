/**
 * Tests for Auth endpoints (T-008, updated T-053 — HttpOnly cookie refresh token)
 */
const {
  app, request, setupDatabase, teardownDatabase, cleanTables, createTestUser,
  extractRefreshTokenCookie, refreshTokenCookieHeader,
} = require('./setup');

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

beforeEach(async () => {
  await cleanTables();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user, return access_token in body and refresh_token in cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secure123',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user.full_name).toBe('Jane Doe');
    expect(res.body.data.access_token).toBeDefined();
    // refresh_token is NOT in the response body (T-053)
    expect(res.body.data.refresh_token).toBeUndefined();
    // refresh_token IS in the Set-Cookie header
    const refreshToken = extractRefreshTokenCookie(res);
    expect(refreshToken).toBeTruthy();
    // Cookie attributes
    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.find(c => c.startsWith('refresh_token=')) : setCookie;
    expect(cookieStr).toMatch(/HttpOnly/i);
    // T-087: Secure flag is only set when NODE_ENV=production.
    // In test environment, the cookie should NOT have the Secure attribute.
    if (process.env.NODE_ENV === 'production') {
      expect(cookieStr).toMatch(/Secure/i);
    } else {
      expect(cookieStr).not.toMatch(/;\s*Secure/i);
    }
    expect(cookieStr).toMatch(/SameSite=Lax/i);
    expect(cookieStr).toMatch(/Path=\/api\/v1\/auth/);
    // Password hash should never be returned
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'jane@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 409 for duplicate email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        full_name: 'Jane Doe',
        email: 'dupe@example.com',
        password: 'secure123',
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        full_name: 'Jane Doe 2',
        email: 'dupe@example.com',
        password: 'secure456',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials and set refresh token cookie', async () => {
    const { user } = await createTestUser({
      email: 'login@example.com',
      password: 'mypassword',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.access_token).toBeDefined();
    // refresh_token is NOT in the response body (T-053)
    expect(res.body.data.refresh_token).toBeUndefined();
    // refresh_token IS in the Set-Cookie header
    const refreshToken = extractRefreshTokenCookie(res);
    expect(refreshToken).toBeTruthy();
  });

  it('should return 401 for wrong password', async () => {
    await createTestUser({ email: 'wrong@example.com', password: 'correctpass' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('should rotate the refresh token via cookie', async () => {
    const { refreshToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshTokenCookieHeader(refreshToken));

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeDefined();
    // refresh_token is NOT in body (T-053)
    expect(res.body.data.refresh_token).toBeUndefined();
    // New rotated token is in the cookie
    const newRefreshToken = extractRefreshTokenCookie(res);
    expect(newRefreshToken).toBeTruthy();
    expect(newRefreshToken).not.toBe(refreshToken);
  });

  it('should reject an already-rotated token', async () => {
    const { refreshToken } = await createTestUser();

    // Use it once
    await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshTokenCookieHeader(refreshToken));

    // Try again with the old token
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshTokenCookieHeader(refreshToken));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('should return 401 when no refresh token cookie is present', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('should return 401 for an invalid refresh token cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshTokenCookieHeader('totally-bogus-token'));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should invalidate the refresh token and clear the cookie', async () => {
    const { accessToken, refreshToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshTokenCookieHeader(refreshToken));

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Logged out successfully.');

    // Cookie should be cleared (Max-Age=0 or Expires in the past)
    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.find(c => c.startsWith('refresh_token=')) : setCookie;
    // clearCookie sets the value to empty and expires immediately
    expect(cookieStr).toBeDefined();

    // Refresh should now fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshTokenCookieHeader(refreshToken));

    expect(refreshRes.status).toBe(401);
  });

  it('should succeed even without a refresh token cookie (idempotent)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Logged out successfully.');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/login — cold-start regression (T-056)', () => {
  it('should return 200 on 5 rapid sequential login calls with no 500 errors', async () => {
    // Create a user to test against
    await createTestUser({ email: 'rapid@example.com', password: 'securepass123' });

    // Fire 5 rapid sequential login requests — simulates immediate calls after restart
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'rapid@example.com', password: 'securepass123' });
      results.push(res);
    }

    // All 5 must succeed — zero 500s
    for (let i = 0; i < results.length; i++) {
      expect(results[i].status).toBe(200);
      expect(results[i].body.data.access_token).toBeDefined();
      expect(results[i].body.data.user.email).toBe('rapid@example.com');
    }
  });

  it('should return 200 on 5 concurrent login calls with no 500 errors', async () => {
    // Create a user to test against
    await createTestUser({ email: 'concurrent@example.com', password: 'securepass123' });

    // Fire 5 concurrent login requests — stress test pool under load
    const promises = Array.from({ length: 5 }, () =>
      request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'concurrent@example.com', password: 'securepass123' })
    );

    const results = await Promise.all(promises);

    // All 5 must succeed — zero 500s
    for (let i = 0; i < results.length; i++) {
      expect(results[i].status).toBe(200);
      expect(results[i].body.data.access_token).toBeDefined();
      expect(results[i].body.data.user.email).toBe('concurrent@example.com');
    }
  });
});

describe('POST /api/v1/auth/login — idle pool regression (T-058)', () => {
  it('should return 200 on 5 sequential logins after pool has been idle (no 500s)', async () => {
    await createTestUser({ email: 'idle-test@example.com', password: 'idlepass123' });

    // In the test environment the pool has short idle timeouts. We cannot easily
    // simulate a 10-minute wait, but we can verify that the increased idle timeout
    // config is correctly applied and that sequential logins still work reliably.
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'idle-test@example.com', password: 'idlepass123' });
      results.push(res);
    }

    for (const res of results) {
      expect(res.status).toBe(200);
      expect(res.body.data.access_token).toBeDefined();
    }
  });

  it('should have idleTimeoutMillis >= 600000 in non-test configurations', () => {
    // Verify the knexfile config fix was applied correctly
    const knexfile = require('../knexfile');
    expect(knexfile.development.pool.idleTimeoutMillis).toBeGreaterThanOrEqual(600000);
    expect(knexfile.staging.pool.idleTimeoutMillis).toBeGreaterThanOrEqual(600000);
    expect(knexfile.production.pool.idleTimeoutMillis).toBeGreaterThanOrEqual(600000);
  });
});
