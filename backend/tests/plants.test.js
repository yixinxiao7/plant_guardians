/**
 * Tests for Plants CRUD endpoints (T-009, T-010)
 */
const path = require('path');
const fs = require('fs');
const {
  app, request, setupDatabase, teardownDatabase, cleanTables, createTestUser, createTestPlant,
} = require('./setup');

// Create a tiny valid JPEG buffer for testing (smallest valid JPEG)
const TINY_JPEG = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
  0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
  0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
  0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
  0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
  0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
  0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
  0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
  0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
  0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
  0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
  0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
  0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
  0x00, 0x00, 0x3F, 0x00, 0x7B, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xFF, 0xD9,
]);

const TEST_FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Ensure test fixtures directory exists
beforeAll(() => {
  if (!fs.existsSync(TEST_FIXTURES_DIR)) {
    fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
  }
  // Write a test JPEG file
  fs.writeFileSync(path.join(TEST_FIXTURES_DIR, 'test-photo.jpg'), TINY_JPEG);
  // Write a test text file (for invalid type test)
  fs.writeFileSync(path.join(TEST_FIXTURES_DIR, 'test-file.txt'), 'not an image');
});

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

beforeEach(async () => {
  await cleanTables();
});

describe('GET /api/v1/plants', () => {
  it('should return empty list when user has no plants', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/plants');
    expect(res.status).toBe(401);
  });

  it('should return plants with care schedules', async () => {
    const { accessToken } = await createTestUser();
    await createTestPlant(accessToken);

    const res = await request(app)
      .get('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Test Pothos');
    expect(res.body.data[0].care_schedules.length).toBe(1);
    expect(res.body.data[0].care_schedules[0].care_type).toBe('watering');
    expect(res.body.data[0].care_schedules[0].status).toBeDefined();
    expect(res.body.data[0].care_schedules[0].next_due_at).toBeDefined();
  });
});

describe('POST /api/v1/plants', () => {
  it('should create a plant with care schedules', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'My Fern',
        type: 'Boston Fern',
        care_schedules: [
          { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
          { care_type: 'fertilizing', frequency_value: 2, frequency_unit: 'weeks' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('My Fern');
    expect(res.body.data.care_schedules.length).toBe(2);
  });

  it('should return 400 for missing name', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'Fern' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for duplicate care types', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Dupe Plant',
        care_schedules: [
          { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
          { care_type: 'watering', frequency_value: 5, frequency_unit: 'days' },
        ],
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/plants/:id', () => {
  it('should return plant detail with recent care actions', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(plant.id);
    expect(res.body.data.recent_care_actions).toBeDefined();
    expect(Array.isArray(res.body.data.recent_care_actions)).toBe(true);
  });

  it('should return 404 for non-existent plant', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants/00000000-0000-4000-a000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLANT_NOT_FOUND');
  });

  it('should return 404 for another user\'s plant', async () => {
    const user1 = await createTestUser({ email: 'user1@example.com' });
    const user2 = await createTestUser({ email: 'user2@example.com' });
    const plant = await createTestPlant(user1.accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}`)
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/plants/:id', () => {
  it('should update plant and replace schedules', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .put(`/api/v1/plants/${plant.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Renamed Plant',
        care_schedules: [
          { care_type: 'watering', frequency_value: 14, frequency_unit: 'days' },
          { care_type: 'repotting', frequency_value: 6, frequency_unit: 'months' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed Plant');
    expect(res.body.data.care_schedules.length).toBe(2);
  });

  it('should return 404 for non-existent plant', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .put('/api/v1/plants/00000000-0000-4000-a000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Ghost Plant' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/plants/:id', () => {
  it('should delete a plant', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .delete(`/api/v1/plants/${plant.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(plant.id);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/v1/plants/${plant.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(getRes.status).toBe(404);
  });

  it('should return 404 for non-existent plant', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .delete('/api/v1/plants/00000000-0000-4000-a000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/plants/:id/photo (T-010)', () => {
  it('should upload a photo and return photo_url', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/photo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('photo', path.join(TEST_FIXTURES_DIR, 'test-photo.jpg'));

    expect(res.status).toBe(200);
    expect(res.body.data.photo_url).toBeDefined();
    expect(typeof res.body.data.photo_url).toBe('string');
    expect(res.body.data.photo_url).toMatch(/^\/uploads\//);
  });

  it('should return 400 with MISSING_FILE when no file is attached', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/photo`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_FILE');
  });

  it('should return 400 with INVALID_FILE_TYPE for non-image file', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/photo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('photo', path.join(TEST_FIXTURES_DIR, 'test-file.txt'));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/plants/00000000-0000-4000-a000-000000000000/photo');

    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent plant', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/plants/00000000-0000-4000-a000-000000000000/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('photo', path.join(TEST_FIXTURES_DIR, 'test-photo.jpg'));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLANT_NOT_FOUND');
  });

  it('should return a photo_url that is browser-accessible via /uploads/ static route (T-059)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    // Upload a photo
    const uploadRes = await request(app)
      .post(`/api/v1/plants/${plant.id}/photo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('photo', path.join(TEST_FIXTURES_DIR, 'test-photo.jpg'));

    expect(uploadRes.status).toBe(200);
    const photoUrl = uploadRes.body.data.photo_url;
    expect(photoUrl).toMatch(/^\/uploads\//);

    // Fetch the photo directly via the static route — should return 200
    const fetchRes = await request(app).get(photoUrl);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.headers['content-type']).toMatch(/image/);
  });

  it('should return a relative /uploads/ path, not an absolute URL (T-059)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/photo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('photo', path.join(TEST_FIXTURES_DIR, 'test-photo.jpg'));

    expect(res.status).toBe(200);
    const photoUrl = res.body.data.photo_url;
    // Must be relative path, not absolute URL
    expect(photoUrl).not.toMatch(/^https?:\/\//);
    expect(photoUrl).toMatch(/^\/uploads\/[a-f0-9-]+\.\w+$/);
  });
});
