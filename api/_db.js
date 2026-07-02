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
    pool.query(`ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS "valorPago" numeric, ADD COLUMN IF NOT EXISTS "jurosMulta" numeric;`)
      .catch(e => console.log('Schema migration note:', e.message));
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
