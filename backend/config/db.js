const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then((client) => {
    console.log('Connected to database');
    client.release();
  })
  .catch((error) => {
    console.error(error);
  });

module.exports = pool;
