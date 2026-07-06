import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT id, descricao, "valorPrevisto", tipo, categoria,
                "tipoLancamento", subtipo, "obraId", "fornecedorId",
                "recebedorFornecedor", "diaVencimento", ativo,
                "dataInicio", "dataTermino", status, "valorTotal"
         FROM contratos ORDER BY descricao ASC`
      );
      // Parse boolean ativo field
      return res.status(200).json(rows.map(r => ({ ...r, ativo: r.ativo === true || r.ativo === 't' || r.ativo === 'true' })));
    }

    if (req.method === "POST") {
      const d = req.body;
      if (!d.id || !d.descricao) return res.status(400).json({ error: "id e descricao são obrigatórios" });
      const { rows } = await pool.query(
        `INSERT INTO contratos
           (id, descricao, "valorPrevisto", tipo, categoria, "tipoLancamento",
            subtipo, "obraId", "fornecedorId", "recebedorFornecedor", "diaVencimento", ativo,
            "dataInicio", "dataTermino", status, "valorTotal")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           descricao=$2, "valorPrevisto"=$3, tipo=$4, categoria=$5, "tipoLancamento"=$6,
           subtipo=$7, "obraId"=$8, "fornecedorId"=$9, "recebedorFornecedor"=$10,
           "diaVencimento"=$11, ativo=$12, "dataInicio"=$13, "dataTermino"=$14, status=$15, "valorTotal"=$16
         RETURNING *`,
        [
          d.id, d.descricao, d.valorPrevisto || 0, d.tipo || "Despesa",
          d.categoria || "", d.tipoLancamento || null, d.subtipo || null,
          d.obraId || null, d.fornecedorId || null, d.recebedorFornecedor || null,
          d.diaVencimento || 1, d.ativo !== undefined ? d.ativo : true,
          d.dataInicio || null, d.dataTermino || null, d.status || 'Ativo', d.valorTotal || null
        ]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const d = req.body;
      if (!d.id) return res.status(400).json({ error: "id é obrigatório" });
      const { rows } = await pool.query(
        `UPDATE contratos SET
           descricao=$2, "valorPrevisto"=$3, tipo=$4, categoria=$5, "tipoLancamento"=$6,
           subtipo=$7, "obraId"=$8, "fornecedorId"=$9, "recebedorFornecedor"=$10,
           "diaVencimento"=$11, ativo=$12, "dataInicio"=$13, "dataTermino"=$14, status=$15, "valorTotal"=$16
         WHERE id=$1 RETURNING *`,
        [
          d.id, d.descricao, d.valorPrevisto || 0, d.tipo || "Despesa",
          d.categoria || "", d.tipoLancamento || null, d.subtipo || null,
          d.obraId || null, d.fornecedorId || null, d.recebedorFornecedor || null,
          d.diaVencimento || 1, d.ativo !== undefined ? d.ativo : true,
          d.dataInicio || null, d.dataTermino || null, d.status || 'Ativo', d.valorTotal || null
        ]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Verifica medições aprovadas
        const { rows } = await client.query('SELECT COUNT(*) FROM contrato_parcelas WHERE "contratoId"=$1 AND "statusAprovacao" = \'Aprovado\'', [id]);
        if (parseInt(rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Este contrato possui medições aprovadas e não pode ser excluído. Você deve inativá-lo ou cancelá-lo." });
        }
        
        // Deleta parcelas pendentes ou rejeitadas
        await client.query('DELETE FROM contrato_parcelas WHERE "contratoId"=$1', [id]);
        // Deleta contrato
        await client.query('DELETE FROM contratos WHERE id=$1', [id]);
        
        await client.query('COMMIT');
        return res.status(200).json({ ok: true });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/contratos] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
