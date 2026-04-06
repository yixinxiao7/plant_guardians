/**
 * Tests for Care Actions notes field (T-097)
 *
 * Validates that POST /api/v1/plants/:id/care-actions correctly handles
 * the optional `notes` field: trimming, max-length, normalization to null,
 * and backward compatibility when omitted.
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

describe('POST /api/v1/plants/:id/care-actions — notes field (T-097)', () => {
  it('should persist a valid notes string and return it trimmed in the response', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', notes: '  Soil was very dry today  ' });

    expect(res.status).toBe(201);
    expect(res.body.data.care_action.notes).toBe('Soil was very dry today');
  });

  it('should return notes as null when notes is omitted (backward compatibility)', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    expect(res.status).toBe(201);
    expect(res.body.data.care_action.notes).toBeNull();
  });

  it('should normalize whitespace-only notes to null', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', notes: '     ' });

    expect(res.status).toBe(201);
    expect(res.body.data.care_action.notes).toBeNull();
  });

  it('should normalize empty string notes to null', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', notes: '' });

    expect(res.status).toBe(201);
    expect(res.body.data.care_action.notes).toBeNull();
  });

  it('should return 400 when notes exceeds 280 characters after trimming', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const longNote = 'a'.repeat(281);
    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', notes: longNote });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/280/);
  });

  it('should accept notes at exactly 280 characters', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const exactNote = 'b'.repeat(280);
    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', notes: exactNote });

    expect(res.status).toBe(201);
    expect(res.body.data.care_action.notes).toBe(exactNote);
  });

  it('should normalize explicit null notes to null', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', notes: null });

    expect(res.status).toBe(201);
    expect(res.body.data.care_action.notes).toBeNull();
  });
});
