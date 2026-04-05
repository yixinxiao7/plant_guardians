/**
 * Migration: Create notification_preferences table (T-101, Sprint 22)
 *
 * Stores per-user email notification preferences (opt-in toggle and preferred
 * reminder hour). One row per user, keyed by user_id (PK).
 */
exports.up = async function (knex) {
  await knex.schema.createTable('notification_preferences', (table) => {
    table
      .uuid('user_id')
      .notNullable()
      .primary()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.boolean('opt_in').notNullable().defaultTo(false);
    table
      .integer('reminder_hour_utc')
      .notNullable()
      .defaultTo(8)
      .checkBetween([0, 23]);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Partial index for efficient cron-job queries: find opted-in users by hour
  await knex.raw(`
    CREATE INDEX idx_notification_preferences_opted_in
      ON notification_preferences (reminder_hour_utc)
      WHERE opt_in = true
  `);
};

exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_notification_preferences_opted_in');
  await knex.schema.dropTableIfExists('notification_preferences');
};
