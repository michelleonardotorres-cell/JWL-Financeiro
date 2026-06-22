import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = "postgresql://xata:75HBGZb4cAxTPYds1mRDytOTaNhLhvH3nhShhjYVc8mGwnwS9mvHZfi78UjM2NaD@li03j0nog97un90u88bkosdbm4.us-east-1.xata.tech/xata?sslmode=require";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function upgrade() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log("Truncating all tables...");
    await client.query(`TRUNCATE TABLE obras, fornecedores, lancamentos, contratos CASCADE;`);

    console.log("Altering fornecedores...");
    await client.query(`
      ALTER TABLE fornecedores 
      ADD COLUMN IF NOT EXISTS cpf VARCHAR(20),
      ADD COLUMN IF NOT EXISTS endereco TEXT,
      ADD COLUMN IF NOT EXISTS dados_bancarios TEXT,
      ADD COLUMN IF NOT EXISTS funcao VARCHAR(255);
    `);

    console.log("Altering obras...");
    await client.query(`
      ALTER TABLE obras 
      ADD COLUMN IF NOT EXISTS cliente VARCHAR(255),
      ADD COLUMN IF NOT EXISTS endereco TEXT,
      ADD COLUMN IF NOT EXISTS valor_contrato NUMERIC,
      ADD COLUMN IF NOT EXISTS aditivo NUMERIC,
      ADD COLUMN IF NOT EXISTS reajuste_contrato NUMERIC;
    `);

    await client.query('COMMIT');
    console.log("Database schema updated and data cleared successfully.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Failed to upgrade database:", e);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

upgrade();
