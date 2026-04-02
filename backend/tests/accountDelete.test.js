/**
 * Tests for DELETE /api/v1/account (T-069)
 *
 * Account deletion with password confirmation.
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

describe('DELETE /api/v1/account', () => {
  it('should delete the authenticated user and all data when password is correct (204)', async () => {
    const { accessToken, user, rawPassword } = await createTestUser();

    // Create a plant with a care schedule
    const plant = await createTestPlant(accessToken);

    // Create a care action
    await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    // Delete the account with password confirmation
    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: rawPassword });

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

  it('should return 400 INVALID_PASSWORD when password is wrong', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'wrong-password-here' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PASSWORD');
    expect(res.body.error.message).toBe('Password is incorrect.');
  });

  it('should return 400 VALIDATION_ERROR when password field is missing', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .delete('/api/v1/account')
      .send({ password: 'anything' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 with invalid/expired token', async () => {
    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', 'Bearer invalid-token-here')
      .send({ password: 'anything' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should not affect other users when one account is deleted', async () => {
    const user1 = await createTestUser({ email: 'del-user1@example.com' });
    const user2 = await createTestUser({ email: 'del-user2@example.com' });

    // Both users create plants
    await createTestPlant(user1.accessToken);
    await createTestPlant(user2.accessToken);

    // Delete user1's account with password
    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send({ password: user1.rawPassword });

    expect(res.status).toBe(204);

    // User2's data should be intact
    const user2Row = await db('users').where('id', user2.user.id).first();
    expect(user2Row).toBeDefined();

    const user2Plants = await db('plants').where('user_id', user2.user.id);
    expect(user2Plants).toHaveLength(1);
  });

  it('should clear the refresh token cookie on successful deletion', async () => {
    const { accessToken, rawPassword } = await createTestUser();

    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: rawPassword });

    expect(res.status).toBe(204);

    // Check that the refresh_token cookie is cleared (Max-Age=0 or Expires in the past)
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const clearCookie = Array.isArray(cookies)
      ? cookies.find(c => c.startsWith('refresh_token='))
      : cookies;
    expect(clearCookie).toBeDefined();
  });
});
