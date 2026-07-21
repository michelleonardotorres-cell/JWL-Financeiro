import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(`
        SELECT o.id, o.nome, o.status, o."valorContrato", o.cliente, o.endereco, o."reajusteContrato",
               COALESCE((SELECT SUM(valor) FROM obra_aditivos WHERE "obraId" = o.id), 0) AS aditivo
        FROM obras o
        ORDER BY o.nome ASC
      `);
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { id, nome, status, valorContrato, cliente, endereco, reajusteContrato } = req.body;
      if (!id || !nome) return res.status(400).json({ error: "id e nome são obrigatórios" });
      const { rows } = await pool.query(
        `INSERT INTO obras (id, nome, status, "valorContrato", cliente, endereco, "reajusteContrato") 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET 
         nome=$2, status=$3, "valorContrato"=$4, cliente=$5, endereco=$6, "reajusteContrato"=$7 
         RETURNING *`,
        [id, nome, status || "Em Andamento", valorContrato || null, cliente || null, endereco || null, reajusteContrato || null]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, nome, status, valorContrato, cliente, endereco, reajusteContrato } = req.body;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      const { rows } = await pool.query(
        `UPDATE obras SET 
         nome=$2, status=$3, "valorContrato"=$4, cliente=$5, endereco=$6, "reajusteContrato"=$7 
         WHERE id=$1 RETURNING *`,
        [id, nome, status, valorContrato || null, cliente || null, endereco || null, reajusteContrato || null]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      await pool.query('DELETE FROM obras WHERE id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/obras] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
