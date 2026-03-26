/**
 * Tests for GET /api/v1/care-actions — Care History endpoint (T-039)
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

/**
 * Helper: record a care action for a plant via the existing endpoint.
 */
async function recordCareAction(accessToken, plantId, careType, performedAt) {
  const body = { care_type: careType };
  if (performedAt) body.performed_at = performedAt;
  const res = await request(app)
    .post(`/api/v1/plants/${plantId}/care-actions`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(body);
  return res.body.data;
}

describe('GET /api/v1/care-actions', () => {
  it('should return paginated care actions for the authenticated user (happy path)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    // Record two care actions
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-20T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-22T10:00:00.000Z');

    const res = await request(app)
      .get('/api/v1/care-actions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 2 });

    // Should be sorted by performed_at DESC (most recent first)
    const dates = res.body.data.map(a => a.performed_at);
    expect(new Date(dates[0]).getTime()).toBeGreaterThan(new Date(dates[1]).getTime());

    // Each item should have the expected shape
    const item = res.body.data[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('plant_id', plant.id);
    expect(item).toHaveProperty('plant_name', plant.name);
    expect(item).toHaveProperty('care_type', 'watering');
    expect(item).toHaveProperty('performed_at');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/care-actions');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return empty array when user has no care actions', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 0 });
  });

  it('should filter by plant_id when provided', async () => {
    const { accessToken } = await createTestUser();
    const plant1 = await createTestPlant(accessToken, { name: 'Plant A' });
    const plant2 = await createTestPlant(accessToken, {
      name: 'Plant B',
      care_schedules: [{ care_type: 'watering', frequency_value: 3, frequency_unit: 'days' }],
    });

    await recordCareAction(accessToken, plant1.id, 'watering', '2026-03-20T10:00:00.000Z');
    await recordCareAction(accessToken, plant2.id, 'watering', '2026-03-21T10:00:00.000Z');

    const res = await request(app)
      .get(`/api/v1/care-actions?plant_id=${plant1.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].plant_id).toBe(plant1.id);
    expect(res.body.pagination.total).toBe(1);
  });

  it('should paginate correctly', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    // Create 3 actions
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-18T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-19T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-20T10:00:00.000Z');

    // Page 1 with limit 2
    const res1 = await request(app)
      .get('/api/v1/care-actions?page=1&limit=2')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data).toHaveLength(2);
    expect(res1.body.pagination).toEqual({ page: 1, limit: 2, total: 3 });

    // Page 2 with limit 2
    const res2 = await request(app)
      .get('/api/v1/care-actions?page=2&limit=2')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data).toHaveLength(1);
    expect(res2.body.pagination).toEqual({ page: 2, limit: 2, total: 3 });
  });

  it('should return 400 for invalid page parameter', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions?page=0')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for limit exceeding 100', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions?limit=101')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid plant_id UUID format', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions?plant_id=not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('plant_id');
  });

  it('should isolate care actions between users (ownership isolation)', async () => {
    const user1 = await createTestUser({ email: 'user1@example.com' });
    const user2 = await createTestUser({ email: 'user2@example.com' });

    const plant1 = await createTestPlant(user1.accessToken);
    const plant2 = await createTestPlant(user2.accessToken);

    await recordCareAction(user1.accessToken, plant1.id, 'watering', '2026-03-20T10:00:00.000Z');
    await recordCareAction(user2.accessToken, plant2.id, 'watering', '2026-03-21T10:00:00.000Z');

    // User 1 should only see their own actions
    const res1 = await request(app)
      .get('/api/v1/care-actions')
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data).toHaveLength(1);
    expect(res1.body.data[0].plant_id).toBe(plant1.id);

    // User 2 filtering by user 1's plant should get empty (not 404)
    const res2 = await request(app)
      .get(`/api/v1/care-actions?plant_id=${plant1.id}`)
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data).toEqual([]);
    expect(res2.body.pagination.total).toBe(0);
  });
});
