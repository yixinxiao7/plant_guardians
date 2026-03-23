/**
 * Migration: Create care_schedules table
 * Task: T-014
 */
exports.up = function (knex) {
  return knex.schema.createTable('care_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('plant_id').notNullable().references('id').inTable('plants').onDelete('CASCADE');
    table.string('care_type', 20).notNullable();
    table.integer('frequency_value').notNullable();
    table.string('frequency_unit', 10).notNullable();
    table.timestamp('last_done_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['plant_id', 'care_type']);
    table.index('plant_id', 'idx_care_schedules_plant_id');

    // Check constraints via raw SQL
    table.check("care_type IN ('watering', 'fertilizing', 'repotting')", [], 'chk_care_type');
    table.check('frequency_value BETWEEN 1 AND 365', [], 'chk_frequency_value');
    table.check("frequency_unit IN ('days', 'weeks', 'months')", [], 'chk_frequency_unit');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('care_schedules');
};
