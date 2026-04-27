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
   * Find a user by Google ID.
   * Returns full user row (id, full_name, email, google_id, created_at).
   */
  async findByGoogleId(googleId) {
    return db('users')
      .select('id', 'full_name', 'email', 'google_id', 'created_at')
      .where('google_id', googleId)
      .first();
  },

  /**
   * Create a new user from Google OAuth (no password).
   */
  async createGoogleUser({ full_name, email, google_id }) {
    const [user] = await db('users')
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        google_id,
        password_hash: null,
      })
      .returning(['id', 'full_name', 'email', 'google_id', 'created_at']);
    return user;
  },

  /**
   * Link a Google ID to an existing user (account-linking).
   */
  async linkGoogleId(userId, googleId) {
    return db('users')
      .where('id', userId)
      .update({
        google_id: googleId,
        updated_at: new Date(),
      });
  },

  /**
   * Update the updated_at timestamp for a user.
   */
  async updateTimestamp(userId) {
    return db('users')
      .where('id', userId)
      .update({ updated_at: new Date() });
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
   * Delete a user and ALL associated data within a single transaction.
   * Deletes in explicit dependency order (not relying on DB cascade):
   *   care_actions → notification_preferences → care_schedules → plants → refresh_tokens → users
   *
   * Returns the number of user rows deleted (0 or 1).
   * Throws if any step fails — transaction auto-rolls-back.
   *
   * Added in Sprint 23 (T-106).
   */
  async deleteWithAllData(userId) {
    return db.transaction(async (trx) => {
      // 1. Delete care_actions for all plants owned by this user
      await trx('care_actions')
        .whereIn('plant_id', trx('plants').select('id').where('user_id', userId))
        .del();

      // 2. Delete notification_preferences
      await trx('notification_preferences')
        .where('user_id', userId)
        .del();

      // 3. Delete care_schedules for all plants owned by this user
      await trx('care_schedules')
        .whereIn('plant_id', trx('plants').select('id').where('user_id', userId))
        .del();

      // 4. Delete plants
      await trx('plants')
        .where('user_id', userId)
        .del();

      // 5. Delete refresh_tokens
      await trx('refresh_tokens')
        .where('user_id', userId)
        .del();

      // 6. Delete user row
      const deletedCount = await trx('users')
        .where('id', userId)
        .del();

      return deletedCount;
    });
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
