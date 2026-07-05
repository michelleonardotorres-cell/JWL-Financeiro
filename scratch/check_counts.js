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
    const { rows: duplicates } = await pool.query(`
      SELECT descricao, valor, "dataCompetencia", count(*) as total_count
      FROM lancamentos
      GROUP BY descricao, valor, "dataCompetencia"
      HAVING count(*) > 1
      ORDER BY count(*) DESC;
    `);
    
    // Let's summarize the counts
    const countFreq = {};
    duplicates.forEach(d => {
      const c = parseInt(d.total_count);
      countFreq[c] = (countFreq[c] || 0) + 1;
    });

    console.log("Frequency of duplication counts:");
    console.table(countFreq);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
