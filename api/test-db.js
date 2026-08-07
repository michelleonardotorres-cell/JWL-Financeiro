import { getPool } from "./_db.js";
export default async function handler(req, res) {
  const pool = getPool();
  try {
    const q1 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orcamentos'");
    const q2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orcamento_itens'");
    res.status(200).json({ orcamentos: q1.rows, orcamento_itens: q2.rows });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
