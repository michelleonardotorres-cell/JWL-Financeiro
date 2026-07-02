import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT id, "dataCompetencia", "dataVencimento", "dataPagamento",
                "formaPagamento", nf, descricao, valor, "valorPago", "jurosMulta", tipo, categoria,
                "tipoLancamento", subtipo, "obraId", "fornecedorId",
                "recebedorFornecedor", "contratoId", status
         FROM lancamentos ORDER BY "dataVencimento" DESC`
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const d = req.body;
      if (!d.id || !d.descricao) return res.status(400).json({ error: "id e descricao são obrigatórios" });
      const { rows } = await pool.query(
        `INSERT INTO lancamentos
           (id, "dataCompetencia", "dataVencimento", "dataPagamento", "formaPagamento",
            nf, descricao, valor, "valorPago", "jurosMulta", tipo, categoria, "tipoLancamento", subtipo,
            "obraId", "fornecedorId", "recebedorFornecedor", "contratoId", status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET
           "dataCompetencia"=$2, "dataVencimento"=$3, "dataPagamento"=$4, "formaPagamento"=$5,
           nf=$6, descricao=$7, valor=$8, "valorPago"=$9, "jurosMulta"=$10, tipo=$11, categoria=$12, "tipoLancamento"=$13,
           subtipo=$14, "obraId"=$15, "fornecedorId"=$16, "recebedorFornecedor"=$17,
           "contratoId"=$18, status=$19
         RETURNING *`,
        [
          d.id, d.dataCompetencia, d.dataVencimento, d.dataPagamento || null,
          d.formaPagamento || null, d.nf || null, d.descricao, d.valor || 0,
          d.valorPago || null, d.jurosMulta || null,
          d.tipo || "Despesa", d.categoria || "", d.tipoLancamento || null,
          d.subtipo || null, d.obraId || null, d.fornecedorId || null,
          d.recebedorFornecedor || null, d.contratoId || null, d.status || "Aberto"
        ]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const d = req.body;
      if (!d.id) return res.status(400).json({ error: "id é obrigatório" });
      const { rows } = await pool.query(
        `UPDATE lancamentos SET
           "dataCompetencia"=$2, "dataVencimento"=$3, "dataPagamento"=$4, "formaPagamento"=$5,
           nf=$6, descricao=$7, valor=$8, "valorPago"=$9, "jurosMulta"=$10, tipo=$11, categoria=$12, "tipoLancamento"=$13,
           subtipo=$14, "obraId"=$15, "fornecedorId"=$16, "recebedorFornecedor"=$17,
           "contratoId"=$18, status=$19
         WHERE id=$1 RETURNING *`,
        [
          d.id, d.dataCompetencia, d.dataVencimento, d.dataPagamento || null,
          d.formaPagamento || null, d.nf || null, d.descricao, d.valor || 0,
          d.valorPago || null, d.jurosMulta || null,
          d.tipo || "Despesa", d.categoria || "", d.tipoLancamento || null,
          d.subtipo || null, d.obraId || null, d.fornecedorId || null,
          d.recebedorFornecedor || null, d.contratoId || null, d.status || "Aberto"
        ]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      await pool.query('DELETE FROM lancamentos WHERE id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/lancamentos] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
