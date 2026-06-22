import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://xata:75HBGZb4cAxTPYds1mRDytOTaNhLhvH3nhShhjYVc8mGwnwS9mvHZfi78UjM2NaD@li03j0nog97un90u88bkosdbm4.us-east-1.xata.tech/xata?sslmode=require";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log("Creating recebedores table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS recebedores (
        id VARCHAR(255) PRIMARY KEY,
        "nome" VARCHAR(255) NOT NULL,
        "nomeFantasia" VARCHAR(255),
        "cnpj" VARCHAR(50),
        "cpf" VARCHAR(50),
        "tipoPessoa" VARCHAR(50),
        "isCliente" BOOLEAN DEFAULT false,
        "ativo" BOOLEAN DEFAULT true,
        "inscricaoEstadual" VARCHAR(50),
        "inscricaoMunicipal" VARCHAR(50),
        "telefone1" VARCHAR(50),
        "telefone2" VARCHAR(50),
        "email" VARCHAR(255),
        "qualificacao" INTEGER DEFAULT 0,
        "cep" VARCHAR(20),
        "endereco" TEXT,
        "numero" VARCHAR(50),
        "complemento" VARCHAR(255),
        "bairro" VARCHAR(255),
        "estado" VARCHAR(50),
        "cidade" VARCHAR(255),
        "comentario" TEXT,
        "segmento" VARCHAR(100),
        "contaBancaria" TEXT,
        "contato1Nome" VARCHAR(255),
        "contato1Email" VARCHAR(255),
        "contato1Cargo" VARCHAR(100),
        "contato1Telefone" VARCHAR(50),
        "contato1Aniversario" VARCHAR(50),
        "contato2Nome" VARCHAR(255),
        "contato2Email" VARCHAR(255),
        "contato2Cargo" VARCHAR(100),
        "contato2Telefone" VARCHAR(50),
        "contato2Aniversario" VARCHAR(50),
        "dados_bancarios" TEXT,
        "funcao" VARCHAR(255)
      );
    `);

    await client.query('COMMIT');
    console.log("Database schema updated successfully.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Failed to update database:", e);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
