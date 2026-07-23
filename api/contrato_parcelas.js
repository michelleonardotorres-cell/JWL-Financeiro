import { getPool, setCors } from "./_db.js";

async function validateSaldoRestante(client, contratoId, novaMedicaoValor, excludeParcelaId = null) {
  const { rows: cRows } = await client.query('SELECT * FROM contratos WHERE id = $1', [contratoId]);
  if (cRows.length === 0) throw new Error("Contrato não encontrado");
  const contrato = cRows[0];
  
  if (contrato.tipoLancamento === 'Conta de Consumo' || contrato.tipoLancamento === 'Aluguel/Locação') {
    return true;
  }
  
  const global = Number(contrato.valorTotal || contrato.valorPrevisto || 0);
  
  let sumQuery = 'SELECT SUM(valor) as total FROM contrato_parcelas WHERE "contratoId" = $1';
  const params = [contratoId];
  if (excludeParcelaId) {
    sumQuery += ' AND id != $2';
    params.push(excludeParcelaId);
  }
  const { rows: sumRows } = await client.query(sumQuery, params);
  const totalMedido = Number(sumRows[0].total || 0);
  
  const saldoRestante = global - totalMedido;
  // Use a small epsilon for floating point comparison
  if (Number(novaMedicaoValor) > saldoRestante + 0.01) {
    throw new Error(`Saldo Insuficiente. Saldo restante: R$ ${saldoRestante.toFixed(2)}`);
  }
  return true;
}

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

      // Auto-revert phantom approvals (where lancamento was deleted directly in the database or before cascade delete was implemented)
      await pool.query(`
        UPDATE contrato_parcelas cp
        SET "statusAprovacao" = 'Pendente', "lancamentoId" = NULL
        WHERE cp."contratoId" = $1 
          AND cp."statusAprovacao" = 'Aprovado' 
          AND cp."lancamentoId" IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM lancamentos l WHERE l.id = cp."lancamentoId")
      `, [contratoId]);

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
      if (req.query.action === "aprovar") {
        const { id, fornecedorId, recebedorFornecedor, dataVencimento, dataCompetencia, nf } = req.body;
        if (!id) return res.status(400).json({ error: "id é obrigatório" });
        
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          const { rows: pRows } = await client.query(
            `SELECT p.*, c.descricao, c.categoria, c."tipoLancamento", c.subtipo, c."obraId", c."fornecedorId", 
               COALESCE(f.nome, r.nome, c."recebedorFornecedor") as "nomeFornecedor"
             FROM contrato_parcelas p
             JOIN contratos c ON c.id = p."contratoId"
             LEFT JOIN fornecedores f ON f.id = c."fornecedorId"
             LEFT JOIN recebedores r ON r.id = c."fornecedorId"
             WHERE p.id = $1 FOR UPDATE OF p`, 
            [id]
          );
          
          if (pRows.length === 0) throw new Error("Medição não encontrada");
          const parcela = pRows[0];
          
          if (parcela.statusAprovacao !== 'Pendente') {
            throw new Error("Medição já foi aprovada ou não está pendente");
          }

          await validateSaldoRestante(client, parcela.contratoId, parcela.valor, parcela.id);
          
          const lancId = "l_" + Math.random().toString(36).substring(2, 15);
          const formattedDate = parcela.dataVencimento instanceof Date 
            ? parcela.dataVencimento.toISOString().split('T')[0] 
            : (typeof parcela.dataVencimento === 'string' ? parcela.dataVencimento.split('T')[0] : parcela.dataVencimento);
            
          await client.query(
            `INSERT INTO lancamentos 
               (id, descricao, valor, tipo, categoria, "tipoLancamento", subtipo, "obraId", "fornecedorId", "recebedorFornecedor", "dataVencimento", "dataCompetencia", status, nf)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [
              lancId,
              `${parcela.descricao} (Medição ${parcela.numeroParcela})`,
              parcela.valor,
              "Despesa",
              parcela.categoria || "Outros",
              parcela.tipoLancamento || null,
              parcela.subtipo || null,
              parcela.obraId || null,
              fornecedorId || parcela.fornecedorId || null,
              recebedorFornecedor || parcela.nomeFornecedor || null,
              dataVencimento || formattedDate,
              dataCompetencia || formattedDate,
              "Aberto",
              nf || null
            ]
          );
          
          const { rows: updateRows } = await client.query(
            `UPDATE contrato_parcelas SET "statusAprovacao" = 'Aprovado', "lancamentoId" = $1 WHERE id = $2 RETURNING *`,
            [lancId, id]
          );
          
          await client.query('COMMIT');
          return res.status(200).json(updateRows[0]);
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }

      if (req.query.action === "reverter") {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "id é obrigatório" });
        
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          const { rows: pRows } = await client.query(
            `SELECT * FROM contrato_parcelas WHERE id = $1 FOR UPDATE`, 
            [id]
          );
          if (pRows.length === 0) throw new Error("Medição não encontrada");
          const parcela = pRows[0];
          
          if (parcela.statusAprovacao !== 'Aprovado') {
            throw new Error("A medição não está aprovada.");
          }

          if (parcela.lancamentoId) {
            const { rows: lRows } = await client.query(
              `SELECT status FROM lancamentos WHERE id = $1`,
              [parcela.lancamentoId]
            );
            if (lRows.length > 0) {
              if (lRows[0].status === 'Pago') {
                throw new Error("Não é possível reverter a aprovação: o lançamento já consta como PAGO no Contas a Pagar.");
              }
              await client.query(`DELETE FROM lancamentos WHERE id = $1`, [parcela.lancamentoId]);
            }
          }

          const { rows: updateRows } = await client.query(
            `UPDATE contrato_parcelas SET "statusAprovacao" = 'Pendente', "lancamentoId" = NULL WHERE id = $1 RETURNING *`,
            [id]
          );
          
          await client.query('COMMIT');
          return res.status(200).json(updateRows[0]);
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }

      // POST Create Measurement
      const d = req.body;
      if (!d.id || !d.contratoId) return res.status(400).json({ error: "id e contratoId são obrigatórios" });
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await validateSaldoRestante(client, d.contratoId, d.valor || 0);

        const { rows } = await client.query(
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
        await client.query('COMMIT');
        return res.status(200).json(rows[0]);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    if (req.method === "PUT") {
      const d = req.body;
      if (!d.id) return res.status(400).json({ error: "id é obrigatório" });
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const { rows: pRows } = await client.query('SELECT "contratoId" FROM contrato_parcelas WHERE id = $1', [d.id]);
        if (pRows.length === 0) throw new Error("Medição não encontrada");

        await validateSaldoRestante(client, pRows[0].contratoId, d.valor, d.id);

        const { rows } = await client.query(
          `UPDATE contrato_parcelas SET
             valor = $2,
             "dataVencimento" = $3
           WHERE id = $1 AND "statusAprovacao" = 'Pendente'
           RETURNING *`,
          [d.id, d.valor, d.dataVencimento]
        );
        
        if (rows.length === 0) {
          throw new Error("Medição não encontrada ou já aprovada/rejeitada.");
        }
        await client.query('COMMIT');
        return res.status(200).json(rows[0]);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
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
