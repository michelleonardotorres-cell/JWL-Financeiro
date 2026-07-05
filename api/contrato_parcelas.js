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
      if (req.query.action === "aprovar") {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "id é obrigatório" });
        
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // 1. Fetch parcel and contract data
          const { rows: pRows } = await client.query(
            `SELECT p.*, c.descricao, c.categoria, c."tipoLancamento", c.subtipo, c."obraId", c."fornecedorId", c."recebedorFornecedor"
             FROM contrato_parcelas p
             JOIN contratos c ON c.id = p."contratoId"
             WHERE p.id = $1 FOR UPDATE`, 
            [id]
          );
          
          if (pRows.length === 0) throw new Error("Parcela não encontrada");
          const parcela = pRows[0];
          
          if (parcela.statusAprovacao !== 'Pendente') {
            throw new Error("Parcela já foi aprovada ou não está pendente");
          }
          
          // 2. Insert into Lancamentos
          const lancId = "l_" + Math.random().toString(36).substring(2, 15);
          await client.query(
            `INSERT INTO lancamentos 
               (id, descricao, valor, tipo, categoria, "tipoLancamento", subtipo, "obraId", "fornecedorId", "recebedorFornecedor", "dataVencimento", "dataCompetencia", status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
            [
              lancId,
              `${parcela.descricao} (Parc ${parcela.numeroParcela})`,
              parcela.valor,
              "Despesa",
              parcela.categoria || "Outros",
              parcela.tipoLancamento || null,
              parcela.subtipo || null,
              parcela.obraId || null,
              parcela.fornecedorId || null,
              parcela.recebedorFornecedor || null,
              parcela.dataVencimento,
              new Date().toISOString().substring(0, 7), // YYYY-MM
              "Aberto"
            ]
          );
          
          // 3. Update contrato_parcelas
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
