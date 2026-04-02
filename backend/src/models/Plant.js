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
   * @param {string} [options.search] — case-insensitive substring match on name
   * @param {boolean} [options.noPagination=false] — if true, returns all matching plants (for app-level filtering)
   */
  async findByUserId(userId, { page = 1, limit = 50, search, noPagination = false } = {}) {
    const offset = (page - 1) * limit;

    function applyFilters(query) {
      query.where('user_id', userId);
      if (search) {
        query.whereRaw('LOWER(name) LIKE ?', [`%${search.toLowerCase()}%`]);
      }
      return query;
    }

    if (noPagination) {
      const plants = await applyFilters(db('plants'))
        .orderBy('created_at', 'desc');
      return { plants, total: plants.length };
    }

    const [plants, [{ count }]] = await Promise.all([
      applyFilters(db('plants').clone())
        .orderBy('created_at', 'desc')
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
