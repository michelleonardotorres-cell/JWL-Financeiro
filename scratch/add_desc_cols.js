import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function run() {
  try {
    await pool.query(`ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS "descontoGlobal" double precision DEFAULT 0;`);
    await pool.query(`ALTER TABLE orcamento_itens ADD COLUMN IF NOT EXISTS "descontoItem" double precision;`);
    console.log("Columns added");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
