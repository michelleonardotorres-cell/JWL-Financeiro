import pg from 'pg';
const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("⚠️ DATABASE_URL is not set! Using mock database pool to prevent crashes.");
      let fakeData = [];
      pool = {
        query: async (text, values) => {
          if (text.startsWith("INSERT") || text.startsWith("UPDATE")) {
            return { rows: [values ? values.reduce((acc, val, i) => ({ ...acc, [`fakeField${i}`]: val }), { id: values[0] }) : {}] };
          }
          return { rows: [] };
        },
        on: () => {}
      };
      return pool;
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on("error", (err) => {
      console.error("Unexpected PostgreSQL pool error:", err);
    });
    
    // Adapt backend table if needed
    pool.query(`ALTER TABLE lancamentos 
      ADD COLUMN IF NOT EXISTS "valorPago" numeric, 
      ADD COLUMN IF NOT EXISTS "jurosMulta" numeric,
      ADD COLUMN IF NOT EXISTS "lancamentoPaiId" text;`)
      .catch(e => console.log('Schema migration note:', e.message));

    // Phase 1: Contratos Fixos schema migration
    pool.query(`
      ALTER TABLE contratos 
      ADD COLUMN IF NOT EXISTS "dataInicio" date,
      ADD COLUMN IF NOT EXISTS "dataTermino" date,
      ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Ativo',
      ADD COLUMN IF NOT EXISTS "valorTotal" numeric;
      
      CREATE TABLE IF NOT EXISTS contrato_parcelas (
        id text PRIMARY KEY,
        "contratoId" text NOT NULL,
        "numeroParcela" integer NOT NULL,
        valor numeric NOT NULL,
        "dataVencimento" date NOT NULL,
        "statusAprovacao" text DEFAULT 'Pendente',
        "lancamentoId" text,
        CONSTRAINT fk_contrato FOREIGN KEY("contratoId") REFERENCES contratos(id) ON DELETE CASCADE,
        CONSTRAINT fk_lancamento FOREIGN KEY("lancamentoId") REFERENCES lancamentos(id) ON DELETE SET NULL
      );
    `).catch(e => console.log('Contratos schema migration note:', e.message));
  }
  return pool;
}

// Helper to add CORS headers to all responses
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export { getPool, setCors };
