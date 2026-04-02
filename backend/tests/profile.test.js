/**
 * Tests for Profile endpoint (T-013)
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

describe('GET /api/v1/profile', () => {
  it('should return user profile with stats', async () => {
    // T-031: Extended timeout — the JOIN-based care_actions count + bcrypt hashing
    // in createTestUser can exceed the default 30s on cold PG connections
    jest.setTimeout(60000);
    const { accessToken, user } = await createTestUser();

    // Create a plant and do a care action
    const plant = await createTestPlant(accessToken);
    await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.full_name).toBeDefined();
    expect(res.body.data.user.email).toBeDefined();
    expect(res.body.data.stats.plant_count).toBe(1);
    expect(res.body.data.stats.total_care_actions).toBe(1);
    expect(typeof res.body.data.stats.days_as_member).toBe('number');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/profile');
    expect(res.status).toBe(401);
  });
});
