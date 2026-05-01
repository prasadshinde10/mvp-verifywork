const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
  },
});

pool
  .query('SELECT 1')
  .then(() => {
    console.log('Connected to database');
  })
  .catch((error) => {
    console.error(
      'Failed to connect to database. Verify DATABASE_URL and SSL settings are correct.',
      error
    );
    process.exit(1);
  });

module.exports = pool;
