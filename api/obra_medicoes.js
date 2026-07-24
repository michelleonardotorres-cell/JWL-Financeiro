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

      // Auto-revert phantom approvals (where lancamentos were deleted)
      await pool.query(`
        UPDATE obra_medicoes om
        SET "statusAprovacao" = 'Pendente', "lancamentoReceitaId" = NULL, "lancamentoImpostoId" = NULL
        WHERE om."obraId" = $1 
          AND om."statusAprovacao" = 'Aprovado' 
          AND om."lancamentoReceitaId" IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM lancamentos l WHERE l.id = om."lancamentoReceitaId")
      `, [obraId]);

      const { rows } = await pool.query(
        `SELECT id, "obraId", "numeroMedicao", valor, "valorRetencao", "dataVencimento", "statusAprovacao", "lancamentoReceitaId", "lancamentoImpostoId"
         FROM obra_medicoes
         WHERE "obraId" = $1
         ORDER BY "numeroMedicao" ASC, "dataVencimento" ASC`,
        [obraId]
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
            `SELECT m.*, o.nome
             FROM obra_medicoes m
             JOIN obras o ON o.id = m."obraId"
             WHERE m.id = $1 FOR UPDATE OF m`, 
            [id]
          );
          
          if (pRows.length === 0) throw new Error("Medição não encontrada");
          const medicao = pRows[0];
          
          if (medicao.statusAprovacao !== 'Pendente') {
            throw new Error("Medição já foi aprovada ou não está pendente");
          }
          
          const lancReceitaId = "l_" + Math.random().toString(36).substring(2, 15);
          let lancImpostoId = null;
          
          const formattedDate = medicao.dataVencimento instanceof Date 
            ? medicao.dataVencimento.toISOString().split('T')[0] 
            : (typeof medicao.dataVencimento === 'string' ? medicao.dataVencimento.split('T')[0] : medicao.dataVencimento);
            
          // Lançamento de Receita
          await client.query(
            `INSERT INTO lancamentos 
               (id, descricao, valor, tipo, categoria, "obraId", "dataVencimento", "dataCompetencia", status, "fornecedorId", "recebedorFornecedor", nf)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              lancReceitaId,
              `Medição ${medicao.numeroMedicao} - ${medicao.nome}`,
              medicao.valor,
              "Receita",
              "RECEITAS",
              medicao.obraId,
              dataVencimento || formattedDate,
              dataCompetencia || formattedDate,
              "Aberto",
              fornecedorId || null,
              recebedorFornecedor || null,
              nf || null
            ]
          );

          // Lançamento de Impostos (Retenção) se houver
          const valorRetencao = Number(medicao.valorRetencao || 0);
          if (valorRetencao > 0) {
            lancImpostoId = "l_" + Math.random().toString(36).substring(2, 15);
            await client.query(
              `INSERT INTO lancamentos 
                 (id, descricao, valor, tipo, categoria, "obraId", "dataVencimento", "dataCompetencia", status, "fornecedorId", "recebedorFornecedor", nf)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                lancImpostoId,
                `Retenção/Impostos da Medição ${medicao.numeroMedicao} - ${medicao.nome}`,
                valorRetencao,
                "Despesa",
                "IMPOSTOS",
                medicao.obraId,
                req.body.dataVencimentoImposto || dataVencimento || formattedDate,
                req.body.dataCompetenciaImposto || dataCompetencia || formattedDate,
                "Aberto",
                req.body.fornecedorImpostoId || null,
                req.body.recebedorFornecedorImposto || null,
                req.body.nfImposto || null
              ]
            );
          }
          
          const { rows: updateRows } = await client.query(
            `UPDATE obra_medicoes SET "statusAprovacao" = 'Aprovado', "lancamentoReceitaId" = $1, "lancamentoImpostoId" = $2 WHERE id = $3 RETURNING *`,
            [lancReceitaId, lancImpostoId, id]
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
            `SELECT * FROM obra_medicoes WHERE id = $1 FOR UPDATE`, 
            [id]
          );
          if (pRows.length === 0) throw new Error("Medição não encontrada");
          const medicao = pRows[0];
          
          if (medicao.statusAprovacao !== 'Aprovado') {
            throw new Error("A medição não está aprovada.");
          }

          // Check Receita
          if (medicao.lancamentoReceitaId) {
            const { rows: lRows } = await client.query(`SELECT status FROM lancamentos WHERE id = $1`, [medicao.lancamentoReceitaId]);
            if (lRows.length > 0) {
              if (lRows[0].status === 'Pago') throw new Error("Não é possível reverter a aprovação: a receita já consta como PAGA.");
              await client.query(`DELETE FROM lancamentos WHERE id = $1`, [medicao.lancamentoReceitaId]);
            }
          }
          // Check Imposto
          if (medicao.lancamentoImpostoId) {
            const { rows: iRows } = await client.query(`SELECT status FROM lancamentos WHERE id = $1`, [medicao.lancamentoImpostoId]);
            if (iRows.length > 0) {
              if (iRows[0].status === 'Pago') throw new Error("Não é possível reverter a aprovação: a retenção/imposto já consta como PAGA.");
              await client.query(`DELETE FROM lancamentos WHERE id = $1`, [medicao.lancamentoImpostoId]);
            }
          }

          const { rows: updateRows } = await client.query(
            `UPDATE obra_medicoes SET "statusAprovacao" = 'Pendente', "lancamentoReceitaId" = NULL, "lancamentoImpostoId" = NULL WHERE id = $1 RETURNING *`,
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
      if (!d.id || !d.obraId) return res.status(400).json({ error: "id e obraId são obrigatórios" });
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const { rows } = await client.query(
          `INSERT INTO obra_medicoes
             (id, "obraId", "numeroMedicao", valor, "valorRetencao", "dataVencimento", "statusAprovacao")
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET
             "numeroMedicao"=$3, valor=$4, "valorRetencao"=$5, "dataVencimento"=$6, "statusAprovacao"=$7
           RETURNING *`,
          [
            d.id, d.obraId, d.numeroMedicao || 1, d.valor || 0, d.valorRetencao || 0, d.dataVencimento,
            d.statusAprovacao || 'Pendente'
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
        
        const { rows } = await client.query(
          `UPDATE obra_medicoes SET
             valor = $2,
             "valorRetencao" = $3,
             "dataVencimento" = $4
           WHERE id = $1 AND "statusAprovacao" = 'Pendente'
           RETURNING *`,
          [d.id, d.valor, d.valorRetencao, d.dataVencimento]
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
      await pool.query('DELETE FROM obra_medicoes WHERE id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/obra_medicoes] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
