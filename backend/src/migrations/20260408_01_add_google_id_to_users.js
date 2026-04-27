/**
 * Migration: Add google_id to users table for Google OAuth support (T-120, Sprint 27)
 *
 * Changes:
 * 1. Make password_hash nullable to support Google-only users
 * 2. Add nullable google_id VARCHAR(255) column with partial unique index
 */

exports.up = async function (knex) {
  // Make password_hash nullable for Google-only users (raw SQL for reliability)
  await knex.raw('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');

  // Add google_id column
  await knex.raw('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL');

  // Create partial unique index — only non-NULL google_id values must be unique
  await knex.raw(`
    CREATE UNIQUE INDEX users_google_id_unique
    ON users (google_id)
    WHERE google_id IS NOT NULL
  `);
};

exports.down = async function (knex) {
  // Drop partial unique index
  await knex.raw('DROP INDEX IF EXISTS users_google_id_unique');

  // Remove google_id column
  await knex.raw('ALTER TABLE users DROP COLUMN IF EXISTS google_id');

  // Restore password_hash NOT NULL (only safe if no Google-only users exist)
  // In test environments this is always safe; in production the Deploy Engineer
  // must verify no NULL password_hash rows exist before rolling back.
  await knex.raw('ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL');
};
