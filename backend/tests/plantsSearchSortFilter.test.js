/**
 * Tests for GET /api/v1/plants Sprint 30 (T-142) updates:
 *   - search now matches name OR type/species
 *   - new `sort` query parameter (name_asc | name_desc | most_overdue | next_due_soonest)
 *   - specific validation error codes (INVALID_SEARCH_TERM, INVALID_STATUS_FILTER, INVALID_SORT_OPTION)
 *   - new top-level `status_counts` field in response
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
 * Helper: create a plant with a watering schedule whose last_done_at is set
 * to a specific date so the computed status is deterministic.
 */
async function createPlantWithStatus(accessToken, name, lastDoneAt, frequencyDays = 7, type = null) {
  const plant = await createTestPlant(accessToken, {
    name,
    type,
    care_schedules: [
      { care_type: 'watering', frequency_value: frequencyDays, frequency_unit: 'days' },
    ],
  });

  if (lastDoneAt !== undefined) {
    await db('care_schedules')
      .where('plant_id', plant.id)
      .update({ last_done_at: lastDoneAt });
  }

  return plant;
}

const daysAgoIso = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

describe('GET /api/v1/plants — search by species/type (T-142)', () => {
  it('should match against type/species when name does not match', async () => {
    const { accessToken } = await createTestUser();
    await createTestPlant(accessToken, { name: 'Bedroom Buddy', type: 'Monstera Deliciosa' });
    await createTestPlant(accessToken, { name: 'Office Friend', type: 'Snake Plant' });

    const res = await request(app)
      .get('/api/v1/plants?search=monstera')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Bedroom Buddy');
    expect(res.body.pagination.total).toBe(1);
  });

  it('should match against name OR type (substring matches in either column)', async () => {
    const { accessToken } = await createTestUser();
    // "fern" appears in name only
    await createTestPlant(accessToken, { name: 'Boston Fern', type: 'Nephrolepis' });
    // "fern" appears in type only
    await createTestPlant(accessToken, { name: 'Sword', type: 'Fern' });
    // No "fern" anywhere
    await createTestPlant(accessToken, { name: 'Cactus', type: 'Mammillaria' });

    const res = await request(app)
      .get('/api/v1/plants?search=fern')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const names = res.body.data.map((p) => p.name);
    expect(names).toContain('Boston Fern');
    expect(names).toContain('Sword');
  });

  it('should not match plants with NULL type when no match in name', async () => {
    const { accessToken } = await createTestUser();
    // Plant with NULL type and non-matching name should not surface for "monstera"
    await createTestPlant(accessToken, { name: 'Just A Plant', type: null });

    const res = await request(app)
      .get('/api/v1/plants?search=monstera')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });
});

describe('GET /api/v1/plants — sort param (T-142)', () => {
  it('should default to name_asc sort (case-insensitive A-Z)', async () => {
    const { accessToken } = await createTestUser();
    await createTestPlant(accessToken, { name: 'banana plant' });
    await createTestPlant(accessToken, { name: 'Aloe' });
    await createTestPlant(accessToken, { name: 'cactus' });

    const res = await request(app)
      .get('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.name)).toEqual(['Aloe', 'banana plant', 'cactus']);
  });

  it('should sort name_desc (Z-A)', async () => {
    const { accessToken } = await createTestUser();
    await createTestPlant(accessToken, { name: 'Aloe' });
    await createTestPlant(accessToken, { name: 'Cactus' });
    await createTestPlant(accessToken, { name: 'Begonia' });

    const res = await request(app)
      .get('/api/v1/plants?sort=name_desc')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.name)).toEqual(['Cactus', 'Begonia', 'Aloe']);
  });

  it('should sort most_overdue (largest days_overdue first)', async () => {
    const { accessToken } = await createTestUser();
    // 30 days overdue (last 37 days ago, freq 7 → 30 overdue)
    await createPlantWithStatus(accessToken, 'A_Most_Overdue', daysAgoIso(37), 7);
    // 8 days overdue (last 15 days ago, freq 7 → 8 overdue)
    await createPlantWithStatus(accessToken, 'B_Some_Overdue', daysAgoIso(15), 7);
    // On track (last 0 days ago)
    await createPlantWithStatus(accessToken, 'C_On_Track', daysAgoIso(0), 30);

    const res = await request(app)
      .get('/api/v1/plants?sort=most_overdue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((p) => p.name);
    // Most overdue first; on-track plant last (days_overdue = 0)
    expect(names[0]).toBe('A_Most_Overdue');
    expect(names[1]).toBe('B_Some_Overdue');
    expect(names[2]).toBe('C_On_Track');
  });

  it('should sort next_due_soonest (earliest next_due_at first)', async () => {
    const { accessToken } = await createTestUser();
    // Last done 37 days ago, freq 7 → next_due was 30 days ago (very soon = past)
    await createPlantWithStatus(accessToken, 'EarliestDue', daysAgoIso(37), 7);
    // Last done 0 days ago, freq 30 → next_due in 30 days (latest)
    await createPlantWithStatus(accessToken, 'LatestDue', daysAgoIso(0), 30);
    // Last done 0 days ago, freq 14 → next_due in 14 days (middle)
    await createPlantWithStatus(accessToken, 'MidDue', daysAgoIso(0), 14);

    const res = await request(app)
      .get('/api/v1/plants?sort=next_due_soonest')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.name)).toEqual(['EarliestDue', 'MidDue', 'LatestDue']);
  });

  it('should return 400 INVALID_SORT_OPTION for unknown sort value', async () => {
    const { accessToken } = await createTestUser();
    const res = await request(app)
      .get('/api/v1/plants?sort=alphabetical')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SORT_OPTION');
  });
});

describe('GET /api/v1/plants — status_counts field (T-142)', () => {
  it('should always include status_counts in the response', async () => {
    const { accessToken } = await createTestUser();
    const res = await request(app)
      .get('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status_counts).toBeDefined();
    expect(res.body.status_counts).toEqual({
      all: 0,
      overdue: 0,
      due_today: 0,
      on_track: 0,
    });
  });

  it('should compute correct status_counts across mixed statuses', async () => {
    const { accessToken } = await createTestUser();
    // 2 overdue plants
    await createPlantWithStatus(accessToken, 'OverdueA', daysAgoIso(30), 7);
    await createPlantWithStatus(accessToken, 'OverdueB', daysAgoIso(30), 7);
    // 1 on-track plant
    await createPlantWithStatus(accessToken, 'OnTrack', daysAgoIso(0), 30);
    // 1 plant with NO schedules — should count toward `all` only
    await createTestPlant(accessToken, { name: 'NoSchedulePlant', care_schedules: [] });

    const res = await request(app)
      .get('/api/v1/plants')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status_counts.all).toBe(4);
    expect(res.body.status_counts.overdue).toBe(2);
    expect(res.body.status_counts.on_track).toBe(1);
    expect(res.body.status_counts.due_today).toBe(0);
  });

  it('should scope status_counts to the search term but ignore the active status filter', async () => {
    const { accessToken } = await createTestUser();
    // Two pothos: one overdue, one on-track
    await createPlantWithStatus(accessToken, 'Golden Pothos', daysAgoIso(30), 7);
    await createPlantWithStatus(accessToken, 'Satin Pothos', daysAgoIso(0), 30);
    // One non-pothos overdue plant — should NOT appear in counts (excluded by search)
    await createPlantWithStatus(accessToken, 'Boston Fern', daysAgoIso(30), 7);

    const res = await request(app)
      .get('/api/v1/plants?search=pothos&status=overdue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    // status filter scopes data[] to the overdue pothos
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Golden Pothos');
    // status_counts is scoped to the search term ("pothos") but NOT to the status filter.
    // So counts reflect both pothos (one overdue, one on-track).
    expect(res.body.status_counts.all).toBe(2);
    expect(res.body.status_counts.overdue).toBe(1);
    expect(res.body.status_counts.on_track).toBe(1);
  });
});

describe('GET /api/v1/plants — combined search + status + sort (T-142)', () => {
  it('should apply all three params together', async () => {
    const { accessToken } = await createTestUser();
    // Two overdue ferns at different overdue depths
    await createPlantWithStatus(accessToken, 'Boston Fern', daysAgoIso(15), 7); // 8 overdue
    await createPlantWithStatus(accessToken, 'Maidenhair Fern', daysAgoIso(40), 7); // 33 overdue
    // On-track fern (filtered out by status)
    await createPlantWithStatus(accessToken, 'Asparagus Fern', daysAgoIso(0), 30);
    // Overdue non-fern (filtered out by search)
    await createPlantWithStatus(accessToken, 'Pothos', daysAgoIso(30), 7);

    const res = await request(app)
      .get('/api/v1/plants?search=fern&status=overdue&sort=most_overdue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
    // Most overdue first
    expect(res.body.data[0].name).toBe('Maidenhair Fern');
    expect(res.body.data[1].name).toBe('Boston Fern');
  });

  it('should preserve pagination over filtered + sorted results', async () => {
    const { accessToken } = await createTestUser();
    // 5 overdue plants with different overdue magnitudes
    await createPlantWithStatus(accessToken, 'P1', daysAgoIso(11), 7); // 4 overdue
    await createPlantWithStatus(accessToken, 'P2', daysAgoIso(15), 7); // 8 overdue
    await createPlantWithStatus(accessToken, 'P3', daysAgoIso(20), 7); // 13 overdue
    await createPlantWithStatus(accessToken, 'P4', daysAgoIso(25), 7); // 18 overdue
    await createPlantWithStatus(accessToken, 'P5', daysAgoIso(30), 7); // 23 overdue

    const res = await request(app)
      .get('/api/v1/plants?status=overdue&sort=most_overdue&page=1&limit=2')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    // Top of "most overdue" page 1
    expect(res.body.data.map((p) => p.name)).toEqual(['P5', 'P4']);

    const res2 = await request(app)
      .get('/api/v1/plants?status=overdue&sort=most_overdue&page=2&limit=2')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.map((p) => p.name)).toEqual(['P3', 'P2']);
  });
});

describe('GET /api/v1/plants — auth still enforced (T-142)', () => {
  it('should return 401 without auth token even with new params', async () => {
    const res = await request(app)
      .get('/api/v1/plants?search=fern&status=overdue&sort=most_overdue');

    expect(res.status).toBe(401);
  });

  it('should not leak other users plants via search', async () => {
    const { accessToken: tokenA } = await createTestUser({ email: `a-${Date.now()}@example.com` });
    const { accessToken: tokenB } = await createTestUser({ email: `b-${Date.now()}@example.com` });

    await createTestPlant(tokenA, { name: 'Alice Pothos' });
    await createTestPlant(tokenB, { name: 'Bob Pothos' });

    const res = await request(app)
      .get('/api/v1/plants?search=pothos')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Alice Pothos');
    expect(res.body.status_counts.all).toBe(1);
  });
});
