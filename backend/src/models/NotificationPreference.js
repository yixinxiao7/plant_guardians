const db = require('../config/database');

const NotificationPreference = {
  /**
   * Find notification preferences for a user.
   * Returns the row or undefined if none exists.
   */
  async findByUserId(userId) {
    return db('notification_preferences')
      .where('user_id', userId)
      .first();
  },

  /**
   * Get or create notification preferences for a user.
   * If no row exists, inserts defaults (opt_in: false, reminder_hour_utc: 8).
   * Returns the preference row.
   */
  async findOrCreate(userId) {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    const [created] = await db('notification_preferences')
      .insert({
        user_id: userId,
        opt_in: false,
        reminder_hour_utc: 8,
      })
      .returning('*');
    return created;
  },

  /**
   * Upsert notification preferences for a user.
   * Only updates the fields provided in `updates` (partial update).
   * Creates a default row first if none exists, then patches it.
   * Returns the updated preference row.
   */
  async upsert(userId, updates) {
    // Ensure a row exists
    await this.findOrCreate(userId);

    const patch = { updated_at: db.fn.now() };
    if (updates.opt_in !== undefined) patch.opt_in = updates.opt_in;
    if (updates.reminder_hour_utc !== undefined) patch.reminder_hour_utc = updates.reminder_hour_utc;

    const [updated] = await db('notification_preferences')
      .where('user_id', userId)
      .update(patch)
      .returning('*');
    return updated;
  },

  /**
   * Find all opted-in users for a given reminder hour (UTC).
   * Used by the reminder cron job to determine who to email.
   * Returns rows with user_id only.
   */
  async findOptedInByHour(hourUtc) {
    return db('notification_preferences')
      .where({ opt_in: true, reminder_hour_utc: hourUtc })
      .select('user_id');
  },

  /**
   * Set opt_in = false for a given user.
   * Used by the unsubscribe endpoint.
   * Returns the number of rows updated (0 or 1).
   */
  async unsubscribe(userId) {
    return db('notification_preferences')
      .where('user_id', userId)
      .update({ opt_in: false, updated_at: db.fn.now() });
  },
};

module.exports = NotificationPreference;
