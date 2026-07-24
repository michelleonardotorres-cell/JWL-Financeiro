import { config } from 'dotenv';
config();
import { getPool } from './api/_db.js';

async function run() {
  try {
    const pool = getPool();
    const client = await pool.connect();
    
    console.log('Adding column anexos to lancamentos...');
    await client.query(`ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS anexos file[]`);
    
    console.log('Adding column anexos to contratos...');
    await client.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS anexos file[]`);
    
    console.log('Success!');
    client.release();
  } catch(e) {
    console.error('Query Failed', e.message);
  }
  process.exit();
}

run();
