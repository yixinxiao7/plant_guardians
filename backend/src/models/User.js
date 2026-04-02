const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const User = {
  /**
   * Create a new user with hashed password.
   */
  async create({ full_name, email, password }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db('users')
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        password_hash,
      })
      .returning(['id', 'full_name', 'email', 'created_at']);
    return user;
  },

  /**
   * Find a user by email (case-insensitive).
   */
  async findByEmail(email) {
    return db('users')
      .where('email', email.toLowerCase().trim())
      .first();
  },

  /**
   * Find a user by ID.
   */
  async findById(id) {
    return db('users')
      .select('id', 'full_name', 'email', 'created_at')
      .where('id', id)
      .first();
  },

  /**
   * Verify password against stored hash.
   */
  async verifyPassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },

  /**
   * Delete a user by ID.
   * Due to ON DELETE CASCADE on all child tables (refresh_tokens, plants,
   * care_schedules via plants, care_actions via plants), a single DELETE
   * on users cascades to all associated data.
   *
   * Photo file cleanup should be done by the caller before invoking this.
   *
   * Returns the number of rows deleted (0 or 1).
   */
  async deleteById(id) {
    return db('users').where('id', id).del();
  },

  /**
   * Find all photo_urls for plants owned by a given user.
   * Used before account deletion to clean up uploaded files.
   */
  async findPhotoUrlsByUserId(userId) {
    const rows = await db('plants')
      .select('photo_url')
      .where('user_id', userId)
      .whereNotNull('photo_url');
    return rows.map((r) => r.photo_url);
  },
};

module.exports = User;
