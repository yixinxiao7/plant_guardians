/**
 * Seed: 01_test_user.js
 * Creates the staging test account used by Monitor Agent health checks.
 * Idempotent — safe to run multiple times.
 *
 * Credentials:
 *   email:    test@plantguardians.local
 *   password: TestPass123!
 */

const bcrypt = require('bcrypt');

const TEST_EMAIL = 'test@plantguardians.local';
const TEST_PASSWORD = 'TestPass123!';
const BCRYPT_ROUNDS = 12;

exports.seed = async function (knex) {
  // Only insert if the account doesn't already exist
  const existing = await knex('users').where({ email: TEST_EMAIL }).first();
  if (existing) {
    console.log(`[seed] Test user already exists (id: ${existing.id}) — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);

  await knex('users').insert({
    full_name: 'Test User',
    email: TEST_EMAIL,
    password_hash: passwordHash,
  });

  console.log(`[seed] Created test user: ${TEST_EMAIL}`);
};
