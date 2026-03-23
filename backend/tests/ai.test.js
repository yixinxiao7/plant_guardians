/**
 * Tests for AI Advice endpoint (T-011)
 * Note: Uses stub/mock since we don't call real Gemini API in tests.
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

describe('POST /api/v1/ai/advice', () => {
  it('should return 400 when neither plant_type nor photo_url provided', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/ai/advice')
      .send({ plant_type: 'Pothos' });

    expect(res.status).toBe(401);
  });

  it('should return 502 when Gemini API key is not configured', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'your-gemini-api-key'; // default placeholder

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Pothos' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_SERVICE_UNAVAILABLE');

    process.env.GEMINI_API_KEY = originalKey;
  });
});
