/**
 * Migration: Create refresh_tokens table
 * Task: T-014
 */
exports.up = function (knex) {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable().unique();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.boolean('revoked').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('token_hash', 'idx_refresh_tokens_token_hash');
    table.index('user_id', 'idx_refresh_tokens_user_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('refresh_tokens');
};
