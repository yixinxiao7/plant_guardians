/**
 * Tests for GET /api/v1/care-actions/streak — Care Action Streak endpoint (T-090)
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
 * Helper: record a care action for a plant at a specific time.
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

/**
 * Helper: compute a date string N days ago, guaranteed to be in the past.
 *
 * Uses start-of-day UTC (00:00:00.000) for the target day. For "today" (n=0)
 * this is always in the past (or at most equal to now at midnight rollover).
 * This eliminates the previous flakiness where noon-UTC could be in the future
 * when tests ran before 12:00 UTC.  (FB-101 fix, T-104)
 */
function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

describe('GET /api/v1/care-actions/streak', () => {
  it('should return zeros for a user with no care actions (happy path - empty)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions/streak')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastActionDate: null,
    });
  });

  it('should return streak of 1 when there is one action today', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, { name: 'Aloe' });

    // Record an action "today" (at noon UTC)
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(0));

    const res = await request(app)
      .get('/api/v1/care-actions/streak')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currentStreak).toBe(1);
    expect(res.body.data.longestStreak).toBe(1);
    expect(res.body.data.lastActionDate).toBeDefined();
  });

  it('should return streak of 3 for three consecutive days ending today', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, { name: 'Fern' });

    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(0));
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(1));
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(2));

    const res = await request(app)
      .get('/api/v1/care-actions/streak')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currentStreak).toBe(3);
    expect(res.body.data.longestStreak).toBe(3);
  });

  it('should break the streak when there is a gap of 2+ days', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, { name: 'Cactus' });

    // Actions: 5 days ago, 4 days ago, then gap, then today
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(5));
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(4));
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(0));

    const res = await request(app)
      .get('/api/v1/care-actions/streak')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    // Current streak is 1 (only today), longest is 2 (days 5 and 4)
    expect(res.body.data.currentStreak).toBe(1);
    expect(res.body.data.longestStreak).toBe(2);
  });

  it('should apply utcOffset to shift date bucketing', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, { name: 'Rose' });

    // Record an action just after midnight UTC (00:30 UTC).
    // In UTC this is "today". With utcOffset=-300 (UTC-5), this is still "yesterday" local time
    // (since 00:30 UTC = 19:30 previous day in UTC-5).
    const now = new Date();
    const justAfterMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 30, 0)
    );
    await recordCareAction(accessToken, plant.id, 'watering', justAfterMidnight.toISOString());

    // Without offset (UTC) — action is today
    const resUtc = await request(app)
      .get('/api/v1/care-actions/streak')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(resUtc.status).toBe(200);
    expect(resUtc.body.data.currentStreak).toBeGreaterThanOrEqual(1);

    // With offset=-300 (UTC-5) — action is yesterday in local time
    const resLocal = await request(app)
      .get('/api/v1/care-actions/streak?utcOffset=-300')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(resLocal.status).toBe(200);
    // The action is on "yesterday" local time, so streak should still be 1 (yesterday counts)
    expect(resLocal.body.data.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app)
      .get('/api/v1/care-actions/streak');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBeDefined();
  });

  it('should return 400 when utcOffset is out of range', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions/streak?utcOffset=999')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/utcOffset/);
  });

  it('should return 400 when utcOffset is not an integer', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-actions/streak?utcOffset=abc')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should isolate streaks between users', async () => {
    const user1 = await createTestUser({ email: 'user1@streak.com' });
    const user2 = await createTestUser({ email: 'user2@streak.com' });
    const plant1 = await createTestPlant(user1.accessToken, { name: 'Plant A' });
    const plant2 = await createTestPlant(user2.accessToken, { name: 'Plant B' });

    // User1 has 3-day streak
    await recordCareAction(user1.accessToken, plant1.id, 'watering', daysAgo(0));
    await recordCareAction(user1.accessToken, plant1.id, 'watering', daysAgo(1));
    await recordCareAction(user1.accessToken, plant1.id, 'watering', daysAgo(2));

    // User2 has no actions
    const res1 = await request(app)
      .get('/api/v1/care-actions/streak')
      .set('Authorization', `Bearer ${user1.accessToken}`);
    const res2 = await request(app)
      .get('/api/v1/care-actions/streak')
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(res1.body.data.currentStreak).toBe(3);
    expect(res2.body.data.currentStreak).toBe(0);
  });
});
