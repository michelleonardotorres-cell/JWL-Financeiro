import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { 
        page, limit, 
        dataCompetencia, formaPagamento, nf, recebedorFornecedor, descricao, tipoLancamento, subtipo, obraId, valor, tipo, startDate, endDate, vencimentoStart, vencimentoEnd
      } = req.query;

      let whereClause = "WHERE 1=1";
      const params = [];
      let paramCount = 1;

      if (dataCompetencia) {
        whereClause += ` AND "dataCompetencia"::text ILIKE $${paramCount}`;
        params.push(`%${dataCompetencia}%`);
        paramCount++;
      }
      if (req.query.dataVencimento) {
        whereClause += ` AND "dataVencimento"::text ILIKE $${paramCount}`;
        params.push(`%${req.query.dataVencimento}%`);
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
        whereClause += ` AND ("obraId" ILIKE $${paramCount} OR "obraId" IN (SELECT id FROM obras WHERE nome ILIKE $${paramCount}))`;
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
      if (vencimentoStart && vencimentoEnd) {
        whereClause += ` AND "dataVencimento" >= $${paramCount} AND "dataVencimento" <= $${paramCount + 1}`;
        params.push(vencimentoStart, vencimentoEnd);
        paramCount += 2;
      }

      const sortOrderParam = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

      const baseQuery = `SELECT id, "dataCompetencia", "dataVencimento", "dataPagamento",
                "formaPagamento", nf, descricao, valor, "valorPago", "jurosMulta", tipo, categoria,
                "tipoLancamento", subtipo, "obraId", "fornecedorId",
                "recebedorFornecedor", "contratoId", status, "lancamentoPaiId",
                (
                  SELECT COALESCE(json_agg(
                    json_build_object('id', child.id, 'status', child.status, 'dataVencimento', child."dataVencimento")
                  ), '[]'::json)
                  FROM lancamentos child
                  WHERE child."lancamentoPaiId" = lancamentos.id
                ) AS parcelas
         FROM lancamentos ${whereClause}`;

      if (!page || !limit) {
        const { rows } = await pool.query(`${baseQuery} ORDER BY "dataVencimento" ${sortOrderParam}`, params);
        
        // Also compute totals for the unpaginated call
        const countResult = await pool.query(`SELECT 
          SUM(valor) FILTER (WHERE tipo = 'Receita') as entradas, 
          SUM(valor) FILTER (WHERE tipo = 'Despesa') as saidas 
          FROM lancamentos ${whereClause}`, params);
          
        const countRow = countResult.rows[0] || {};
        const totais = {
          entradas: parseFloat(countRow.entradas || 0),
          saidas: parseFloat(countRow.saidas || 0)
        };
        
        return res.status(200).json({ data: rows, totais, totalItems: rows.length });
      } else {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const countResult = await pool.query(`SELECT COUNT(*),
          SUM(valor) FILTER (WHERE tipo = 'Receita') as entradas, 
          SUM(valor) FILTER (WHERE tipo = 'Despesa') as saidas 
          FROM lancamentos ${whereClause}`, params);
        const countRow = countResult.rows[0] || {};
        const totalItems = parseInt(countRow.count || 0, 10);
        const totais = {
          entradas: parseFloat(countRow.entradas || 0),
          saidas: parseFloat(countRow.saidas || 0)
        };

        const { rows } = await pool.query(`${baseQuery} ORDER BY "dataVencimento" ${sortOrderParam} LIMIT $${paramCount} OFFSET $${paramCount + 1}`, [...params, limitNum, offset]);
        return res.status(200).json({ data: rows, totalItems, totais });
      }
    }

    if (req.method === "POST") {
      const d = req.body;
      if (!d.id || !d.descricao) return res.status(400).json({ error: "id e descricao são obrigatórios" });
      const { rows } = await pool.query(
        `INSERT INTO lancamentos
           (id, "dataCompetencia", "dataVencimento", "dataPagamento", "formaPagamento",
            nf, descricao, valor, "valorPago", "jurosMulta", tipo, categoria, "tipoLancamento", subtipo,
            "obraId", "fornecedorId", "recebedorFornecedor", "contratoId", status, "lancamentoPaiId")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         ON CONFLICT (id) DO UPDATE SET
           "dataCompetencia"=$2, "dataVencimento"=$3, "dataPagamento"=$4, "formaPagamento"=$5,
           nf=$6, descricao=$7, valor=$8, "valorPago"=$9, "jurosMulta"=$10, tipo=$11, categoria=$12, "tipoLancamento"=$13,
           subtipo=$14, "obraId"=$15, "fornecedorId"=$16, "recebedorFornecedor"=$17,
           "contratoId"=$18, status=$19, "lancamentoPaiId"=$20
         RETURNING *`,
        [
          d.id, d.dataCompetencia, d.dataVencimento, d.dataPagamento || null,
          d.formaPagamento || null, d.nf || null, d.descricao, d.valor || 0,
          d.valorPago || null, d.jurosMulta || null,
          d.tipo || "Despesa", d.categoria || "", d.tipoLancamento || null,
          d.subtipo || null, d.obraId || null, d.fornecedorId || null,
          d.recebedorFornecedor || null, d.contratoId || null, d.status || "Aberto", d.lancamentoPaiId || null
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
           "contratoId"=$18, status=$19, "lancamentoPaiId"=$20
         WHERE id=$1 RETURNING *`,
        [
          d.id, d.dataCompetencia, d.dataVencimento, d.dataPagamento || null,
          d.formaPagamento || null, d.nf || null, d.descricao, d.valor || 0,
          d.valorPago || null, d.jurosMulta || null,
          d.tipo || "Despesa", d.categoria || "", d.tipoLancamento || null,
          d.subtipo || null, d.obraId || null, d.fornecedorId || null,
          d.recebedorFornecedor || null, d.contratoId || null, d.status || "Aberto", d.lancamentoPaiId || null
        ]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PATCH") {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "array de ids é obrigatório" });
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      const placeholders = ids.map((_, idx) => `$${idx + 2}`).join(',');
      const { rowCount } = await pool.query(
        `UPDATE lancamentos 
         SET status = 'Pago', "dataPagamento" = $1, "valorPago" = valor 
         WHERE id IN (${placeholders})`,
        [today, ...ids]
      );
      return res.status(200).json({ success: true, count: rowCount });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Excluir a medição (contrato_parcelas) associada a este lançamento, se existir
        await client.query('DELETE FROM contrato_parcelas WHERE "lancamentoId" = $1', [id]);
        
        // Excluir o próprio lançamento
        await client.query('DELETE FROM lancamentos WHERE id=$1', [id]);
        
        await client.query('COMMIT');
        return res.status(200).json({ ok: true });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/lancamentos] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
