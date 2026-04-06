/**
 * Tests for GET /api/v1/plants/:id/care-history — Plant Care History endpoint (T-093)
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
async function recordCareAction(accessToken, plantId, careType, performedAt, note) {
  const body = { care_type: careType };
  if (performedAt) body.performed_at = performedAt;
  if (note) body.note = note;
  const res = await request(app)
    .post(`/api/v1/plants/${plantId}/care-actions`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(body);
  return res.body.data;
}

describe('GET /api/v1/plants/:id/care-history', () => {
  // ---- Happy path ----

  it('should return paginated care history for the authenticated user\'s plant', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-20T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-22T12:00:00.000Z');

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(20);
    expect(res.body.data.totalPages).toBe(1);

    // Most recent first
    const dates = res.body.data.items.map(i => i.performedAt);
    expect(new Date(dates[0]).getTime()).toBeGreaterThan(new Date(dates[1]).getTime());

    // Check shape
    const item = res.body.data.items[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('careType', 'watering');
    expect(item).toHaveProperty('performedAt');
    expect(item).toHaveProperty('notes');
  });

  it('should return empty items for a plant with no care actions', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.totalPages).toBe(0);
  });

  it('should filter by careType query parameter', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, {
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
        { care_type: 'fertilizing', frequency_value: 30, frequency_unit: 'days' },
      ],
    });

    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-20T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'fertilizing', '2026-03-21T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-22T10:00:00.000Z');

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history?careType=watering`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
    res.body.data.items.forEach(item => {
      expect(item.careType).toBe('watering');
    });
  });

  it('should paginate correctly with page and limit', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    // Create 3 actions
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-18T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-19T10:00:00.000Z');
    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-20T10:00:00.000Z');

    // Page 1 with limit 2
    const res1 = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history?page=1&limit=2`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data.items).toHaveLength(2);
    expect(res1.body.data.total).toBe(3);
    expect(res1.body.data.totalPages).toBe(2);
    expect(res1.body.data.page).toBe(1);

    // Page 2 with limit 2
    const res2 = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history?page=2&limit=2`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.items).toHaveLength(1);
    expect(res2.body.data.totalPages).toBe(2);
    expect(res2.body.data.page).toBe(2);
  });

  it('should include notes field (null when no note)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    await recordCareAction(accessToken, plant.id, 'watering', '2026-03-20T10:00:00.000Z');

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].notes).toBeNull();
  });

  // ---- Error paths ----

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .get('/api/v1/plants/a1b2c3d4-1234-4567-89ab-0e02b2c3d479/care-history');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 404 for non-existent plant', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants/a1b2c3d4-1234-4567-89ab-0e02b2c3d479/care-history')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 403 for plant owned by another user', async () => {
    const user1 = await createTestUser({ email: 'owner@example.com' });
    const user2 = await createTestUser({ email: 'other@example.com' });
    const plant = await createTestPlant(user1.accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history`)
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('access');
  });

  it('should return 400 for invalid careType', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history?careType=pruning`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('careType');
  });

  it('should return 400 for page < 1', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history?page=0`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('page');
  });

  it('should return 400 for limit out of range', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/care-history?limit=101`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('limit');
  });

  it('should return 400 for invalid UUID in path', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants/not-a-uuid/care-history')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
