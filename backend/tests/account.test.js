/**
 * Tests for DELETE /api/v1/auth/account (T-033)
 */
const {
  app, db, request, setupDatabase, teardownDatabase, cleanTables, createTestUser, createTestPlant,
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

describe('DELETE /api/v1/auth/account', () => {
  it('should delete the authenticated user and all associated data (204)', async () => {
    const { accessToken, user } = await createTestUser();

    // Create a plant with a care schedule
    const plant = await createTestPlant(accessToken);

    // Create a care action
    await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    // Delete the account
    const res = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({}); // No body for 204

    // Verify cascade: user row is gone
    const userRow = await db('users').where('id', user.id).first();
    expect(userRow).toBeUndefined();

    // Verify cascade: plants are gone
    const plantRows = await db('plants').where('user_id', user.id);
    expect(plantRows).toHaveLength(0);

    // Verify cascade: care_schedules are gone
    const scheduleRows = await db('care_schedules').where('plant_id', plant.id);
    expect(scheduleRows).toHaveLength(0);

    // Verify cascade: care_actions are gone
    const actionRows = await db('care_actions').where('plant_id', plant.id);
    expect(actionRows).toHaveLength(0);

    // Verify cascade: refresh_tokens are gone
    const tokenRows = await db('refresh_tokens').where('user_id', user.id);
    expect(tokenRows).toHaveLength(0);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/account');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 with invalid/expired token', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should not affect other users when one account is deleted', async () => {
    const user1 = await createTestUser({ email: 'user1@example.com' });
    const user2 = await createTestUser({ email: 'user2@example.com' });

    // Both users create plants
    await createTestPlant(user1.accessToken);
    const plant2 = await createTestPlant(user2.accessToken);

    // Delete user1's account
    const res = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(204);

    // User2's data should be intact
    const user2Row = await db('users').where('id', user2.user.id).first();
    expect(user2Row).toBeDefined();

    const user2Plants = await db('plants').where('user_id', user2.user.id);
    expect(user2Plants).toHaveLength(1);

    // User2 can still access their profile
    const profileRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.stats.plant_count).toBe(1);
  });
});
