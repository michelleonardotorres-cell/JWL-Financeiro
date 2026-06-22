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
    
    console.log("Altering fornecedores to add new columns...");
    await client.query(`
      ALTER TABLE fornecedores 
      ADD COLUMN IF NOT EXISTS "nomeFantasia" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "tipoPessoa" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "isCliente" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "inscricaoEstadual" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "inscricaoMunicipal" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "telefone1" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "telefone2" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "qualificacao" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cep" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "numero" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "complemento" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "bairro" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "estado" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "cidade" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "comentario" TEXT,
      ADD COLUMN IF NOT EXISTS "segmento" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "contaBancaria" TEXT,
      ADD COLUMN IF NOT EXISTS "contato1Nome" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "contato1Email" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "contato1Cargo" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "contato1Telefone" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "contato1Aniversario" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "contato2Nome" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "contato2Email" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "contato2Cargo" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "contato2Telefone" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "contato2Aniversario" VARCHAR(50);
    `);

    await client.query('COMMIT');
    console.log("Database schema updated successfully.");
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
