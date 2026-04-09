import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuration pour PostgreSQL
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'btp_market',
  password: process.env.PG_PASSWORD || 'password',
  port: process.env.PG_PORT || 5432,
});

pool.on('error', (err, client) => {
  console.error('Erreur inattendue sur la base de données', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
