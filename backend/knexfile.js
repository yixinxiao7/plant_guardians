require('dotenv').config();

// Render's managed PostgreSQL requires SSL. Detect Render via the RENDER env var
// (set automatically by Render on all services) and configure accordingly.
const isRender = process.env.RENDER === 'true';

const productionConnection = isRender
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : process.env.DATABASE_URL;

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/migrations',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plant_guardians_test',
    migrations: {
      directory: './src/migrations',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  staging: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/migrations',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  production: {
    client: 'pg',
    connection: productionConnection,
    migrations: {
      directory: './src/migrations',
    },
    pool: {
      min: isRender ? 1 : 2,
      max: isRender ? 5 : 20,
    },
  },
};
