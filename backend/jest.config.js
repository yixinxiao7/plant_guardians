module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  // Centralized pool cleanup — runs once after ALL test files complete.
  // Fixes the --runInBand teardown bug where db.destroy() was called
  // between sequential test files (T-120 fix).
  globalTeardown: './tests/globalTeardown.js',
  // Note: --runInBand is added to the npm test script in package.json
  // to prevent PostgreSQL connection pool exhaustion and "socket hang up"
  // errors from concurrent test files competing for database connections.
};
