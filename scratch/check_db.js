import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    // Check if xata_createdat exists, if so we use it. 
    // In PostgreSQL, Xata columns are usually xata_createdat.
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'lancamentos';
    `);
    
    console.log("Columns in lancamentos:");
    console.log(rows.map(r => r.column_name).join(', '));

    // Try to query recent records
    const recent = await pool.query(`
      SELECT id, descricao, xata_createdat, xata_updatedat 
      FROM lancamentos 
      ORDER BY xata_createdat DESC 
      LIMIT 100;
    `);
    
    console.log("\nMost recent 100 lancamentos (by xata_createdat):");
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const last2hours = recent.rows.filter(r => new Date(r.xata_createdat) > twoHoursAgo);
    
    console.log(`\nTotal in last 100: ${recent.rows.length}`);
    console.log(`Total inserted/updated in last 2 hours: ${last2hours.length}`);
    
    if (last2hours.length > 0) {
        console.log("\nSample of last 2 hours insertions:");
        console.table(last2hours.slice(0, 10));
    }
    
    // Group by xata_createdat to see if they were inserted multiple times.
    const counts = await pool.query(`
      SELECT DATE_TRUNC('minute', xata_createdat) as min, count(*)
      FROM lancamentos
      GROUP BY min
      ORDER BY min DESC
      LIMIT 10;
    `);
    console.log("\nInsertions grouped by minute:");
    console.table(counts.rows);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
