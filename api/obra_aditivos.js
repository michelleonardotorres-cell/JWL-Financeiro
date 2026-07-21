import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { obraId } = req.query;
      if (!obraId) {
        return res.status(400).json({ error: "obraId é obrigatório" });
      }

      const { rows } = await pool.query(
        `SELECT id, "obraId", descricao, valor, "data"
         FROM obra_aditivos
         WHERE "obraId" = $1
         ORDER BY "data" ASC`,
        [obraId]
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const d = req.body;
      if (!d.id || !d.obraId) return res.status(400).json({ error: "id e obraId são obrigatórios" });
      
      const { rows } = await pool.query(
        `INSERT INTO obra_aditivos (id, "obraId", descricao, valor, "data")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           descricao=$3, valor=$4, "data"=$5
         RETURNING *`,
        [d.id, d.obraId, d.descricao || '', d.valor || 0, d.data || null]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const d = req.body;
      if (!d.id) return res.status(400).json({ error: "id é obrigatório" });
      
      const { rows } = await pool.query(
        `UPDATE obra_aditivos SET
           descricao = $2,
           valor = $3,
           "data" = $4
         WHERE id = $1
         RETURNING *`,
        [d.id, d.descricao || '', d.valor || 0, d.data || null]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      await pool.query('DELETE FROM obra_aditivos WHERE id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/obra_aditivos] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
