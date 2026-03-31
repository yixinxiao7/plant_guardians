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

  /**
   * Paginated care action history for a user, optionally filtered by plant_id.
   * Returns { data, total } where data includes plant_name via JOIN.
   * (T-039)
   */
  async findPaginatedByUser(userId, { page = 1, limit = 20, plantId = null } = {}) {
    const offset = (page - 1) * limit;

    const buildBase = () => {
      const q = db('care_actions as ca')
        .join('plants as p', 'ca.plant_id', 'p.id')
        .where('p.user_id', userId);
      if (plantId) {
        q.andWhere('ca.plant_id', plantId);
      }
      return q;
    };

    const [data, [{ count }]] = await Promise.all([
      buildBase()
        .select(
          'ca.id',
          'ca.plant_id',
          'p.name as plant_name',
          'ca.care_type',
          'ca.performed_at'
        )
        .orderBy('ca.performed_at', 'desc')
        .limit(limit)
        .offset(offset),
      buildBase().count('ca.id as count'),
    ]);

    return {
      data,
      total: parseInt(count, 10),
    };
  },
  /**
   * Aggregated care action statistics for a user (T-064).
   * Returns { totalCareActions, byPlant, byCareType, recentActivity }.
   * All queries are scoped to the user's plants via JOIN.
   */
  async getStatsByUser(userId) {
    const [totalResult, byPlant, byCareType, recentActivity] = await Promise.all([
      // 1. Total care actions count
      db('care_actions as ca')
        .join('plants as p', 'ca.plant_id', 'p.id')
        .where('p.user_id', userId)
        .count('ca.id as count')
        .first(),

      // 2. Breakdown by plant: count + last_action_at, sorted by count DESC then name ASC
      db('care_actions as ca')
        .join('plants as p', 'ca.plant_id', 'p.id')
        .where('p.user_id', userId)
        .select(
          'p.id as plant_id',
          'p.name as plant_name',
          db.raw('COUNT(ca.id)::integer as count'),
          db.raw('MAX(ca.performed_at) as last_action_at')
        )
        .groupBy('p.id', 'p.name')
        .orderByRaw('COUNT(ca.id) DESC, p.name ASC'),

      // 3. Breakdown by care type: count, sorted by count DESC
      db('care_actions as ca')
        .join('plants as p', 'ca.plant_id', 'p.id')
        .where('p.user_id', userId)
        .select(
          'ca.care_type',
          db.raw('COUNT(ca.id)::integer as count')
        )
        .groupBy('ca.care_type')
        .orderByRaw('COUNT(ca.id) DESC'),

      // 4. Recent activity: last 10 care actions across all plants
      db('care_actions as ca')
        .join('plants as p', 'ca.plant_id', 'p.id')
        .where('p.user_id', userId)
        .select(
          'p.name as plant_name',
          'ca.care_type',
          'ca.performed_at'
        )
        .orderBy('ca.performed_at', 'desc')
        .limit(10),
    ]);

    return {
      total_care_actions: parseInt(totalResult.count, 10),
      by_plant: byPlant.map(row => ({
        plant_id: row.plant_id,
        plant_name: row.plant_name,
        count: parseInt(row.count, 10),
        last_action_at: row.last_action_at ? new Date(row.last_action_at).toISOString() : null,
      })),
      by_care_type: byCareType.map(row => ({
        care_type: row.care_type,
        count: parseInt(row.count, 10),
      })),
      recent_activity: recentActivity.map(row => ({
        plant_name: row.plant_name,
        care_type: row.care_type,
        performed_at: row.performed_at ? new Date(row.performed_at).toISOString() : null,
      })),
    };
  },
};

module.exports = CareAction;
