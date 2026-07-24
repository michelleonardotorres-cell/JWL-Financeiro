import dotenv from 'dotenv';
dotenv.config();

import { getPool } from '../api/_db.js';

async function checkAnexos() {
  const pool = getPool();
  try {
    const res = await pool.query('SELECT id, anexos FROM lancamentos LIMIT 1');
    console.log('Result:', JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}

checkAnexos();
