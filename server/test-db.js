const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'habittracker',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'', (err, res) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected successfully. Tables:', res.rows.map(r => r.tablename));
  }
  pool.end();
});
