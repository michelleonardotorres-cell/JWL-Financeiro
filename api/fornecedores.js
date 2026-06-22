// api/fornecedores.js - CRUD serverless function for fornecedores table
const { getPool, setCors } = require("./_db");

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(
        'SELECT id, nome, cnpj FROM fornecedores ORDER BY nome ASC'
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { id, nome, cnpj } = req.body;
      if (!id || !nome) return res.status(400).json({ error: "id e nome são obrigatórios" });
      const { rows } = await pool.query(
        'INSERT INTO fornecedores (id, nome, cnpj) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET nome=$2, cnpj=$3 RETURNING *',
        [id, nome, cnpj || ""]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, nome, cnpj } = req.body;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      const { rows } = await pool.query(
        'UPDATE fornecedores SET nome=$2, cnpj=$3 WHERE id=$1 RETURNING *',
        [id, nome, cnpj]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      await pool.query('DELETE FROM fornecedores WHERE id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/fornecedores] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
