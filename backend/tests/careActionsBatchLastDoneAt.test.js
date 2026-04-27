/**
 * T-139 regression tests — POST /api/v1/care-actions/batch must sync
 * care_schedules.last_done_at after a batch insert.
 *
 * FB-113 (Major): before the fix, batch mark-done on the Care Due Dashboard
 * inserted into care_actions but left last_done_at untouched, so the My Plants
 * page (GET /api/v1/plants) continued to render plants as overdue.
 *
 * After the fix, batchCreate() mirrors the single-action path:
 *  - For each affected (plant_id, care_type), update last_done_at when the
 *    batch's newest performed_at is strictly newer than the current value.
 *  - Never regress — an older batch entry must not overwrite a more recent
 *    single-action entry.
 *  - End-to-end: GET /api/v1/plants no longer shows the plant as overdue.
 */

const {
  app,
  request,
  db,
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

/** Build an ISO date string N days ago from now (UTC noon). */
function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

describe('T-139: Batch care-actions sync care_schedules.last_done_at', () => {
  it('updates last_done_at for each affected schedule after a successful batch insert', async () => {
    const { accessToken } = await createTestUser();
    const plant1 = await createTestPlant(accessToken, {
      name: 'Batch Plant A',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });
    const plant2 = await createTestPlant(accessToken, {
      name: 'Batch Plant B',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
        { care_type: 'fertilizing', frequency_value: 1, frequency_unit: 'months' },
      ],
    });

    const nowIso = new Date().toISOString();
    const actions = [
      { plant_id: plant1.id, care_type: 'watering', performed_at: nowIso },
      { plant_id: plant2.id, care_type: 'watering', performed_at: nowIso },
      { plant_id: plant2.id, care_type: 'fertilizing', performed_at: nowIso },
    ];

    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actions });

    expect(res.status).toBe(207);
    expect(res.body.data.created_count).toBe(3);

    // Verify each schedule's last_done_at advanced to the batch performed_at
    const schedules = await db('care_schedules')
      .whereIn('plant_id', [plant1.id, plant2.id])
      .orderBy(['plant_id', 'care_type']);

    // All three schedules should now reflect the batch timestamp
    expect(schedules.length).toBe(3);
    for (const s of schedules) {
      expect(s.last_done_at).not.toBeNull();
      expect(new Date(s.last_done_at).toISOString()).toBe(nowIso);
    }
  });

  it('does NOT regress last_done_at when a batch entry is older than the current value', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, {
      name: 'Anti-regression Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });

    // First: record a recent single-action watering today (via the established
    // single-action path — guarantees last_done_at is set).
    const recentIso = new Date().toISOString();
    const single = await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', performed_at: recentIso });
    expect(single.status).toBe(201);

    // Then: submit a batch entry dated 10 days ago — older than current
    // last_done_at. batchCreate must NOT overwrite it.
    const olderIso = daysAgo(10);
    const batchRes = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actions: [
          { plant_id: plant.id, care_type: 'watering', performed_at: olderIso },
        ],
      });
    expect(batchRes.status).toBe(207);
    expect(batchRes.body.data.created_count).toBe(1);

    // Schedule's last_done_at should still be the recent (newer) value
    const [schedule] = await db('care_schedules').where({
      plant_id: plant.id,
      care_type: 'watering',
    });
    expect(schedule).toBeDefined();
    expect(new Date(schedule.last_done_at).toISOString()).toBe(recentIso);
  });

  it('end-to-end: after a batch mark-done, GET /api/v1/plants no longer shows the plant as overdue', async () => {
    const { accessToken } = await createTestUser();

    // Plant watered 10 days ago with a 3-day frequency → overdue by 7 days.
    const plant = await createTestPlant(accessToken, {
      name: 'FB-113 Repro Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 3, frequency_unit: 'days' },
      ],
    });

    // Seed an original watering 10 days ago so the plant is truly overdue.
    await request(app)
      .post(`/api/v1/plants/${plant.id}/care-actions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ care_type: 'watering', performed_at: daysAgo(10) });

    // Sanity: plant is overdue before the batch mark-done.
    const beforeRes = await request(app)
      .get('/api/v1/plants?utcOffset=0')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(beforeRes.status).toBe(200);
    const before = beforeRes.body.data.find(p => p.id === plant.id);
    const beforeWatering = before.care_schedules.find(s => s.care_type === 'watering');
    expect(beforeWatering.status).toBe('overdue');

    // Batch mark-done with "now" as performed_at (what the Care Due Dashboard does).
    const nowIso = new Date().toISOString();
    const batchRes = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actions: [
          { plant_id: plant.id, care_type: 'watering', performed_at: nowIso },
        ],
      });
    expect(batchRes.status).toBe(207);
    expect(batchRes.body.data.created_count).toBe(1);

    // After the batch fix, GET /api/v1/plants must classify the plant as
    // on_track (just watered) — NOT overdue.
    const afterRes = await request(app)
      .get('/api/v1/plants?utcOffset=0')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(afterRes.status).toBe(200);
    const after = afterRes.body.data.find(p => p.id === plant.id);
    const afterWatering = after.care_schedules.find(s => s.care_type === 'watering');
    expect(afterWatering.status).toBe('on_track');
  });

  it('picks the newest performed_at when a batch has multiple actions for the same schedule', async () => {
    const { accessToken } = await createTestUser();
    const plant = await createTestPlant(accessToken, {
      name: 'Multi-entry Plant',
      care_schedules: [
        { care_type: 'watering', frequency_value: 7, frequency_unit: 'days' },
      ],
    });

    // Batch contains two entries for the SAME (plant, care_type): one 5 days
    // ago, one today. last_done_at must land on "today" (newest), not "5 days
    // ago" — regardless of array order.
    const olderIso = daysAgo(5);
    const newerIso = new Date().toISOString();
    const res = await request(app)
      .post('/api/v1/care-actions/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actions: [
          { plant_id: plant.id, care_type: 'watering', performed_at: newerIso },
          { plant_id: plant.id, care_type: 'watering', performed_at: olderIso },
        ],
      });
    expect(res.status).toBe(207);
    expect(res.body.data.created_count).toBe(2);

    const [schedule] = await db('care_schedules').where({
      plant_id: plant.id,
      care_type: 'watering',
    });
    expect(new Date(schedule.last_done_at).toISOString()).toBe(newerIso);
  });
});
