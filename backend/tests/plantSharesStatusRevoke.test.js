/**
 * T-133 tests — Share Status + Revocation endpoints (Sprint 29).
 *
 * Covers:
 *   - GET    /api/v1/plants/:plantId/share    (auth required)
 *   - DELETE /api/v1/plants/:plantId/share    (auth required)
 *
 * API contract reference: `.workflow/api-contracts.md` → Sprint 29 GROUP 2.
 * UX reference:           SPEC-023 (Approved).
 *
 * Acceptance (from dev-cycle-tracker): ≥ 6 new tests covering GET happy path
 * + 404 no-share + 403 wrong owner, and DELETE happy path + 404 no-share +
 * 403 wrong owner. Extra auth/validation tests are included to fully satisfy
 * the security checklist (401 + 400).
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

/** Create a plant and open a share for it. Returns { plant, share_url, token }. */
async function createSharedPlant(accessToken, plantOverrides = {}) {
  const plant = await createTestPlant(accessToken, plantOverrides);
  const res = await request(app)
    .post(`/api/v1/plants/${plant.id}/share`)
    .set('Authorization', `Bearer ${accessToken}`);
  if (res.status !== 200) {
    throw new Error(`Failed to create share: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const share_url = res.body.data.share_url;
  const token = share_url.match(/\/plants\/share\/([A-Za-z0-9_-]+)$/)[1];
  return { plant, share_url, token };
}

// ─── GET /api/v1/plants/:plantId/share ─────────────────────────────────────

describe('GET /api/v1/plants/:plantId/share', () => {
  it('returns 200 + { share_url } when an active share exists (happy path)', async () => {
    const { accessToken } = await createTestUser();
    const { plant, share_url } = await createSharedPlant(accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.share_url).toBe(share_url);

    // Shape: share_url matches the canonical /plants/share/<token> pattern
    const match = res.body.data.share_url.match(/\/plants\/share\/([A-Za-z0-9_-]+)$/);
    expect(match).not.toBeNull();
    expect(match[1].length).toBe(43); // 32 bytes base64url → 43 chars

    // Privacy boundary: no stray fields leak beyond share_url
    expect(Object.keys(res.body.data)).toEqual(['share_url']);
  });

  it('returns 404 NOT_FOUND when the plant is owned but has no share row', async () => {
    const { accessToken } = await createTestUser();
    // Plant exists + owned, but no POST /share was called.
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 FORBIDDEN when the plant belongs to another user', async () => {
    const owner = await createTestUser({ email: `owner-${Date.now()}@example.com` });
    const intruder = await createTestUser({ email: `intruder-${Date.now()}@example.com` });
    const { plant } = await createSharedPlant(owner.accessToken);

    const res = await request(app)
      .get(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${intruder.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 UNAUTHORIZED when no Authorization header is provided', async () => {
    const { accessToken } = await createTestUser();
    const { plant } = await createSharedPlant(accessToken);

    const res = await request(app).get(`/api/v1/plants/${plant.id}/share`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 VALIDATION_ERROR when plantId is not a valid UUID', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/plants/not-a-uuid/share')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 NOT_FOUND when plantId is a valid UUID that does not exist', async () => {
    const { accessToken } = await createTestUser();
    // Valid UUID v4 format but no such plant — unified 404 (no enumeration).
    const fakeId = '00000000-0000-4000-8000-000000000000';

    const res = await request(app)
      .get(`/api/v1/plants/${fakeId}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/v1/plants/:plantId/share ─────────────────────────────────

describe('DELETE /api/v1/plants/:plantId/share', () => {
  it('returns 204 No Content on successful revocation; GET afterwards returns 404', async () => {
    const { accessToken } = await createTestUser();
    const { plant, token } = await createSharedPlant(accessToken);

    // Pre-check: the share works publicly before revocation.
    const pre = await request(app).get(`/api/v1/public/plants/${token}`);
    expect(pre.status).toBe(200);

    const del = await request(app)
      .delete(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(del.status).toBe(204);
    // 204 must have no body — supertest parses an empty string into {}
    expect(del.body).toEqual({});
    expect(del.text).toBe('');

    // GET status endpoint now returns 404 (revocation transitions UI to NOT_SHARED)
    const afterGet = await request(app)
      .get(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(afterGet.status).toBe(404);

    // The public link with the old token now returns 404.
    const afterPublic = await request(app).get(`/api/v1/public/plants/${token}`);
    expect(afterPublic.status).toBe(404);
  });

  it('returns 404 NOT_FOUND when the plant is owned but has no share row', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .delete(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 FORBIDDEN when the plant belongs to another user', async () => {
    const owner = await createTestUser({ email: `owner-${Date.now()}@example.com` });
    const intruder = await createTestUser({ email: `intruder-${Date.now()}@example.com` });
    const { plant } = await createSharedPlant(owner.accessToken);

    const res = await request(app)
      .delete(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${intruder.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');

    // Double-check the share was NOT deleted: owner can still GET it.
    const stillThere = await request(app)
      .get(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(stillThere.status).toBe(200);
  });

  it('returns 401 UNAUTHORIZED when no Authorization header is provided', async () => {
    const { accessToken } = await createTestUser();
    const { plant } = await createSharedPlant(accessToken);

    const res = await request(app).delete(`/api/v1/plants/${plant.id}/share`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 VALIDATION_ERROR when plantId is not a valid UUID', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .delete('/api/v1/plants/not-a-uuid/share')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('is idempotent from a UX perspective: second DELETE returns 404 cleanly', async () => {
    const { accessToken } = await createTestUser();
    const { plant } = await createSharedPlant(accessToken);

    const first = await request(app)
      .delete(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(first.status).toBe(204);

    const second = await request(app)
      .delete(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(second.status).toBe(404);
    expect(second.body.error.code).toBe('NOT_FOUND');
  });

  it('allows re-sharing after revocation (POST creates a fresh token)', async () => {
    const { accessToken } = await createTestUser();
    const { plant, token: firstToken } = await createSharedPlant(accessToken);

    // Revoke
    const del = await request(app)
      .delete(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(204);

    // Re-share — POST /share is idempotent but since the row was deleted,
    // it should create a new row with a new token.
    const reshare = await request(app)
      .post(`/api/v1/plants/${plant.id}/share`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(reshare.status).toBe(200);
    const secondToken = reshare.body.data.share_url.match(/\/plants\/share\/([A-Za-z0-9_-]+)$/)[1];
    expect(secondToken).not.toBe(firstToken); // fresh token
    expect(secondToken.length).toBe(43);

    // Old token is dead.
    const oldPublic = await request(app).get(`/api/v1/public/plants/${firstToken}`);
    expect(oldPublic.status).toBe(404);

    // New token resolves.
    const newPublic = await request(app).get(`/api/v1/public/plants/${secondToken}`);
    expect(newPublic.status).toBe(200);
  });
});
