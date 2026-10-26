/**
 * Tests for GET /api/health.
 *
 * The health endpoint runs SELECT 1 so the keepalive workflow registers as
 * database activity on Supabase. It returns 503 when the database is unreachable.
 */
const { app, db, request, setupDatabase, teardownDatabase } = require('./setup');

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

describe('GET /api/health', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 200 with status ok when the database responds', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return 503 when the database is unreachable', async () => {
    // knex.raw is read-only, so fail the query at connection acquisition instead
    jest.spyOn(db.client, 'acquireConnection').mockRejectedValueOnce(new Error('connection refused'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.database).toBe('unreachable');
  });
});
