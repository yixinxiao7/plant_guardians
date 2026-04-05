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

  /**
   * Compute care streak data for a user (T-090).
   *
   * Returns { currentStreak, longestStreak, lastActionDate }.
   * All date calculations are offset by utcOffsetMinutes so "today" matches
   * the user's local calendar day.
   *
   * @param {string} userId - UUID of the authenticated user
   * @param {number} utcOffsetMinutes - Minutes to offset UTC (e.g., -300 for EST)
   * @returns {Promise<{currentStreak: number, longestStreak: number, lastActionDate: string|null}>}
   */
  async getStreakByUser(userId, utcOffsetMinutes = 0) {
    // Fetch all distinct local-date days on which the user logged ≥1 care action,
    // ordered descending. We shift performed_at by the utcOffset to bucket into
    // the user's local calendar day.
    const rows = await db('care_actions as ca')
      .join('plants as p', 'ca.plant_id', 'p.id')
      .where('p.user_id', userId)
      .select(
        db.raw(
          `DISTINCT DATE(ca.performed_at + (? || ' minutes')::interval) as action_date`,
          [utcOffsetMinutes]
        )
      )
      .orderBy('action_date', 'desc');

    if (rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActionDate: null };
    }

    // Parse dates into simple YYYY-MM-DD strings and Date objects for arithmetic
    const dates = rows.map(r => {
      const d = new Date(r.action_date);
      return {
        str: d.toISOString().slice(0, 10),
        time: d.getTime(),
      };
    });

    const ONE_DAY_MS = 86400000;

    // Compute "today" in the user's local timezone
    const nowUtc = new Date();
    const localNow = new Date(nowUtc.getTime() + utcOffsetMinutes * 60000);
    const todayStr = localNow.toISOString().slice(0, 10);
    const yesterdayStr = new Date(localNow.getTime() - ONE_DAY_MS).toISOString().slice(0, 10);

    // lastActionDate is the most recent action date (already sorted desc)
    const lastActionDate = dates[0].str;

    // Current streak: starts from today or yesterday, counts consecutive days backwards
    let currentStreak = 0;
    let startIdx = 0;

    if (dates[0].str === todayStr) {
      currentStreak = 1;
      startIdx = 1;
    } else if (dates[0].str === yesterdayStr) {
      currentStreak = 1;
      startIdx = 1;
    } else {
      // Last action was 2+ days ago — current streak is 0
      currentStreak = 0;
    }

    if (currentStreak > 0) {
      // Continue counting consecutive days backwards from the start
      let prevDate = dates[startIdx - 1].time;
      for (let i = startIdx; i < dates.length; i++) {
        const diff = prevDate - dates[i].time;
        if (diff === ONE_DAY_MS) {
          currentStreak++;
          prevDate = dates[i].time;
        } else {
          break;
        }
      }
    }

    // Longest streak: scan all dates (desc order) looking for the longest consecutive run
    let longestStreak = 1;
    let runLength = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i - 1].time - dates[i].time;
      if (diff === ONE_DAY_MS) {
        runLength++;
      } else {
        if (runLength > longestStreak) longestStreak = runLength;
        runLength = 1;
      }
    }
    if (runLength > longestStreak) longestStreak = runLength;

    return { currentStreak, longestStreak, lastActionDate };
  },
};

module.exports = CareAction;
