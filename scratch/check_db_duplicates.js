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
    // Check total records
    const { rows: totalRows } = await pool.query('SELECT count(*) FROM lancamentos;');
    console.log(`Total records in lancamentos: ${totalRows[0].count}`);

    // Group by fields that would be identical in the spreadsheet to find duplicates
    const { rows: duplicates } = await pool.query(`
      SELECT descricao, valor, "dataCompetencia", count(*)
      FROM lancamentos
      GROUP BY descricao, valor, "dataCompetencia"
      HAVING count(*) > 1
      ORDER BY count(*) DESC;
    `);
    
    console.log(`\nFound ${duplicates.length} unique combinations of (descricao, valor, dataCompetencia) that have duplicates.`);
    
    if (duplicates.length > 0) {
        console.log("\nTop duplicates:");
        console.table(duplicates.slice(0, 15));
        
        // Sum up all duplicate rows that have been inserted
        let totalDuplicates = 0;
        duplicates.forEach(d => {
            totalDuplicates += (parseInt(d.count));
        });
        console.log(`\nTotal rows that are part of a duplicate group: ${totalDuplicates}`);
        console.log(`If there were 72 rows imported 15 times, we expect around 72 * 15 = 1080 rows.`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
