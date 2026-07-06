import { config } from 'dotenv';
config();
import { getPool } from './api/_db.js';

async function run() {
  try {
    const pool = getPool();
    const client = await pool.connect();
    
    const query = `
      SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'lancamentos'
    `;
    
    const res = await client.query(query);
    console.log(res.rows);
    client.release();
  } catch(e) {
    console.error('Query Failed', e.message);
  }
  process.exit();
}

run();
