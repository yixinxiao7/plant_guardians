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

/**
 * Periodic keepalive to prevent idle connection reaping (T-058).
 * Fires every 5 minutes — well within the 10-minute idleTimeoutMillis.
 * This keeps at least one connection active so tarn never has to refill
 * the pool from zero after an idle period.
 */
let keepaliveInterval;

Promise.all(warmUpQueries)
  .then(() => {
    keepaliveInterval = setInterval(() => {
      db.raw('SELECT 1').catch(() => {
        // Swallow errors — pool will recover on next real request
      });
    }, 5 * 60 * 1000); // 5 minutes
    // Don't let the keepalive interval prevent Node from exiting
    keepaliveInterval.unref();

    app.listen(PORT, () => {
      console.log(`Plant Guardians API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`Database pool warmed up with ${warmUpQueries.length} connections.`);
    });
  })
  .catch(err => {
    console.error('Database connection failed on startup. Aborting.', err.message);
    process.exit(1);
  });
