/**
 * Tests for plant name max-length validation (T-075)
 *
 * POST /api/v1/plants and PUT /api/v1/plants/:id must reject
 * names longer than 100 characters with 400 VALIDATION_ERROR.
 */
const {
  app, request, setupDatabase, teardownDatabase, cleanTables, createTestUser, createTestPlant,
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

const NAME_101_CHARS = 'A'.repeat(101);
const NAME_100_CHARS = 'B'.repeat(100);

describe('Plant name max-length validation (T-075)', () => {
  describe('POST /api/v1/plants', () => {
    it('should reject name longer than 100 characters with 400 VALIDATION_ERROR', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: NAME_101_CHARS,
          care_schedules: [
            { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/name/i);
      expect(res.body.error.message).toMatch(/100/);
    });

    it('should accept name of exactly 100 characters', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: NAME_100_CHARS,
          care_schedules: [
            { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(NAME_100_CHARS);
    });
  });

  describe('PUT /api/v1/plants/:id', () => {
    it('should reject name longer than 100 characters with 400 VALIDATION_ERROR', async () => {
      const { accessToken } = await createTestUser();
      const plant = await createTestPlant(accessToken);

      const res = await request(app)
        .put(`/api/v1/plants/${plant.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: NAME_101_CHARS,
          care_schedules: [
            { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/name/i);
      expect(res.body.error.message).toMatch(/100/);
    });

    it('should accept name of exactly 100 characters on update', async () => {
      const { accessToken } = await createTestUser();
      const plant = await createTestPlant(accessToken);

      const res = await request(app)
        .put(`/api/v1/plants/${plant.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: NAME_100_CHARS,
          care_schedules: [
            { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(NAME_100_CHARS);
    });
  });
});
