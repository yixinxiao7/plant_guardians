/**
 * Migration: Create plant_shares table (T-126, Sprint 28)
 *
 * Stores one share token per plant. Supports:
 *   - POST /api/v1/plants/:plantId/share — idempotent share creation/lookup
 *   - GET  /api/v1/public/plants/:shareToken — no-auth public profile lookup
 *
 * - share_token: 43-char URL-safe base64url string from 32 random bytes (256-bit entropy)
 * - Cascades: deleting a plant or user removes their share rows automatically
 */

exports.up = function (knex) {
  return knex.schema.createTable('plant_shares', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('plant_id')
      .notNullable()
      .references('id')
      .inTable('plants')
      .onDelete('CASCADE');
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('share_token', 64).notNullable().unique();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('plant_id', 'idx_plant_shares_plant_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('plant_shares');
};
