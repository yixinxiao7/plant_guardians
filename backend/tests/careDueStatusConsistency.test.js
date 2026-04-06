/**
 * Regression tests for T-116 — Care status consistency between
 * GET /api/v1/plants and GET /api/v1/care-due.
 *
 * Critical invariant: Given the same utcOffset, a plant classified as "overdue"
 * by GET /plants must also appear in the overdue[] array of GET /care-due — and
 * vice-versa. The two endpoints must never disagree on status bucketing.
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
 * Helper: record a care action at a specific time.
 */
async function recordCareAction(accessToken, plantId, careType, performedAt) {
  const body = { care_type: careType };
  if (performedAt) body.performed_at = performedAt;
  await request(app)
    .post(`/api/v1/plants/${plantId}/care-actions`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(body);
}

/**
 * Helper: build an ISO date string N days ago from today (UTC noon).
 */
function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

describe('T-116: Care status consistency between /plants and /care-due', () => {
  it('overdue plant in GET /plants must appear in overdue[] of GET /care-due (utcOffset=0)', async () => {
    const { accessToken } = await createTestUser();

    // Plant watered 5 days ago with 3-day frequency → overdue by 2 days
    const plant = await createTestPlant(accessToken, {
      name: 'Consistency Test Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(5));

    // Fetch both endpoints with same utcOffset
    const [plantsRes, careDueRes] = await Promise.all([
      request(app)
        .get('/api/v1/plants?utcOffset=0')
        .set('Authorization', `Bearer ${accessToken}`),
      request(app)
        .get('/api/v1/care-due?utcOffset=0')
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(plantsRes.status).toBe(200);
    expect(careDueRes.status).toBe(200);

    // Find the plant in /plants response and check its status
    const plantData = plantsRes.body.data.find(p => p.id === plant.id);
    expect(plantData).toBeDefined();
    const wateringSchedule = plantData.care_schedules.find(s => s.care_type === 'watering');
    expect(wateringSchedule).toBeDefined();
    expect(wateringSchedule.status).toBe('overdue');

    // The same plant must appear in overdue[] of /care-due
    const overdueItem = careDueRes.body.data.overdue.find(
      i => i.plant_id === plant.id && i.care_type === 'watering'
    );
    expect(overdueItem).toBeDefined();
    expect(overdueItem.days_overdue).toBe(wateringSchedule.days_overdue);
  });

  it('overdue status is consistent across timezone boundaries (utcOffset=330)', async () => {
    const { accessToken } = await createTestUser();

    // Plant watered 10 days ago with 7-day frequency → overdue by 3 days
    const plant = await createTestPlant(accessToken, {
      name: 'Timezone Boundary Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(10));

    const utcOffset = 330; // UTC+5:30 (India)

    const [plantsRes, careDueRes] = await Promise.all([
      request(app)
        .get(`/api/v1/plants?utcOffset=${utcOffset}`)
        .set('Authorization', `Bearer ${accessToken}`),
      request(app)
        .get(`/api/v1/care-due?utcOffset=${utcOffset}`)
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(plantsRes.status).toBe(200);
    expect(careDueRes.status).toBe(200);

    const plantData = plantsRes.body.data.find(p => p.id === plant.id);
    const wateringSchedule = plantData.care_schedules.find(s => s.care_type === 'watering');
    expect(wateringSchedule.status).toBe('overdue');

    const overdueItem = careDueRes.body.data.overdue.find(
      i => i.plant_id === plant.id && i.care_type === 'watering'
    );
    expect(overdueItem).toBeDefined();
    expect(overdueItem.days_overdue).toBe(wateringSchedule.days_overdue);
  });

  it('overdue status is consistent with negative utcOffset (utcOffset=-300)', async () => {
    const { accessToken } = await createTestUser();

    // Plant watered 8 days ago with 5-day frequency → overdue by 3 days
    const plant = await createTestPlant(accessToken, {
      name: 'US Eastern Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 5, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(8));

    const utcOffset = -300; // US Eastern (UTC-5)

    const [plantsRes, careDueRes] = await Promise.all([
      request(app)
        .get(`/api/v1/plants?utcOffset=${utcOffset}`)
        .set('Authorization', `Bearer ${accessToken}`),
      request(app)
        .get(`/api/v1/care-due?utcOffset=${utcOffset}`)
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(plantsRes.status).toBe(200);
    expect(careDueRes.status).toBe(200);

    const plantData = plantsRes.body.data.find(p => p.id === plant.id);
    const wateringSchedule = plantData.care_schedules.find(s => s.care_type === 'watering');
    expect(wateringSchedule.status).toBe('overdue');

    const overdueItem = careDueRes.body.data.overdue.find(
      i => i.plant_id === plant.id && i.care_type === 'watering'
    );
    expect(overdueItem).toBeDefined();
    expect(overdueItem.days_overdue).toBe(wateringSchedule.days_overdue);
  });

  it('due_today status is consistent between both endpoints', async () => {
    const { accessToken } = await createTestUser();

    // Plant watered exactly 7 days ago with 7-day frequency → due today
    const plant = await createTestPlant(accessToken, {
      name: 'Due Today Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'watering', daysAgo(7));

    const [plantsRes, careDueRes] = await Promise.all([
      request(app)
        .get('/api/v1/plants?utcOffset=0')
        .set('Authorization', `Bearer ${accessToken}`),
      request(app)
        .get('/api/v1/care-due?utcOffset=0')
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(plantsRes.status).toBe(200);
    expect(careDueRes.status).toBe(200);

    const plantData = plantsRes.body.data.find(p => p.id === plant.id);
    const wateringSchedule = plantData.care_schedules.find(s => s.care_type === 'watering');
    expect(wateringSchedule.status).toBe('due_today');

    const dueTodayItem = careDueRes.body.data.due_today.find(
      i => i.plant_id === plant.id && i.care_type === 'watering'
    );
    expect(dueTodayItem).toBeDefined();
  });

  it('monthly frequency is consistent between both endpoints (T-116 month arithmetic fix)', async () => {
    const { accessToken } = await createTestUser();

    // Plant fertilized 35 days ago with 1-month frequency
    // Old careDue.js used 30-day months → overdue by 5 days
    // careStatus.js uses actual calendar month → may differ
    // Both must now agree
    const plant = await createTestPlant(accessToken, {
      name: 'Monthly Fern',
      care_schedules: [
        { care_type: 'fertilizing', frequency_value: 1, frequency_unit: 'months' },
      ],
    });
    await recordCareAction(accessToken, plant.id, 'fertilizing', daysAgo(35));

    const [plantsRes, careDueRes] = await Promise.all([
      request(app)
        .get('/api/v1/plants?utcOffset=0')
        .set('Authorization', `Bearer ${accessToken}`),
      request(app)
        .get('/api/v1/care-due?utcOffset=0')
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(plantsRes.status).toBe(200);
    expect(careDueRes.status).toBe(200);

    const plantData = plantsRes.body.data.find(p => p.id === plant.id);
    const fertSchedule = plantData.care_schedules.find(s => s.care_type === 'fertilizing');

    // Both endpoints must classify this the same way
    if (fertSchedule.status === 'overdue') {
      const overdueItem = careDueRes.body.data.overdue.find(
        i => i.plant_id === plant.id && i.care_type === 'fertilizing'
      );
      expect(overdueItem).toBeDefined();
      expect(overdueItem.days_overdue).toBe(fertSchedule.days_overdue);
    } else if (fertSchedule.status === 'due_today') {
      const dueTodayItem = careDueRes.body.data.due_today.find(
        i => i.plant_id === plant.id && i.care_type === 'fertilizing'
      );
      expect(dueTodayItem).toBeDefined();
    } else {
      // on_track — should be in upcoming or not present (if > 7 days out)
      const overdueItem = careDueRes.body.data.overdue.find(
        i => i.plant_id === plant.id && i.care_type === 'fertilizing'
      );
      expect(overdueItem).toBeUndefined();
      const dueTodayItem = careDueRes.body.data.due_today.find(
        i => i.plant_id === plant.id && i.care_type === 'fertilizing'
      );
      expect(dueTodayItem).toBeUndefined();
    }
  });
});
