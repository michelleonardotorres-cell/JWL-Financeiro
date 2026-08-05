import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log("Starting migration of reajusteContrato...");
  
  try {
    // 1. Ensure table exists (just in case)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS obra_reajustes (
        id text PRIMARY KEY,
        "obraId" text NOT NULL,
        descricao text,
        valor numeric NOT NULL,
        "data" date,
        CONSTRAINT fk_obra_reajuste FOREIGN KEY("obraId") REFERENCES obras(id) ON DELETE CASCADE
      );
    `);

    // 2. Get all obras with reajusteContrato != 0 and not null
    const { rows: obras } = await pool.query(`
      SELECT id, "reajusteContrato" 
      FROM obras 
      WHERE "reajusteContrato" IS NOT NULL AND "reajusteContrato" != 0
    `);

    console.log(`Found ${obras.length} obras with existing reajusteContrato.`);

    for (const obra of obras) {
      const reajusteId = `or_${Math.random().toString(36).substring(2, 15)}`;
      
      // Check if it already has reajustes (to avoid duplicates on multiple runs)
      const { rows: existing } = await pool.query(`
        SELECT count(*) FROM obra_reajustes WHERE "obraId" = $1
      `, [obra.id]);

      if (parseInt(existing[0].count) === 0) {
        await pool.query(`
          INSERT INTO obra_reajustes (id, "obraId", descricao, valor, "data")
          VALUES ($1, $2, $3, $4, $5)
        `, [
          reajusteId, 
          obra.id, 
          "Reajuste Inicial Migrado", 
          obra.reajusteContrato, 
          new Date().toISOString().split('T')[0]
        ]);
        console.log(`Migrated reajuste for obra ${obra.id}: R$ ${obra.reajusteContrato}`);
      } else {
        console.log(`Obra ${obra.id} already has reajustes in the new table. Skipping.`);
      }
    }

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
