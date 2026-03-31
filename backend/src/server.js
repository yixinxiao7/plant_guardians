require('dotenv').config();
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

/**
 * Warm up the Knex connection pool before accepting HTTP requests (T-056).
 *
 * Running multiple concurrent SELECT 1 queries forces the pool to open its
 * `min` number of connections synchronously during startup. Without this,
 * tarn creates min-pool connections lazily/asynchronously, and the first
 * real request can race against pool warm-up — causing an intermittent 500.
 */
const poolMin = db.client.pool ? db.client.pool.min : 2;
const warmUpQueries = Array.from({ length: Math.max(poolMin, 2) }, () => db.raw('SELECT 1'));

Promise.all(warmUpQueries)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Plant Guardians API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`Database pool warmed up with ${warmUpQueries.length} connections.`);
    });
  })
  .catch(err => {
    console.error('Database connection failed on startup. Aborting.', err.message);
    process.exit(1);
  });
