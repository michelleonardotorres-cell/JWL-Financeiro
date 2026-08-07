import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log("Creating table orcamentos_detalhados...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS orcamentos_detalhados (
        id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        nome_etapa text,
        obra_id text,
        itens text,
        cotacoes_mat text,
        cotacoes_mo text,
        total_planilha numeric,
        total_real_mat numeric,
        total_real_mo numeric,
        xata_createdat timestamp with time zone DEFAULT now(),
        xata_updatedat timestamp with time zone DEFAULT now(),
        xata_version integer DEFAULT 0
      );
    `);

    await client.query('COMMIT');
    console.log("Table created successfully.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Failed to create table:", e);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
