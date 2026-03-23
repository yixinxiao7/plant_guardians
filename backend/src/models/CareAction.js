const db = require('../config/database');

const CareAction = {
  /**
   * Create a new care action record.
   */
  async create({ plant_id, care_type, performed_at, note }) {
    const [action] = await db('care_actions')
      .insert({
        plant_id,
        care_type,
        performed_at: performed_at || new Date().toISOString(),
        note: note || null,
      })
      .returning('*');
    return action;
  },

  /**
   * Find the most recent care actions for a plant (for Plant Detail screen).
   */
  async findRecentByPlantId(plantId, limit = 5) {
    return db('care_actions')
      .where('plant_id', plantId)
      .orderBy('performed_at', 'desc')
      .limit(limit);
  },

  /**
   * Find a care action by ID and plant.
   */
  async findByIdAndPlant(actionId, plantId) {
    return db('care_actions')
      .where({ id: actionId, plant_id: plantId })
      .first();
  },

  /**
   * Delete a care action.
   */
  async delete(actionId) {
    return db('care_actions')
      .where('id', actionId)
      .del();
  },

  /**
   * Find the most recent action for a given plant + care type (used after undo to revert last_done_at).
   */
  async findLatestByPlantAndType(plantId, careType) {
    return db('care_actions')
      .where({ plant_id: plantId, care_type: careType })
      .orderBy('performed_at', 'desc')
      .first();
  },

  /**
   * Count all care actions for a user (across all their plants).
   */
  async countByUserId(userId) {
    const [{ count }] = await db('care_actions')
      .join('plants', 'care_actions.plant_id', 'plants.id')
      .where('plants.user_id', userId)
      .count('care_actions.id as count');
    return parseInt(count, 10);
  },
};

module.exports = CareAction;
