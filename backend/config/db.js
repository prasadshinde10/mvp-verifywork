const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
  },
});

pool
  .connect()
  .then((client) => {
    console.log('Connected to database');
    client.release();
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
  });

module.exports = pool;
