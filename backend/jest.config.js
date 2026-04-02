module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  // Note: --runInBand is added to the npm test script in package.json
  // to prevent PostgreSQL connection pool exhaustion and "socket hang up"
  // errors from concurrent test files competing for database connections.
};
