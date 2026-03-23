require('dotenv').config();
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

db.raw('SELECT 1')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Plant Guardians API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch(err => {
    console.error('Database connection failed on startup. Aborting.', err.message);
    process.exit(1);
  });
