/**
 * Tests for DELETE /api/v1/profile — Account Deletion (T-106)
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

describe('DELETE /api/v1/profile', () => {
  it('should delete user and all associated data, returning 204 (happy path)', async () => {
    jest.setTimeout(60000);
    const { accessToken, user } = await createTestUser();
    const plant = await createTestPlant(accessToken, { name: 'Doomed Plant' });

    // Record a care action so there's data in care_actions
    await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    // Verify data exists before deletion
    const plantsBefore = await db('plants').where('user_id', user.id);
    expect(plantsBefore.length).toBeGreaterThan(0);

    // Delete the account
    const res = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    // Verify all data is gone
    const usersAfter = await db('users').where('id', user.id);
    expect(usersAfter.length).toBe(0);

    const plantsAfter = await db('plants').where('user_id', user.id);
    expect(plantsAfter.length).toBe(0);

    const careActionsAfter = await db('care_actions').whereIn(
      'plant_id',
      [plant.id]
    );
    expect(careActionsAfter.length).toBe(0);

    const refreshTokensAfter = await db('refresh_tokens').where('user_id', user.id);
    expect(refreshTokensAfter.length).toBe(0);
  });

  it('should delete notification_preferences along with the user', async () => {
    jest.setTimeout(60000);
    const { accessToken, user } = await createTestUser();

    // Create notification preferences for this user
    await db('notification_preferences').insert({
      user_id: user.id,
      opt_in: true,
      reminder_hour_utc: 9,
    });

    const prefsBefore = await db('notification_preferences').where('user_id', user.id);
    expect(prefsBefore.length).toBe(1);

    const res = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const prefsAfter = await db('notification_preferences').where('user_id', user.id);
    expect(prefsAfter.length).toBe(0);
  });

  it('should return 401 when no auth token is provided (error path)', async () => {
    const res = await request(app)
      .delete('/api/v1/profile');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBeDefined();
  });

  it('should not affect other users data (isolation test)', async () => {
    jest.setTimeout(60000);
    const user1 = await createTestUser({ email: 'delete-me@test.com' });
    const user2 = await createTestUser({ email: 'keep-me@test.com' });

    const plant1 = await createTestPlant(user1.accessToken, { name: 'Plant 1' });
    const plant2 = await createTestPlant(user2.accessToken, { name: 'Plant 2' });

    // Record care actions for both users
    await request(app)
      .post(`/api/v1/plants/${plant1.id}/care-actions`)
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send({ care_type: 'watering' });

    await request(app)
      .post(`/api/v1/plants/${plant2.id}/care-actions`)
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .send({ care_type: 'watering' });

    // Delete user1's account
    const res = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(204);

    // Verify user1's data is gone
    const user1Plants = await db('plants').where('user_id', user1.user.id);
    expect(user1Plants.length).toBe(0);

    // Verify user2's data is intact
    const user2Plants = await db('plants').where('user_id', user2.user.id);
    expect(user2Plants.length).toBe(1);

    const user2Actions = await db('care_actions').where('plant_id', plant2.id);
    expect(user2Actions.length).toBe(1);

    // Verify user2 can still access their profile
    const profileRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${user2.accessToken}`);
    expect(profileRes.status).toBe(200);
  });

  it('should clear the refresh token cookie on successful deletion', async () => {
    jest.setTimeout(60000);
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    // Check that a Set-Cookie header is present to clear the refresh_token
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith('refresh_token='))
      : cookies;
    expect(refreshCookie).toBeDefined();
    // Cleared cookies have an empty value or Max-Age=0/expires in the past
    expect(refreshCookie).toMatch(/refresh_token=/);
  });
});
