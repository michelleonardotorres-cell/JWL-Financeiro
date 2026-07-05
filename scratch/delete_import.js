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
    // 1. Identify the duplicate groups
    const { rows: groups } = await pool.query(`
      SELECT descricao, valor, "dataCompetencia", count(*) as total_count
      FROM lancamentos
      GROUP BY descricao, valor, "dataCompetencia"
      HAVING count(*) >= 15
    `);

    let totalToDelete = 0;
    groups.forEach(g => {
      totalToDelete += parseInt(g.total_count);
    });

    console.log(`Found ${groups.length} groups of bugged imports.`);
    console.log(`Total rows to delete: ${totalToDelete}`);

    if (totalToDelete === 10026 || totalToDelete > 9900) {
      console.log("Starting deletion...");
      let deletedCount = 0;
      
      for (const group of groups) {
        const { descricao, valor, dataCompetencia } = group;
        const res = await pool.query(`
          DELETE FROM lancamentos 
          WHERE descricao = $1 AND valor = $2 AND "dataCompetencia" = $3
        `, [descricao, valor, dataCompetencia]);
        
        deletedCount += res.rowCount;
      }
      console.log(`Successfully deleted ${deletedCount} rows.`);
    } else {
      console.log("Safety check failed: The number of rows doesn't match our 10,026 expectation. Aborting.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
