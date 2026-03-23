/**
 * Migration: Create care_actions table
 * Task: T-014
 */
exports.up = function (knex) {
  return knex.schema.createTable('care_actions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('plant_id').notNullable().references('id').inTable('plants').onDelete('CASCADE');
    table.string('care_type', 20).notNullable();
    table.timestamp('performed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.text('note').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('plant_id', 'idx_care_actions_plant_id');
    table.index(['plant_id', 'performed_at'], 'idx_care_actions_performed_at');

    table.check("care_type IN ('watering', 'fertilizing', 'repotting')", [], 'chk_care_actions_type');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('care_actions');
};
