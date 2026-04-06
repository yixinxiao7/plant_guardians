/**
 * Tests for POST /api/v1/care-actions/batch (T-109)
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

describe('POST /api/v1/care-actions/batch', () => {
  // ─── Happy Path ───────────────────────────────────────────────────────────

  it('should create multiple care actions and return 207 with all created', async () => {
    const { accessToken } = await createTestUser();
    const plant1 = await createTestPlant(accessToken, {
      name: 'Batch Plant 1',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });
    const plant2 = await createTestPlant(accessToken, {
      name: 'Batch Plant 2',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
      ],
    });

    const now = new Date().toISOString();
    const actions = [
      { plant_id: plant1.id, care_type: 'watering', performed_at: now },
      { plant_id: plant2.id, care_type: 'watering', performed_at: now },
    ];

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actions });

    expect(res.status).toBe(207);
    expect(res.body.data.created_count).toBe(2);
    expect(res.body.data.error_count).toBe(0);
    expect(res.body.data.results).toHaveLength(2);
    expect(res.body.data.results[0].status).toBe('created');
    expect(res.body.data.results[0].error).toBeNull();
    expect(res.body.data.results[1].status).toBe('created');
  });

  it('should return 207 with partial success when some plants are not owned', async () => {
    const { accessToken: userAToken } = await createTestUser({ email: 'usera@test.com' });
    const { accessToken: userBToken } = await createTestUser({ email: 'userb@test.com' });

    const plantA = await createTestPlant(userAToken, { name: 'Plant A' });
    const plantB = await createTestPlant(userBToken, { name: 'Plant B' });

    const now = new Date().toISOString();
    const actions = [
      { plant_id: plantA.id, care_type: 'watering', performed_at: now },
      { plant_id: plantB.id, care_type: 'watering', performed_at: now }, // not owned by userA
    ];

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ actions });

    expect(res.status).toBe(207);
    expect(res.body.data.created_count).toBe(1);
    expect(res.body.data.error_count).toBe(1);
    expect(res.body.data.results[0].status).toBe('created');
    expect(res.body.data.results[1].status).toBe('error');
    expect(res.body.data.results[1].error).toBe('Plant not found or not owned by user');
  });

  it('should return 207 with all errors when plant does not exist', async () => {
    const { accessToken } = await createTestUser();
    const fakeId = '00000000-0000-4000-a000-000000000099';
    const now = new Date().toISOString();

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actions: [{ plant_id: fakeId, care_type: 'watering', performed_at: now }],
      });

    expect(res.status).toBe(207);
    expect(res.body.data.created_count).toBe(0);
    expect(res.body.data.error_count).toBe(1);
    expect(res.body.data.results[0].status).toBe('error');
  });

  // ─── Validation Errors (400) ──────────────────────────────────────────────

  it('should return 400 when actions array is missing', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when actions array is empty', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actions: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when actions array exceeds 50 items', async () => {
    const { accessToken } = await createTestUser();
    const now = new Date().toISOString();
    const actions = Array.from({ length: 51 }, (_, i) => ({
      plant_id: '00000000-0000-4000-a000-000000000000',
      care_type: 'watering',
      performed_at: now,
    }));

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actions });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/at most 50/);
  });

  it('should return 400 when an item has invalid care_type', async () => {
    const { accessToken } = await createTestUser();
    const now = new Date().toISOString();

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actions: [
          {
            plant_id: '00000000-0000-4000-a000-000000000000',
            care_type: 'singing',
            performed_at: now,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/care_type/);
  });

  it('should return 400 when an item is missing performed_at', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actions: [
          {
            plant_id: '00000000-0000-4000-a000-000000000000',
            care_type: 'watering',
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/performed_at/);
  });

  it('should return 400 when plant_id is not a valid UUID', async () => {
    const { accessToken } = await createTestUser();
    const now = new Date().toISOString();

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actions: [
          { plant_id: 'not-a-uuid', care_type: 'watering', performed_at: now },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/plant_id/);
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────

  it('should return 401 when no auth token is provided', async () => {
    const now = new Date().toISOString();

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .send({
        actions: [
          {
            plant_id: '00000000-0000-4000-a000-000000000000',
            care_type: 'watering',
            performed_at: now,
          },
        ],
      });

    expect(res.status).toBe(401);
  });
});
