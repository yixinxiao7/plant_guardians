/**
 * Tests for Plant Sharing endpoints (T-126, Sprint 28)
 *
 * Covers:
 *   - POST /api/v1/plants/:plantId/share        (auth required, idempotent)
 *   - GET  /api/v1/public/plants/:shareToken    (no auth required)
 *
 * Acceptance: ≥ 6 tests covering happy path, idempotency, ownership,
 * unauthenticated, public happy path, and 404 for unknown token.
 */

const {
  app,
  request,
  setupDatabase,
  teardownDatabase,
  cleanTables,
  createTestUser,
  createTestPlant,
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

describe('POST /api/v1/plants/:plantId/share', () => {
  it('returns 200 with a share_url for an owned plant (happy path)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.share_url).toBe('string');

    // Share URL must contain a /plants/share/<token> segment
    const match = res.body.data.share_url.match(/\/plants\/share\/([A-Za-z0-9_-]+)$/);
    expect(match).not.toBeNull();
    const token = match[1];

    // 32 random bytes → base64url → 43 chars
    expect(token.length).toBe(43);
    // base64url alphabet only — no +, /, or = padding
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('is idempotent — repeated calls return the same share_url', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const first = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    const second = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    const third = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(200);
    expect(second.body.data.share_url).toBe(first.body.data.share_url);
    expect(third.body.data.share_url).toBe(first.body.data.share_url);
  });

  it('returns 403 FORBIDDEN when the plant belongs to another user', async () => {
    const owner = await createTestUser({ email: `owner-${Date.now()}@example.com` });
    const intruder = await createTestUser({ email: `intruder-${Date.now()}@example.com` });
    const plantRes = await request(app)
      .post('/api/v1/plants')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Owned Plant',
        care_schedules: [{ care_type: 'watering', frequency_value: 7, frequency_unit: 'days' }],
      });
    expect(plantRes.status).toBe(201);
    const plant = plantRes.body.data;

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${intruder.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app).post(`/api/v1/plants/${plant.id}/share`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when the plant does not exist', async () => {
    const { accessToken } = await createTestUser();
    // Valid UUID format but no such plant
    const fakeId = '00000000-0000-4000-8000-000000000000';

    const res = await request(app)
      .post(`/api/v1/plants/${fakeId}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLANT_NOT_FOUND');
  });

  it('returns 400 VALIDATION_ERROR when plantId is not a valid UUID', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/plants/not-a-uuid/share')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/public/plants/:shareToken', () => {
  it('returns 200 with public plant data — no auth required (happy path)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, {
      name: 'Monstie',
      type: 'Monstera Deliciosa',
      notes: 'Bright indirect light, well-draining soil.',
      care_schedules: [
        { care_type: 'watering', frequency_value: 1, frequency_unit: 'weeks' }, // 7 days
        { care_type: 'fertilizing', frequency_value: 1, frequency_unit: 'months' }, // 30 days
      ],
    });

    const create = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(create.status).toBe(200);

    const token = create.body.data.share_url.match(/\/plants\/share\/([A-Za-z0-9_-]+)$/)[1];

    // Note: NO Authorization header on the public GET
    const res = await request(app).get(`/api/v1/public/plants/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      name: 'Monstie',
      species: 'Monstera Deliciosa',
      photo_url: null,
      watering_frequency_days: 7,
      fertilizing_frequency_days: 30,
      repotting_frequency_days: null,
      ai_care_notes: 'Bright indirect light, well-draining soil.',
    });

    // Privacy boundary — none of these private fields may leak
    expect(res.body.data.user_id).toBeUndefined();
    expect(res.body.data.id).toBeUndefined();
    expect(res.body.data.created_at).toBeUndefined();
    expect(res.body.data.updated_at).toBeUndefined();
    expect(res.body.data.last_done_at).toBeUndefined();
    expect(res.body.data.recent_care_actions).toBeUndefined();
  });

  it('returns 404 NOT_FOUND for an unknown share token', async () => {
    const res = await request(app).get('/api/v1/public/plants/this-token-does-not-exist-1234567890');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 after the underlying plant is deleted (cascade)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const create = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    const token = create.body.data.share_url.match(/\/plants\/share\/([A-Za-z0-9_-]+)$/)[1];

    // Sanity: token resolves while the plant exists
    const before = await request(app).get(`/api/v1/public/plants/${token}`);
    expect(before.status).toBe(200);

    // Delete the plant — should CASCADE delete the share row
    const del = await request(app)
      .delete(`/api/v1/plants/${plant.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(200);

    const after = await request(app).get(`/api/v1/public/plants/${token}`);
    expect(after.status).toBe(404);
    expect(after.body.error.code).toBe('NOT_FOUND');
  });

  it('returns null for fields the owner did not set (species, photo, schedules, notes)', async () => {
    const { accessToken } = await createTestUser();
    // Plant with only required fields — no type, no notes, no schedules
    const plant = await createTestPlant(accessToken, {
      name: 'Mystery Plant',
      type: undefined,
      notes: undefined,
      care_schedules: [],
    });

    const create = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    const token = create.body.data.share_url.match(/\/plants\/share\/([A-Za-z0-9_-]+)$/)[1];

    const res = await request(app).get(`/api/v1/public/plants/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Mystery Plant');
    expect(res.body.data.species).toBeNull();
    expect(res.body.data.photo_url).toBeNull();
    expect(res.body.data.watering_frequency_days).toBeNull();
    expect(res.body.data.fertilizing_frequency_days).toBeNull();
    expect(res.body.data.repotting_frequency_days).toBeNull();
    expect(res.body.data.ai_care_notes).toBeNull();
  });
});
