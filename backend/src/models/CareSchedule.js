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
