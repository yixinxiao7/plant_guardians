/**
 * Tests for Notification Preferences & Unsubscribe endpoints (T-101, Sprint 22)
 */
const {
  app, db, request, setupDatabase, teardownDatabase, cleanTables, createTestUser, createTestPlant,
} = require('./setup');

// Set UNSUBSCRIBE_SECRET for testing
process.env.UNSUBSCRIBE_SECRET = 'test-unsubscribe-secret';

const crypto = require('crypto');

function generateTestUnsubscribeToken(userId) {
  const hmac = crypto.createHmac('sha256', process.env.UNSUBSCRIBE_SECRET);
  hmac.update(userId);
  return hmac.digest('base64url');
}

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

beforeEach(async () => {
  await cleanTables();
});

// ── GET /api/v1/profile/notification-preferences ──────────────────────────

describe('GET /api/v1/profile/notification-preferences', () => {
  it('should return default preferences for a new user (auto-creates row)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      opt_in: false,
      reminder_hour_utc: 8,
    });
  });

  it('should return existing preferences if already set', async () => {
    const { accessToken, user } = await createTestUser();

    // Insert a preference row directly
    await db('notification_preferences').insert({
      user_id: user.id,
      opt_in: true,
      reminder_hour_utc: 18,
    });

    const res = await request(app)
      .get('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.opt_in).toBe(true);
    expect(res.body.data.reminder_hour_utc).toBe(18);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .get('/api/v1/profile/notification-preferences');

    expect(res.status).toBe(401);
  });
});

// ── POST /api/v1/profile/notification-preferences ─────────────────────────

describe('POST /api/v1/profile/notification-preferences', () => {
  it('should update opt_in and reminder_hour_utc', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ opt_in: true, reminder_hour_utc: 12 });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      opt_in: true,
      reminder_hour_utc: 12,
    });
  });

  it('should allow partial update (only opt_in)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ opt_in: true });

    expect(res.status).toBe(200);
    expect(res.body.data.opt_in).toBe(true);
    expect(res.body.data.reminder_hour_utc).toBe(8); // default retained
  });

  it('should allow partial update (only reminder_hour_utc)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reminder_hour_utc: 18 });

    expect(res.status).toBe(200);
    expect(res.body.data.opt_in).toBe(false); // default retained
    expect(res.body.data.reminder_hour_utc).toBe(18);
  });

  it('should return 400 when body is empty', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid reminder_hour_utc (out of range)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reminder_hour_utc: 25 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for non-integer reminder_hour_utc', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reminder_hour_utc: 8.5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for non-boolean opt_in', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ opt_in: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/profile/notification-preferences')
      .send({ opt_in: true });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/v1/unsubscribe ───────────────────────────────────────────────

describe('GET /api/v1/unsubscribe', () => {
  it('should unsubscribe a user with a valid token', async () => {
    const { user } = await createTestUser();

    // Opt the user in first
    await db('notification_preferences').insert({
      user_id: user.id,
      opt_in: true,
      reminder_hour_utc: 8,
    });

    const token = generateTestUnsubscribeToken(user.id);

    const res = await request(app)
      .get(`/api/v1/unsubscribe?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('unsubscribed');

    // Verify opt_in is now false
    const pref = await db('notification_preferences').where('user_id', user.id).first();
    expect(pref.opt_in).toBe(false);
  });

  it('should return 400 when token is missing', async () => {
    const res = await request(app)
      .get('/api/v1/unsubscribe');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 400 for an invalid HMAC token', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .get(`/api/v1/unsubscribe?token=invalid-token&uid=${user.id}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

// ── POST /api/v1/admin/trigger-reminders ──────────────────────────────────

describe('POST /api/v1/admin/trigger-reminders', () => {
  it('should trigger reminders and return stats', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/admin/trigger-reminders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ hour_utc: 8 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('triggered_at');
    expect(res.body.data).toHaveProperty('hour_utc', 8);
    expect(res.body.data).toHaveProperty('users_evaluated');
    expect(res.body.data).toHaveProperty('emails_sent');
    expect(res.body.data).toHaveProperty('users_skipped');
  });

  it('should return 400 for invalid hour_utc', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/admin/trigger-reminders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ hour_utc: 30 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/admin/trigger-reminders')
      .send({ hour_utc: 8 });

    expect(res.status).toBe(401);
  });
});
