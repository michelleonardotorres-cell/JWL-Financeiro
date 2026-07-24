import dotenv from 'dotenv';
dotenv.config();
import { getPool } from '../api/_db.js';

async function addCol() {
  const pool = getPool();
  try {
    const res = await pool.query(`ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb`);
    console.log('Added anexos to lancamentos');
    const res2 = await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb`);
    console.log('Added anexos to contratos');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}

addCol();
