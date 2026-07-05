import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { 
        page, limit, 
        dataCompetencia, formaPagamento, nf, recebedorFornecedor, descricao, tipoLancamento, subtipo, obraId, valor, tipo, startDate, endDate 
      } = req.query;

      let whereClause = "WHERE 1=1";
      const params = [];
      let paramCount = 1;

      if (dataCompetencia) {
        whereClause += ` AND "dataCompetencia"::text ILIKE $${paramCount}`;
        params.push(`%${dataCompetencia}%`);
        paramCount++;
      }
      if (formaPagamento) {
        whereClause += ` AND "formaPagamento" ILIKE $${paramCount}`;
        params.push(`%${formaPagamento}%`);
        paramCount++;
      }
      if (nf) {
        whereClause += ` AND nf ILIKE $${paramCount}`;
        params.push(`%${nf}%`);
        paramCount++;
      }
      if (recebedorFornecedor) {
        whereClause += ` AND ("recebedorFornecedor" ILIKE $${paramCount} OR "fornecedorId" ILIKE $${paramCount})`;
        params.push(`%${recebedorFornecedor}%`);
        paramCount++;
      }
      if (descricao) {
        whereClause += ` AND descricao ILIKE $${paramCount}`;
        params.push(`%${descricao}%`);
        paramCount++;
      }
      if (tipoLancamento) {
        whereClause += ` AND (categoria ILIKE $${paramCount} OR "tipoLancamento" ILIKE $${paramCount})`;
        params.push(`%${tipoLancamento}%`);
        paramCount++;
      }
      if (subtipo) {
        whereClause += ` AND subtipo ILIKE $${paramCount}`;
        params.push(`%${subtipo}%`);
        paramCount++;
      }
      if (obraId) {
        whereClause += ` AND "obraId" ILIKE $${paramCount}`;
        params.push(`%${obraId}%`);
        paramCount++;
      }
      if (valor) {
        whereClause += ` AND valor::text ILIKE $${paramCount}`;
        params.push(`%${valor}%`);
        paramCount++;
      }
      if (tipo) {
        whereClause += ` AND tipo = $${paramCount}`;
        params.push(tipo);
        paramCount++;
      }
      if (startDate && endDate) {
        whereClause += ` AND COALESCE("dataCompetencia", "dataVencimento") >= $${paramCount} AND COALESCE("dataCompetencia", "dataVencimento") <= $${paramCount + 1}`;
        params.push(startDate, endDate);
        paramCount += 2;
      }

      const baseQuery = `SELECT id, "dataCompetencia", "dataVencimento", "dataPagamento",
                "formaPagamento", nf, descricao, valor, "valorPago", "jurosMulta", tipo, categoria,
                "tipoLancamento", subtipo, "obraId", "fornecedorId",
                "recebedorFornecedor", "contratoId", status
         FROM lancamentos ${whereClause}`;

      if (!page || !limit) {
        const { rows } = await pool.query(`${baseQuery} ORDER BY "dataVencimento" DESC`, params);
        return res.status(200).json(rows);
      } else {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const countResult = await pool.query(`SELECT COUNT(*) FROM lancamentos ${whereClause}`, params);
        const totalItems = parseInt(countResult.rows[0].count, 10);

        const { rows } = await pool.query(`${baseQuery} ORDER BY "dataVencimento" DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`, [...params, limitNum, offset]);
        return res.status(200).json({ data: rows, totalItems });
      }
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
