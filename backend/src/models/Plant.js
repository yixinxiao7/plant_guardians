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
   * Find all plants for a user, with pagination.
   */
  async findByUserId(userId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;

    const [plants, [{ count }]] = await Promise.all([
      db('plants')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      db('plants')
        .where('user_id', userId)
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
