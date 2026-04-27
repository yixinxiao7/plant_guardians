/**
 * Jest globalTeardown — runs once after ALL test files have completed.
 *
 * In --runInBand mode, globalTeardown may or may not share the same module
 * cache as the test worker. To avoid creating a second Knex instance that
 * could conflict with the in-test pool, we keep this minimal.
 *
 * Pool cleanup is handled by --forceExit in the npm test script.
 * Table data isolation is handled by cleanTables() (TRUNCATE) in each
 * test file's beforeEach hook.
 */
module.exports = async function globalTeardown() {
  // Intentionally minimal — --forceExit handles pool cleanup.
  // We do NOT rollback migrations here because:
  // 1. globalTeardown may get a different Knex instance (separate require cache)
  // 2. Leaving the test schema in place means the next run's setupDatabase()
  //    can skip re-running migrations (migrate.latest() is idempotent).
};
