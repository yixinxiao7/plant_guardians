const db = require('../config/database');

const CareSchedule = {
  /**
   * Create care schedules for a plant.
   */
  async createMany(plantId, schedules) {
    if (!schedules || schedules.length === 0) return [];

    const rows = schedules.map((s) => ({
      plant_id: plantId,
      care_type: s.care_type,
      frequency_value: s.frequency_value,
      frequency_unit: s.frequency_unit,
      last_done_at: s.last_done_at || new Date().toISOString(),
    }));

    return db('care_schedules')
      .insert(rows)
      .returning('*');
  },

  /**
   * Find all care schedules for a plant.
   */
  async findByPlantId(plantId) {
    return db('care_schedules')
      .where('plant_id', plantId)
      .orderBy('care_type');
  },

  /**
   * Find all care schedules for multiple plants (batch load).
   */
  async findByPlantIds(plantIds) {
    if (plantIds.length === 0) return [];
    return db('care_schedules')
      .whereIn('plant_id', plantIds)
      .orderBy('care_type');
  },

  /**
   * Find a specific schedule by plant and care type.
   */
  async findByPlantAndType(plantId, careType) {
    return db('care_schedules')
      .where({ plant_id: plantId, care_type: careType })
      .first();
  },

  /**
   * Replace all care schedules for a plant (delete existing, insert new).
   */
  async replaceForPlant(plantId, schedules) {
    return db.transaction(async (trx) => {
      await trx('care_schedules').where('plant_id', plantId).del();

      if (!schedules || schedules.length === 0) return [];

      const rows = schedules.map((s) => ({
        plant_id: plantId,
        care_type: s.care_type,
        frequency_value: s.frequency_value,
        frequency_unit: s.frequency_unit,
        last_done_at: s.last_done_at || new Date().toISOString(),
      }));

      return trx('care_schedules').insert(rows).returning('*');
    });
  },

  /**
   * Find all care schedules for a user with the most recent care action per (plant, care_type).
   * Used by the Care Due Dashboard (T-043).
   * Returns rows with: plant_id, plant_name, care_type, frequency_value, frequency_unit,
   *   plant_created_at, last_done_at (MAX performed_at or null).
   */
  async findAllWithLastAction(userId) {
    return db('care_schedules as cs')
      .join('plants as p', 'cs.plant_id', 'p.id')
      .leftJoin('care_actions as ca', function () {
        this.on('ca.plant_id', '=', 'cs.plant_id')
          .andOn('ca.care_type', '=', 'cs.care_type');
      })
      .where('p.user_id', userId)
      .groupBy('cs.plant_id', 'p.name', 'cs.care_type', 'cs.frequency_value', 'cs.frequency_unit', 'p.created_at')
      .select(
        'cs.plant_id',
        'p.name as plant_name',
        'cs.care_type',
        'cs.frequency_value',
        'cs.frequency_unit',
        'p.created_at as plant_created_at',
        db.raw('MAX(ca.performed_at) as last_done_at')
      );
  },

  /**
   * Update the last_done_at for a schedule.
   */
  async updateLastDoneAt(scheduleId, lastDoneAt) {
    const [updated] = await db('care_schedules')
      .where('id', scheduleId)
      .update({
        last_done_at: lastDoneAt,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return updated;
  },
};

module.exports = CareSchedule;
