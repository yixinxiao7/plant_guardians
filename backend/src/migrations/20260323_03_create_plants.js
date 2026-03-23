/**
 * Migration: Create plants table
 * Task: T-014
 */
exports.up = function (knex) {
  return knex.schema.createTable('plants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('type', 200).nullable();
    table.text('notes').nullable();
    table.text('photo_url').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'idx_plants_user_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('plants');
};
