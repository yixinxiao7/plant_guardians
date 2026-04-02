/**
 * Tests for GET /api/v1/care-actions/stats — Care Action Stats endpoint (T-064)
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
  expect(res.status).toBe(201);
  return res.body.data;
}

describe('GET /api/v1/care-actions/stats', () => {
  it('should return aggregated stats for the authenticated user (happy path)', async () => {
    const { accessToken } = await createTestUser();
    const plant1 = await createTestPlant(accessToken, { name: 'Aloe Vera' });
    const plant2 = await createTestPlant(accessToken, {
      name: 'Basil',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
        { care_type: 'fertilizing', frequency_value: 14, frequency_unit: 'days' },
      ],
    });

    // Record care actions
    await recordCareAction(accessToken, plant1.id, 'watering', '2026-03-20T10:00:00.000Z');
    await recordCareAction(accessToken, plant1.id, 'watering', '2026-03-25T10:00:00.000Z');
    await recordCareAction(accessToken, plant2.id, 'watering', '2026-03-22T10:00:00.000Z');
    await recordCareAction(accessToken, plant2.id, 'fertilizing', '2026-03-23T10:00:00.000Z');

    const res = await request(app)
      .get('/api/v1/care-actions/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const { data } = res.body;

    // Total count
    expect(data.total_care_actions).toBe(4);

    // By plant — sorted by count DESC, then name ASC
    expect(data.by_plant).toHaveLength(2);
    // Plant1 has 2 actions, Plant2 has 2 actions — tie broken by name ASC
    expect(data.by_plant[0].plant_name).toBe('Aloe Vera');
    expect(data.by_plant[0].count).toBe(2);
    expect(data.by_plant[0]).toHaveProperty('plant_id');
    expect(data.by_plant[0]).toHaveProperty('last_action_at');
    expect(data.by_plant[1].plant_name).toBe('Basil');
    expect(data.by_plant[1].count).toBe(2);

    // By care type — sorted by count DESC
    expect(data.by_care_type).toHaveLength(2);
    expect(data.by_care_type[0].care_type).toBe('watering');
    expect(data.by_care_type[0].count).toBe(3);
    expect(data.by_care_type[1].care_type).toBe('fertilizing');
    expect(data.by_care_type[1].count).toBe(1);

    // Recent activity — sorted by performed_at DESC, max 10
    expect(data.recent_activity).toHaveLength(4);
    expect(data.recent_activity[0].performed_at).toBe('2026-03-25T10:00:00.000Z');
    expect(data.recent_activity[0]).toHaveProperty('plant_name');
    expect(data.recent_activity[0]).toHaveProperty('care_type');
  });

  it('should return empty state when user has no care actions', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total_care_actions: 0,
      by_plant: [],
      by_care_type: [],
      recent_activity: [],
    });
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/care-actions/stats');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should isolate stats between users (user isolation)', async () => {
    const user1 = await createTestUser({ email: 'stats-user1@example.com' });
    const user2 = await createTestUser({ email: 'stats-user2@example.com' });

    const plant1 = await createTestPlant(user1.accessToken, { name: 'User1 Plant' });
    const plant2 = await createTestPlant(user2.accessToken, { name: 'User2 Plant' });

    // User1 records 3 actions
    await recordCareAction(user1.accessToken, plant1.id, 'watering', '2026-03-20T10:00:00.000Z');
    await recordCareAction(user1.accessToken, plant1.id, 'watering', '2026-03-21T10:00:00.000Z');
    await recordCareAction(user1.accessToken, plant1.id, 'watering', '2026-03-22T10:00:00.000Z');

    // User2 records 1 action
    await recordCareAction(user2.accessToken, plant2.id, 'watering', '2026-03-23T10:00:00.000Z');

    // User1 stats should only reflect their own data
    const res1 = await request(app)
      .get('/api/v1/care-actions/stats')
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data.total_care_actions).toBe(3);
    expect(res1.body.data.by_plant).toHaveLength(1);
    expect(res1.body.data.by_plant[0].plant_name).toBe('User1 Plant');

    // User2 stats should only reflect their own data
    const res2 = await request(app)
      .get('/api/v1/care-actions/stats')
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.total_care_actions).toBe(1);
    expect(res2.body.data.by_plant).toHaveLength(1);
    expect(res2.body.data.by_plant[0].plant_name).toBe('User2 Plant');
  });

  it('should limit recent_activity to 10 items', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    // Record 12 care actions
    for (let i = 1; i <= 12; i++) {
      const day = String(i).padStart(2, '0');
      await recordCareAction(accessToken, plant.id, 'watering', `2026-03-${day}T10:00:00.000Z`);
    }

    const res = await request(app)
      .get('/api/v1/care-actions/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total_care_actions).toBe(12);
    expect(res.body.data.recent_activity).toHaveLength(10);
    // Most recent first
    expect(res.body.data.recent_activity[0].performed_at).toBe('2026-03-12T10:00:00.000Z');
  });
});
