/**
 * Tests for AI Advice endpoint (T-011, T-025, T-048)
 * Uses mock for Gemini SDK to test happy-path and 429 fallback chain.
 */
const {
  app, request, setupDatabase, teardownDatabase, cleanTables, createTestUser,
} = require('./setup');

// Mock the @google/generative-ai module for happy-path and fallback testing
const mockGenerateContentByModel = {};
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(({ model }) => ({
        generateContent: (...args) => {
          if (mockGenerateContentByModel[model]) {
            return mockGenerateContentByModel[model](...args);
          }
          // Default: use the legacy mock (for backward compat)
          return mockGenerateContentByModel.__default(...args);
        },
      })),
    })),
  };
});

// Legacy-compatible alias
const __mockGenerateContent = jest.fn();
mockGenerateContentByModel.__default = __mockGenerateContent;

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

beforeEach(async () => {
  await cleanTables();
  __mockGenerateContent.mockReset();
  // Clear all per-model mocks
  Object.keys(mockGenerateContentByModel).forEach((key) => {
    if (key !== '__default') delete mockGenerateContentByModel[key];
  });
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

    // First model in chain (gemini-2.0-flash) succeeds
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockResolvedValue({
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

    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockResolvedValue({
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

  it('should return 502 when Gemini API throws a non-429 error', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(new Error('API quota exceeded'));

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

  // --- T-048: 429 model fallback chain tests ---

  it('should fall back to next model on 429 and succeed (T-048)', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    const mockAdvice = {
      identified_plant_type: 'Monstera',
      confidence: 'high',
      care_advice: {
        watering: { frequency_value: 7, frequency_unit: 'days', notes: null },
        fertilizing: { frequency_value: 2, frequency_unit: 'weeks', notes: null },
        repotting: { frequency_value: 12, frequency_unit: 'months', notes: null },
        light: 'Bright indirect',
        humidity: 'High',
        additional_tips: null,
      },
    };

    // First model returns 429, second model succeeds
    const err429 = new Error('Resource has been exhausted (e.g. check quota). 429');
    err429.status = 429;
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(err429);
    mockGenerateContentByModel['gemini-2.5-flash'] = jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify(mockAdvice) },
    });

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Monstera' });

    expect(res.status).toBe(200);
    expect(res.body.data.identified_plant_type).toBe('Monstera');
    expect(mockGenerateContentByModel['gemini-2.0-flash']).toHaveBeenCalledTimes(1);
    expect(mockGenerateContentByModel['gemini-2.5-flash']).toHaveBeenCalledTimes(1);

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should return 502 when all models in fallback chain return 429 (T-048)', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    const make429 = () => {
      const err = new Error('Resource has been exhausted. 429');
      err.status = 429;
      return err;
    };

    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(make429());
    mockGenerateContentByModel['gemini-2.5-flash'] = jest.fn().mockRejectedValue(make429());
    mockGenerateContentByModel['gemini-2.5-flash-lite'] = jest.fn().mockRejectedValue(make429());
    mockGenerateContentByModel['gemini-2.5-pro'] = jest.fn().mockRejectedValue(make429());

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Fern' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_SERVICE_UNAVAILABLE');

    // All 4 models should have been tried
    expect(mockGenerateContentByModel['gemini-2.0-flash']).toHaveBeenCalledTimes(1);
    expect(mockGenerateContentByModel['gemini-2.5-flash']).toHaveBeenCalledTimes(1);
    expect(mockGenerateContentByModel['gemini-2.5-flash-lite']).toHaveBeenCalledTimes(1);
    expect(mockGenerateContentByModel['gemini-2.5-pro']).toHaveBeenCalledTimes(1);

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should throw immediately on non-429 error without trying next model (T-048)', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(
      new Error('Internal server error')
    );
    mockGenerateContentByModel['gemini-2.5-flash'] = jest.fn();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Cactus' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_SERVICE_UNAVAILABLE');

    // Only first model should have been tried
    expect(mockGenerateContentByModel['gemini-2.0-flash']).toHaveBeenCalledTimes(1);
    expect(mockGenerateContentByModel['gemini-2.5-flash']).not.toHaveBeenCalled();

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should detect 429 from error message string (T-048)', async () => {
    const { accessToken } = await createTestUser();
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-valid-gemini-key';

    const mockAdvice = {
      identified_plant_type: 'Snake Plant',
      confidence: 'high',
      care_advice: {
        watering: { frequency_value: 14, frequency_unit: 'days', notes: null },
        fertilizing: { frequency_value: 1, frequency_unit: 'months', notes: null },
        repotting: { frequency_value: 24, frequency_unit: 'months', notes: null },
        light: 'Low to bright indirect',
        humidity: 'Low',
        additional_tips: null,
      },
    };

    // 429 detected via message string (no .status property)
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(
      new Error('429 Too Many Requests')
    );
    mockGenerateContentByModel['gemini-2.5-flash'] = jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify(mockAdvice) },
    });

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Snake Plant' });

    expect(res.status).toBe(200);
    expect(res.body.data.identified_plant_type).toBe('Snake Plant');

    process.env.GEMINI_API_KEY = originalKey;
  });
});
