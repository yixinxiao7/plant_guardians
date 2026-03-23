/**
 * Tests for Auth endpoints (T-008)
 */
const {
  app, request, setupDatabase, teardownDatabase, cleanTables, createTestUser,
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
  it('should register a new user and return tokens', async () => {
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
    expect(res.body.data.refresh_token).toBeDefined();
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
  it('should login with valid credentials', async () => {
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
    expect(res.body.data.refresh_token).toBeDefined();
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
  it('should rotate the refresh token', async () => {
    const { refreshToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.refresh_token).toBeDefined();
    expect(res.body.data.refresh_token).not.toBe(refreshToken);
  });

  it('should reject an already-rotated token', async () => {
    const { refreshToken } = await createTestUser();

    // Use it once
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: refreshToken });

    // Try again with the old token
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should invalidate the refresh token', async () => {
    const { accessToken, refreshToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Logged out successfully.');

    // Refresh should now fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: refreshToken });

    expect(refreshRes.status).toBe(401);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refresh_token: 'whatever' });

    expect(res.status).toBe(401);
  });
});
