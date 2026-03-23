/**
 * Tests for Care Actions endpoints (T-012)
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

describe('POST /api/v1/plants/:id/care-actions', () => {
  it('should record a care action and update schedule', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    expect(res.status).toBe(201);
    expect(res.body.data.care_action).toBeDefined();
    expect(res.body.data.care_action.care_type).toBe('watering');
    expect(res.body.data.updated_schedule).toBeDefined();
    expect(res.body.data.updated_schedule.status).toBe('on_track');
  });

  it('should return 422 when no schedule exists for care type', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, {
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'repotting' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('NO_SCHEDULE_FOR_CARE_TYPE');
  });

  it('should return 400 for future performed_at', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const res = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        care_type: 'watering',
        performed_at: futureDate.toISOString(),
      });

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent plant', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/plants/00000000-0000-4000-a000-000000000000/care-actions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/plants/:id/care-actions/:action_id', () => {
  it('should delete a care action and revert schedule', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    // Create an action
    const createRes = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering' });

    const actionId = createRes.body.data.care_action.id;

    // Delete it
    const res = await request(app)
      .delete(`/api/v1/plants/${plant.id}/care-actions/${actionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted_action_id).toBe(actionId);
    expect(res.body.data.updated_schedule).toBeDefined();
  });

  it('should return 404 for non-existent action', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken);

    const res = await request(app)
      .delete(`/api/v1/plants/${plant.id}/care-actions/00000000-0000-4000-a000-000000000000`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ACTION_NOT_FOUND');
  });
});
