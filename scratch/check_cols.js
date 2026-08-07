import { getPool } from "./api/_db.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const pool = getPool();
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orcamentos'
    `);
    console.log("Orcamentos columns:", res.rows.map(r => r.column_name));
    
    const res2 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orcamento_itens'
    `);
    console.log("Orcamento_itens columns:", res2.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
