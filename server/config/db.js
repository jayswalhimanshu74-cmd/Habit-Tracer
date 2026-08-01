const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const poolConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'habittracker',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ssl: isProduction && process.env.DB_HOST !== 'localhost'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool,
};

