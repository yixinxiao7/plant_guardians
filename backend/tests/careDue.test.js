/**
 * Tests for GET /api/v1/care-due — Care Due Dashboard endpoint (T-043)
 */
const {
  app, request, db, setupDatabase, teardownDatabase, cleanTables, createTestUser, createTestPlant,
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

/**
 * Helper: build an ISO date string N days ago from today (UTC noon).
 *
 * Uses noon (12:00 UTC) instead of midnight to avoid flakiness when tests
 * run near the UTC midnight boundary. Both the helper and the careDue route
 * truncate timestamps to the start-of-day, so the exact hour doesn't affect
 * categorisation — but using noon ensures the truncated day is always the
 * same even when there's a few-second gap between setup and request.
 */
function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

describe('GET /api/v1/care-due', () => {
  it('should return overdue, due_today, and upcoming items (happy path)', async () => {
    const { accessToken } = await createTestUser();

    // Plant with watering every 3 days; last watered 5 days ago → overdue by 2 days
    const plant1 = await createTestPlant(accessToken, {
      name: 'Monstera',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant1.id, 'watering', daysAgo(5));

    // Plant with watering every 7 days; last watered 7 days ago → due today
    const plant2 = await createTestPlant(accessToken, {
      name: 'Snake Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant2.id, 'watering', daysAgo(7));

    // Plant with watering every 7 days; last watered 4 days ago → upcoming in 3 days
    const plant3 = await createTestPlant(accessToken, {
      name: 'Pothos',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant3.id, 'watering', daysAgo(4));

    const res = await request(app)
      .get('/api/v1/care-due')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.overdue).toBeDefined();
    expect(res.body.data.due_today).toBeDefined();
    expect(res.body.data.upcoming).toBeDefined();

    // Overdue: Monstera watering (2 days overdue)
    expect(res.body.data.overdue.length).toBeGreaterThanOrEqual(1);
    const overdueItem = res.body.data.overdue.find(
      i => i.plant_id === plant1.id && i.care_type === 'watering'
    );
    expect(overdueItem).toBeDefined();
    expect(overdueItem.plant_name).toBe('Monstera');
    expect(overdueItem.days_overdue).toBe(2);
    expect(overdueItem.last_done_at).toBeTruthy(); // non-null since we recorded an action

    // Due today: Snake Plant watering
    const dueTodayItem = res.body.data.due_today.find(
      i => i.plant_id === plant2.id && i.care_type === 'watering'
    );
    expect(dueTodayItem).toBeDefined();
    expect(dueTodayItem.plant_name).toBe('Snake Plant');
    // due_today items should NOT have days_overdue or due_in_days
    expect(dueTodayItem).not.toHaveProperty('days_overdue');
    expect(dueTodayItem).not.toHaveProperty('due_in_days');

    // Upcoming: Pothos watering (3 days out)
    const upcomingItem = res.body.data.upcoming.find(
      i => i.plant_id === plant3.id && i.care_type === 'watering'
    );
    expect(upcomingItem).toBeDefined();
    expect(upcomingItem.plant_name).toBe('Pothos');
    expect(upcomingItem.due_in_days).toBe(3);
    expect(upcomingItem.due_date).toBeDefined();
  });

  it('should return empty arrays when all plants are on track (no action needed)', async () => {
    const { accessToken } = await createTestUser();

    // Plant with watering every 30 days; last watered today → not due for 30 days
    const plant = await createTestPlant(accessToken, {
      name: 'Cactus',
      care_schedules: [
        { care_type: 'watering', frequency_value: 30, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(0));

    const res = await request(app)
      .get('/api/v1/care-due')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.overdue).toEqual([]);
    expect(res.body.data.due_today).toEqual([]);
    expect(res.body.data.upcoming).toEqual([]);
  });

  it('should handle never-done plants (uses plant.created_at as baseline)', async () => {
    const { accessToken } = await createTestUser();

    // Plant with watering every 1 day, never watered → should be overdue quickly
    // (created_at is "now", so next_due = created_at + 1 day = tomorrow → upcoming)
    const plant = await createTestPlant(accessToken, {
      name: 'New Fern',
      care_schedules: [
        { care_type: 'watering', frequency_value: 1, frequency_unit: 'days' },
      ],
    });

    const res = await request(app)
      .get('/api/v1/care-due')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    // The plant was just created, so next_due = created_at + 1 day
    // It should be either due_today or upcoming (1 day), depending on exact timing
    const allItems = [
      ...res.body.data.overdue,
      ...res.body.data.due_today,
      ...res.body.data.upcoming,
    ];
    const fernItem = allItems.find(i => i.plant_id === plant.id);
    expect(fernItem).toBeDefined();
    expect(fernItem.plant_name).toBe('New Fern');

    // For overdue items from never-done plants, last_done_at should be null
    const overdueItem = res.body.data.overdue.find(i => i.plant_id === plant.id);
    if (overdueItem) {
      expect(overdueItem.last_done_at).toBeNull();
    }
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/care-due');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return empty arrays when user has no plants', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-due')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.overdue).toEqual([]);
    expect(res.body.data.due_today).toEqual([]);
    expect(res.body.data.upcoming).toEqual([]);
  });

  it('should isolate care-due data between users', async () => {
    const user1 = await createTestUser({ email: 'user1-due@example.com' });
    const user2 = await createTestUser({ email: 'user2-due@example.com' });

    // User 1 has an overdue plant
    const plant1 = await createTestPlant(user1.accessToken, {
      name: 'User1 Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 1, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(user1.accessToken, plant1.id, 'watering', daysAgo(5));

    // User 2 should see empty results (no plants)
    const res = await request(app)
      .get('/api/v1/care-due')
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.overdue).toEqual([]);
    expect(res.body.data.due_today).toEqual([]);
    expect(res.body.data.upcoming).toEqual([]);
  });

  it('should sort overdue by days_overdue DESC, then plant_name ASC', async () => {
    const { accessToken } = await createTestUser();

    // Two plants with different overdue amounts
    const plantA = await createTestPlant(accessToken, {
      name: 'Alpha',
      care_schedules: [
        { care_type: 'watering', frequency_value: 1, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plantA.id, 'watering', daysAgo(3)); // overdue by 2

    const plantB = await createTestPlant(accessToken, {
      name: 'Beta',
      care_schedules: [
        { care_type: 'watering', frequency_value: 1, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plantB.id, 'watering', daysAgo(6)); // overdue by 5

    const res = await request(app)
      .get('/api/v1/care-due')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const overdueNames = res.body.data.overdue
      .filter(i => i.care_type === 'watering')
      .map(i => i.plant_name);

    // Beta (5 days overdue) should come before Alpha (2 days overdue)
    const betaIdx = overdueNames.indexOf('Beta');
    const alphaIdx = overdueNames.indexOf('Alpha');
    expect(betaIdx).toBeLessThan(alphaIdx);
  });

  it('should accept utcOffset query parameter and still return valid results (T-060)', async () => {
    const { accessToken } = await createTestUser();

    // Plant with watering every 3 days; last watered 5 days ago → overdue by 2 days
    const plant = await createTestPlant(accessToken, {
      name: 'Offset Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(5));

    // Test with a positive offset (e.g. UTC+5:30 = 330 minutes)
    const res = await request(app)
      .get('/api/v1/care-due?utcOffset=330')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.overdue).toBeDefined();
    expect(res.body.data.due_today).toBeDefined();
    expect(res.body.data.upcoming).toBeDefined();

    // The plant should still show up (overdue regardless of timezone)
    const allItems = [
      ...res.body.data.overdue,
      ...res.body.data.due_today,
      ...res.body.data.upcoming,
    ];
    const found = allItems.find(i => i.plant_id === plant.id);
    expect(found).toBeDefined();
  });

  it('should return same results without utcOffset as with utcOffset=0 (backward compat, T-060)', async () => {
    const { accessToken } = await createTestUser();

    const plant = await createTestPlant(accessToken, {
      name: 'Compat Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(5));

    const [resNoOffset, resZeroOffset] = await Promise.all([
      request(app)
        .get('/api/v1/care-due')
        .set('Authorization', `Bearer ${accessToken}`),
      request(app)
        .get('/api/v1/care-due?utcOffset=0')
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(resNoOffset.status).toBe(200);
    expect(resZeroOffset.status).toBe(200);
    // Both should produce identical results
    expect(resNoOffset.body.data.overdue.length).toBe(resZeroOffset.body.data.overdue.length);
    expect(resNoOffset.body.data.due_today.length).toBe(resZeroOffset.body.data.due_today.length);
    expect(resNoOffset.body.data.upcoming.length).toBe(resZeroOffset.body.data.upcoming.length);
  });

  it('should return 400 VALIDATION_ERROR for non-integer utcOffset (T-060)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-due?utcOffset=abc')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 VALIDATION_ERROR for utcOffset out of range (T-060)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-due?utcOffset=1000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/utcOffset/);
  });

  it('should accept negative utcOffset (e.g. US Eastern = -300) (T-060)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/care-due?utcOffset=-300')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('should handle weekly frequency correctly', async () => {
    const { accessToken } = await createTestUser();

    // Plant with watering every 1 week; last watered 10 days ago → overdue by 3 days
    const plant = await createTestPlant(accessToken, {
      name: 'Weekly Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 1, frequency_unit: 'weeks' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(10));

    const res = await request(app)
      .get('/api/v1/care-due')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const overdueItem = res.body.data.overdue.find(
      i => i.plant_id === plant.id && i.care_type === 'watering'
    );
    expect(overdueItem).toBeDefined();
    expect(overdueItem.days_overdue).toBe(3);
  });
});
