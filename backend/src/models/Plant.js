const db = require('../config/database');

const Plant = {
  /**
   * Create a new plant.
   */
  async create({ user_id, name, type, notes, photo_url }) {
    const [plant] = await db('plants')
      .insert({
        user_id,
        name,
        type: type || null,
        notes: notes || null,
        photo_url: photo_url || null,
      })
      .returning('*');
    return plant;
  },

  /**
   * Find all plants for a user, with pagination and optional search filter.
   * @param {string} userId
   * @param {Object} options
   * @param {number} [options.page=1]
   * @param {number} [options.limit=50]
   * @param {string} [options.search] — case-insensitive substring match on name OR type (T-142, Sprint 30)
   * @param {boolean} [options.noPagination=false] — if true, returns all matching plants (for app-level filtering)
   * @param {'name_asc'|'name_desc'|null} [options.dbSort] — DB-level sort. If null, no ORDER BY is applied
   *   (caller will sort in app layer). Used by T-142 for `name_asc` / `name_desc` fast paths.
   */
  async findByUserId(userId, { page = 1, limit = 50, search, noPagination = false, dbSort } = {}) {
    const offset = (page - 1) * limit;

    function applyFilters(query) {
      query.where('user_id', userId);
      if (search) {
        // T-142: search now matches name OR type (species). Parameterized to prevent injection.
        const term = `%${search.toLowerCase()}%`;
        query.whereRaw('(LOWER(name) LIKE ? OR LOWER(COALESCE(type, \'\')) LIKE ?)', [term, term]);
      }
      return query;
    }

    function applyOrder(query) {
      if (dbSort === 'name_asc') {
        return query.orderByRaw('LOWER(name) ASC');
      }
      if (dbSort === 'name_desc') {
        return query.orderByRaw('LOWER(name) DESC');
      }
      // Default fallback — preserve historical ordering for callers that don't specify dbSort.
      return query.orderBy('created_at', 'desc');
    }

    if (noPagination) {
      const plants = await applyOrder(applyFilters(db('plants')));
      return { plants, total: plants.length };
    }

    const [plants, [{ count }]] = await Promise.all([
      applyOrder(applyFilters(db('plants').clone()))
        .limit(limit)
        .offset(offset),
      applyFilters(db('plants').clone())
        .count('id as count'),
    ]);

    return {
      plants,
      total: parseInt(count, 10),
    };
  },

  /**
   * Find a single plant by ID (no user scoping).
   * Used to distinguish 404 (plant doesn't exist) from 403 (plant belongs to another user).
   */
  async findById(id) {
    return db('plants').where({ id }).first();
  },

  /**
   * Find a single plant by ID, scoped to user.
   */
  async findByIdAndUser(id, userId) {
    return db('plants')
      .where({ id, user_id: userId })
      .first();
  },

  /**
   * Update a plant.
   */
  async update(id, userId, { name, type, notes, photo_url }) {
    const [plant] = await db('plants')
      .where({ id, user_id: userId })
      .update({
        name,
        type: type !== undefined ? type : null,
        notes: notes !== undefined ? notes : null,
        photo_url: photo_url !== undefined ? photo_url : null,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return plant;
  },

  /**
   * Delete a plant (cascades to care_schedules and care_actions).
   */
  async delete(id, userId) {
    const deleted = await db('plants')
      .where({ id, user_id: userId })
      .del();
    return deleted > 0;
  },

  /**
   * Count plants for a user.
   */
  async countByUserId(userId) {
    const [{ count }] = await db('plants')
      .where('user_id', userId)
      .count('id as count');
    return parseInt(count, 10);
  },
};

module.exports = Plant;
