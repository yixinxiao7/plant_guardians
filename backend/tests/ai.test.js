/**
 * Tests for AI Advice endpoint (T-011, T-025)
 * Uses mock for Gemini SDK to test happy-path without real API key.
 */
const {
  app, request, setupDatabase, teardownDatabase, cleanTables, createTestUser,
} = require('./setup');

// Mock the @google/generative-ai module for happy-path testing
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

const { __mockGenerateContent } = require('@google/generative-ai');

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

beforeEach(async () => {
  await cleanTables();
  __mockGenerateContent.mockReset();
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

  it('should return 200 with care advice when Gemini returns valid JSON (happy path)', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    const mockAdvice = {
      identified_plant_type: 'Golden Pothos',
      confidence: 'high',
      care_advice: {
        watering: {
          frequency_value: 7,
          frequency_unit: 'days',
          notes: 'Water when top inch of soil is dry.',
        },
        fertilizing: {
          frequency_value: 2,
          frequency_unit: 'weeks',
          notes: 'Use balanced liquid fertilizer during growing season.',
        },
        repotting: {
          frequency_value: 12,
          frequency_unit: 'months',
          notes: 'Repot when roots outgrow the container.',
        },
        light: 'Bright indirect light; tolerates low light.',
        humidity: 'Average household humidity is fine.',
        additional_tips: 'Trim yellow leaves promptly.',
      },
    };

    __mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockAdvice),
      },
    });

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Pothos' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.care_advice).toBeDefined();
    expect(res.body.data.care_advice.watering.frequency_value).toBe(7);
    expect(res.body.data.care_advice.watering.frequency_unit).toBe('days');
    expect(res.body.data.care_advice.fertilizing).toBeDefined();
    expect(res.body.data.care_advice.repotting).toBeDefined();
    expect(res.body.data.identified_plant_type).toBe('Golden Pothos');
    expect(res.body.data.confidence).toBe('high');

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should return 422 when Gemini returns unparseable response', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    __mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Sorry, I cannot identify this plant from the image provided.',
      },
    });

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Unknown plant' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PLANT_NOT_IDENTIFIABLE');

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should return 502 when Gemini API throws an error', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    __mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Monstera' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_SERVICE_UNAVAILABLE');

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should return 400 when plant_type exceeds 200 characters', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'x'.repeat(201) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
