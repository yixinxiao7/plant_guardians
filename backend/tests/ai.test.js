/**
 * Tests for AI endpoints — Sprint 17 (T-077, T-078)
 *
 * T-077: POST /api/v1/ai/advice — text-based care advice
 * T-078: POST /api/v1/ai/identify — image-based plant identification
 *
 * Uses mock for Gemini SDK. Both endpoints share the same response shape.
 */
const path = require('path');
const {
  app, request, setupDatabase, teardownDatabase, cleanTables, createTestUser,
} = require('./setup');

// Mock the @google/generative-ai module
const mockGenerateContentByModel = {};
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(({ model }) => ({
        generateContent: (...args) => {
          if (mockGenerateContentByModel[model]) {
            return mockGenerateContentByModel[model](...args);
          }
          return mockGenerateContentByModel.__default(...args);
        },
      })),
    })),
  };
});

const __mockGenerateContent = jest.fn();
mockGenerateContentByModel.__default = __mockGenerateContent;

/** Valid Sprint 17 response shape from Gemini */
const MOCK_ADVICE_RESPONSE = {
  identified_plant: 'Golden Pothos',
  confidence: 'high',
  care: {
    watering_interval_days: 7,
    fertilizing_interval_days: 14,
    repotting_interval_days: 365,
    light_requirement: 'Bright indirect light',
    humidity_preference: 'Moderate',
    care_tips: 'Water when top inch of soil is dry. Trim yellow leaves promptly.',
  },
};

function mockGeminiSuccess(response = MOCK_ADVICE_RESPONSE) {
  mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockResolvedValue({
    response: { text: () => JSON.stringify(response) },
  });
}

/** Create a small valid JPEG buffer for upload tests */
function createTestImageBuffer() {
  // Minimal JPEG header (not a real image, but enough for multer mime check)
  return Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9,
  ]);
}

let savedApiKey;

beforeAll(async () => {
  await setupDatabase();
  savedApiKey = process.env.GEMINI_API_KEY;
});

afterAll(async () => {
  process.env.GEMINI_API_KEY = savedApiKey;
  await teardownDatabase();
});

beforeEach(async () => {
  await cleanTables();
  __mockGenerateContent.mockReset();
  Object.keys(mockGenerateContentByModel).forEach((key) => {
    if (key !== '__default') delete mockGenerateContentByModel[key];
  });
  process.env.GEMINI_API_KEY = 'test-valid-gemini-key';
});

// ========================================================================
// T-077: POST /api/v1/ai/advice
// ========================================================================
describe('POST /api/v1/ai/advice (T-077)', () => {
  it('should return 200 with correct Sprint 17 response shape (happy path)', async () => {
    const { accessToken } = await createTestUser();
    mockGeminiSuccess();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Pothos' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.identified_plant).toBe('Golden Pothos');
    expect(res.body.data.confidence).toBe('high');
    expect(res.body.data.care).toBeDefined();
    expect(res.body.data.care.watering_interval_days).toBe(7);
    expect(res.body.data.care.fertilizing_interval_days).toBe(14);
    expect(res.body.data.care.repotting_interval_days).toBe(365);
    expect(res.body.data.care.light_requirement).toBe('Bright indirect light');
    expect(res.body.data.care.humidity_preference).toBe('Moderate');
    expect(typeof res.body.data.care.care_tips).toBe('string');
  });

  it('should return 400 when plant_type is missing', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('plant_type is required.');
  });

  it('should return 400 when plant_type is empty string', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('plant_type is required.');
  });

  it('should return 400 when plant_type is whitespace-only', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('plant_type is required.');
  });

  it('should return 400 when plant_type exceeds 200 characters', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'x'.repeat(201) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('plant_type must be 200 characters or fewer.');
  });

  it('should return 502 when Gemini API throws an error', async () => {
    const { accessToken } = await createTestUser();
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(
      new Error('Internal server error')
    );

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Monstera' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(res.body.error.message).toBe('AI advice is temporarily unavailable. Please try again.');
  });

  it('should return 502 when Gemini returns unparseable response', async () => {
    const { accessToken } = await createTestUser();
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockResolvedValue({
      response: { text: () => 'Sorry, I cannot help with that.' },
    });

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Unknown plant xyz' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  it('should return 502 when GEMINI_API_KEY is not configured', async () => {
    const { accessToken } = await createTestUser();
    process.env.GEMINI_API_KEY = 'your-gemini-api-key';

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Pothos' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  it('should return 401 without auth header', async () => {
    const res = await request(app)
      .post('/api/v1/ai/advice')
      .send({ plant_type: 'Pothos' });

    expect(res.status).toBe(401);
  });

  // --- 429 fallback chain tests (T-048 behavior preserved) ---
  it('should fall back to next model on 429 and succeed', async () => {
    const { accessToken } = await createTestUser();

    const err429 = new Error('Resource has been exhausted. 429');
    err429.status = 429;
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(err429);
    mockGenerateContentByModel['gemini-2.5-flash'] = jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify(MOCK_ADVICE_RESPONSE) },
    });

    const res = await request(app)
      .post('/api/v1/ai/advice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ plant_type: 'Monstera' });

    expect(res.status).toBe(200);
    expect(res.body.data.identified_plant).toBe('Golden Pothos');
    expect(mockGenerateContentByModel['gemini-2.0-flash']).toHaveBeenCalledTimes(1);
    expect(mockGenerateContentByModel['gemini-2.5-flash']).toHaveBeenCalledTimes(1);
  });

  it('should return 502 when all models return 429', async () => {
    const { accessToken } = await createTestUser();

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
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });
});

// ========================================================================
// T-078: POST /api/v1/ai/identify
// ========================================================================
describe('POST /api/v1/ai/identify (T-078)', () => {
  it('should return 200 with correct response shape for valid image (happy path)', async () => {
    const { accessToken } = await createTestUser();
    mockGeminiSuccess();

    const res = await request(app)
      .post('/api/v1/ai/identify')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', createTestImageBuffer(), 'plant.jpg');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.identified_plant).toBe('Golden Pothos');
    expect(res.body.data.confidence).toBe('high');
    expect(res.body.data.care).toBeDefined();
    expect(res.body.data.care.watering_interval_days).toBe(7);
    expect(res.body.data.care.fertilizing_interval_days).toBe(14);
    expect(res.body.data.care.repotting_interval_days).toBe(365);
    expect(typeof res.body.data.care.light_requirement).toBe('string');
    expect(typeof res.body.data.care.humidity_preference).toBe('string');
    expect(typeof res.body.data.care.care_tips).toBe('string');
  });

  it('should return 400 when image field is missing', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/ai/identify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('An image is required.');
  });

  it('should return 400 for unsupported MIME type (GIF)', async () => {
    const { accessToken } = await createTestUser();

    const gifBuffer = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a header
      0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    ]);

    const res = await request(app)
      .post('/api/v1/ai/identify')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', gifBuffer, 'plant.gif');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Image must be JPEG, PNG, or WebP.');
  });

  it('should return 400 when image exceeds 5MB', async () => {
    const { accessToken } = await createTestUser();

    // Create a buffer just over 5MB
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0xFF);
    // Add JPEG header so it passes the mime check
    largeBuffer[0] = 0xFF;
    largeBuffer[1] = 0xD8;

    const res = await request(app)
      .post('/api/v1/ai/identify')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', largeBuffer, 'large.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Image must be 5MB or smaller.');
  });

  it('should return 502 when Gemini Vision API throws an error', async () => {
    const { accessToken } = await createTestUser();
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(
      new Error('Vision processing failed')
    );

    const res = await request(app)
      .post('/api/v1/ai/identify')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', createTestImageBuffer(), 'plant.jpg');

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(res.body.error.message).toBe('AI advice is temporarily unavailable. Please try again.');
  });

  it('should return 401 without auth header', async () => {
    const res = await request(app)
      .post('/api/v1/ai/identify')
      .attach('image', createTestImageBuffer(), 'plant.jpg');

    expect(res.status).toBe(401);
  });

  it('should return 502 when Gemini returns unparseable response for image', async () => {
    const { accessToken } = await createTestUser();
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockResolvedValue({
      response: { text: () => 'I cannot identify this plant.' },
    });

    const res = await request(app)
      .post('/api/v1/ai/identify')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', createTestImageBuffer(), 'plant.jpg');

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  it('should handle 429 fallback chain for image identification', async () => {
    const { accessToken } = await createTestUser();

    const err429 = new Error('Resource exhausted. 429');
    err429.status = 429;
    mockGenerateContentByModel['gemini-2.0-flash'] = jest.fn().mockRejectedValue(err429);
    mockGenerateContentByModel['gemini-2.5-flash'] = jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify(MOCK_ADVICE_RESPONSE) },
    });

    const res = await request(app)
      .post('/api/v1/ai/identify')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('image', createTestImageBuffer(), 'plant.jpg');

    expect(res.status).toBe(200);
    expect(res.body.data.identified_plant).toBe('Golden Pothos');
  });
});
