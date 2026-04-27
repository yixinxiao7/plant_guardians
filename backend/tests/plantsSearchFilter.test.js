/**
 * Tests for GET /api/v1/plants search & status filter (T-083, Sprint 18)
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
 * Helper: create a plant and set its watering schedule's last_done_at to a
 * specific date so we can control its computed status.
 */
async function createPlantWithStatus(accessToken, name, lastDoneAt, frequencyDays = 7) {
  const plant = await createTestPlant(accessToken, {
    name,
    type: 'Test',
    care_schedules: [
      { care_type: 'watering', frequency_value: frequencyDays, frequency_unit: 'days' },
    ],
  });

  // Update the schedule's last_done_at directly in the DB
  if (lastDoneAt !== undefined) {
    await db('care_schedules')
      .where('plant_id', plant.id)
      .update({ last_done_at: lastDoneAt });
  }

  return plant;
}

describe('GET /api/v1/plants — search filter (T-083)', () => {
  it('should filter plants by name substring (case-insensitive)', async () => {
    const { accessToken } = await createTestUser();
    // T-142 (Sprint 30): search now also matches `type`, so explicitly override
    // type to avoid `pothos` accidentally matching via the default 'Pothos' type.
    await createTestPlant(accessToken, { name: 'Golden Pothos', type: 'Houseplant' });
    await createTestPlant(accessToken, { name: 'Spider Plant', type: 'Houseplant' });
    await createTestPlant(accessToken, { name: 'Satin Pothos', type: 'Houseplant' });

    const res = await request(app)
      .get('/api/v1/plants?search=pothos')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
    const names = res.body.data.map((p) => p.name);
    expect(names).toContain('Golden Pothos');
    expect(names).toContain('Satin Pothos');
  });

  it('should return empty array when search matches nothing', async () => {
    const { accessToken } = await createTestUser();
    await createTestPlant(accessToken, { name: 'Monstera' });

    const res = await request(app)
      .get('/api/v1/plants?search=cactus')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it('should return 400 when search exceeds 200 characters', async () => {
    const { accessToken } = await createTestUser();
    const longSearch = 'a'.repeat(201);

    const res = await request(app)
      .get(`/api/v1/plants?search=${longSearch}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    // T-142 (Sprint 30): error code now specific
    expect(res.body.error.code).toBe('INVALID_SEARCH_TERM');
  });

  it('should trim whitespace from search and treat empty as no filter', async () => {
    const { accessToken } = await createTestUser();
    await createTestPlant(accessToken, { name: 'Fern' });

    const res = await request(app)
      .get('/api/v1/plants?search=%20%20%20')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    // Empty search after trim = no filter, returns all plants
    expect(res.body.data.length).toBe(1);
  });
});

describe('GET /api/v1/plants — status filter (T-083)', () => {
  it('should filter plants by overdue status', async () => {
    const { accessToken } = await createTestUser();
    // Overdue: last watered 30 days ago, frequency 7 days
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await createPlantWithStatus(accessToken, 'Overdue Plant', overdueDate, 7);

    // On track: last watered today, frequency 7 days
    const recentDate = new Date().toISOString();
    await createPlantWithStatus(accessToken, 'On Track Plant', recentDate, 7);

    const res = await request(app)
      .get('/api/v1/plants?status=overdue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Overdue Plant');
    expect(res.body.pagination.total).toBe(1);
  });

  it('should filter plants by on_track status', async () => {
    const { accessToken } = await createTestUser();
    // Overdue plant
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await createPlantWithStatus(accessToken, 'Overdue Plant', overdueDate, 7);

    // On track: last watered today, frequency 30 days
    const recentDate = new Date().toISOString();
    await createPlantWithStatus(accessToken, 'On Track Plant', recentDate, 30);

    const res = await request(app)
      .get('/api/v1/plants?status=on_track')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('On Track Plant');
  });

  it('should return 400 for invalid status value', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants?status=healthy')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    // T-142 (Sprint 30): error code now specific
    expect(res.body.error.code).toBe('INVALID_STATUS_FILTER');
  });

  it('should exclude plants with zero care schedules from status filter results', async () => {
    const { accessToken } = await createTestUser();
    // Plant with no care schedules
    await createTestPlant(accessToken, { name: 'No Schedule Plant', care_schedules: [] });

    // Overdue plant with schedule
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await createPlantWithStatus(accessToken, 'Overdue Plant', overdueDate, 7);

    const res = await request(app)
      .get('/api/v1/plants?status=overdue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Overdue Plant');
  });
});

describe('GET /api/v1/plants — combined search + status (T-083)', () => {
  it('should AND search and status filters together', async () => {
    const { accessToken } = await createTestUser();
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentDate = new Date().toISOString();

    // Overdue pothos
    await createPlantWithStatus(accessToken, 'Golden Pothos', overdueDate, 7);
    // On-track pothos
    await createPlantWithStatus(accessToken, 'Satin Pothos', recentDate, 30);
    // Overdue fern
    await createPlantWithStatus(accessToken, 'Boston Fern', overdueDate, 7);

    const res = await request(app)
      .get('/api/v1/plants?search=pothos&status=overdue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Golden Pothos');
    expect(res.body.pagination.total).toBe(1);
  });
});

describe('GET /api/v1/plants — utcOffset validation (T-083)', () => {
  it('should return 400 for utcOffset out of range', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants?utcOffset=900')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for non-integer utcOffset', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants?utcOffset=abc')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should accept valid utcOffset without error', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants?utcOffset=-300')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/plants — pagination with filters (T-083)', () => {
  it('should paginate filtered results correctly', async () => {
    const { accessToken } = await createTestUser();
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create 3 overdue plants
    await createPlantWithStatus(accessToken, 'Overdue A', overdueDate, 7);
    await createPlantWithStatus(accessToken, 'Overdue B', overdueDate, 7);
    await createPlantWithStatus(accessToken, 'Overdue C', overdueDate, 7);

    // On-track plant (should be excluded)
    const recentDate = new Date().toISOString();
    await createPlantWithStatus(accessToken, 'On Track', recentDate, 30);

    const res = await request(app)
      .get('/api/v1/plants?status=overdue&page=1&limit=2')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);

    // Page 2
    const res2 = await request(app)
      .get('/api/v1/plants?status=overdue&page=2&limit=2')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBe(1);
    expect(res2.body.pagination.total).toBe(3);
  });
});
