import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { contratoId } = req.query;
      if (!contratoId) {
        return res.status(400).json({ error: "contratoId é obrigatório" });
      }
      const { rows } = await pool.query(
        `SELECT id, "contratoId", "numeroParcela", valor, "dataVencimento", "statusAprovacao", "lancamentoId"
         FROM contrato_parcelas
         WHERE "contratoId" = $1
         ORDER BY "numeroParcela" ASC, "dataVencimento" ASC`,
        [contratoId]
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const d = req.body;
      if (!d.id || !d.contratoId) return res.status(400).json({ error: "id e contratoId são obrigatórios" });
      const { rows } = await pool.query(
        `INSERT INTO contrato_parcelas
           (id, "contratoId", "numeroParcela", valor, "dataVencimento", "statusAprovacao", "lancamentoId")
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           "numeroParcela"=$3, valor=$4, "dataVencimento"=$5, "statusAprovacao"=$6, "lancamentoId"=$7
         RETURNING *`,
        [
          d.id, d.contratoId, d.numeroParcela || 1, d.valor || 0, d.dataVencimento,
          d.statusAprovacao || 'Pendente', d.lancamentoId || null
        ]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const d = req.body;
      if (!d.id) return res.status(400).json({ error: "id é obrigatório" });
      
      // We only allow updating valor and dataVencimento if it's Pendente
      const { rows } = await pool.query(
        `UPDATE contrato_parcelas SET
           valor = $2,
           "dataVencimento" = $3
         WHERE id = $1 AND "statusAprovacao" = 'Pendente'
         RETURNING *`,
        [d.id, d.valor, d.dataVencimento]
      );
      
      if (rows.length === 0) {
        return res.status(400).json({ error: "Parcela não encontrada ou já aprovada/rejeitada." });
      }
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      await pool.query('DELETE FROM contrato_parcelas WHERE id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/contrato_parcelas] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
