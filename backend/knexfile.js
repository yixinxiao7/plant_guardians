require('dotenv').config();

// Production uses Supabase Postgres via the session pooler (port 5432), which
// requires SSL. When RENDER=true (set on the Render web service) or DATABASE_URL
// contains "render.com", enable SSL with rejectUnauthorized: false so the
// connection succeeds without bundling the Supabase CA certificate.
const isRender = process.env.RENDER === 'true' ||
  (process.env.DATABASE_URL || '').includes('render.com');

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
    seeds: {
      directory: './src/seeds',
    },
    pool: {
      min: 2,
      max: 10,
      // Validate connections before handing them to callers (T-056)
      // Prevents stale/dead connections from causing 500s after idle periods
      afterCreate(conn, done) {
        conn.query('SELECT 1', (err) => {
          done(err, conn);
        });
      },
      // Keep idle connections alive long enough to avoid mid-request pool refill races (T-058).
      // Previously 30s caused transient 500s when requests arrived during tarn refill + afterCreate validation.
      idleTimeoutMillis: 600000, // 10 minutes — matches PostgreSQL default idle timeout
      // Check for idle connections periodically
      reapIntervalMillis: 5000,
    },
  },
  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/plant_guardians_test',
    migrations: {
      directory: './src/migrations',
    },
    pool: {
      min: 1,
      max: 5,
      afterCreate(conn, done) {
        conn.query('SELECT 1', (err) => {
          done(err, conn);
        });
      },
      // Destroy idle connections faster in test to prevent "socket hang up"
      idleTimeoutMillis: 10000,
    },
  },
  staging: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
    pool: {
      min: 2,
      max: 10,
      afterCreate(conn, done) {
        conn.query('SELECT 1', (err) => {
          done(err, conn);
        });
      },
      idleTimeoutMillis: 600000,
      reapIntervalMillis: 5000,
    },
  },
  production: {
    client: 'pg',
    connection: productionConnection,
    migrations: {
      directory: './src/migrations',
    },
    pool: {
      // Render free tier has limited connections — keep pool small
      min: 1,
      max: isRender ? 5 : 20,
      afterCreate(conn, done) {
        conn.query('SELECT 1', (err) => {
          done(err, conn);
        });
      },
      idleTimeoutMillis: 600000,
      reapIntervalMillis: 5000,
    },
  },
};
