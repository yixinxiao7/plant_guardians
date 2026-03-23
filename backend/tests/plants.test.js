/**
 * Tests for Plants CRUD endpoints (T-009, T-010)
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
