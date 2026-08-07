import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    // List orcamentos (if obraId is provided, filters by obraId)
    // Actually, usually we fetch the budget for a specific obra.
    if (req.method === "GET") {
      const { obraId, id } = req.query;
      
      if (id) {
        // Fetch a specific orcamento and its items
        const { rows: orcamentos } = await pool.query('SELECT * FROM orcamentos WHERE id = $1', [id]);
        if (orcamentos.length === 0) return res.status(404).json({ error: "Orçamento não encontrado" });
        
        const { rows: itens } = await pool.query('SELECT * FROM orcamento_itens WHERE "orcamentoId" = $1', [id]);
        return res.status(200).json({ ...orcamentos[0], itens });
      }

      if (obraId) {
        // Fetch the budget for this obra
        const { rows } = await pool.query('SELECT * FROM orcamentos WHERE "obraId" = $1', [obraId]);
        if (rows.length === 0) {
            return res.status(200).json(null); // No budget yet
        }
        const { rows: itens } = await pool.query('SELECT * FROM orcamento_itens WHERE "orcamentoId" = $1', [rows[0].id]);
        return res.status(200).json({ ...rows[0], itens });
      }

      // List all budgets
      const { rows } = await pool.query('SELECT * FROM orcamentos');
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      // Create or update a full budget tree
      const { id, obraId, taxaBdi, descontoGlobal, itens } = req.body;
      if (!id || !obraId) return res.status(400).json({ error: "id e obraId são obrigatórios" });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Safety check: ensure columns exist before upserting (fixes Vercel warm start migration issues)
        await client.query('ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS "descontoGlobal" numeric DEFAULT 0').catch(() => {});
        await client.query('ALTER TABLE orcamento_itens ADD COLUMN IF NOT EXISTS "descontoItem" numeric').catch(() => {});
        await client.query('ALTER TABLE orcamento_itens ADD COLUMN IF NOT EXISTS overrides jsonb').catch(() => {});

        // Upsert budget
        await client.query(`
          INSERT INTO orcamentos (id, "obraId", "taxaBdi", "descontoGlobal")
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET "taxaBdi" = $3, "descontoGlobal" = $4
        `, [id, obraId, taxaBdi || null, descontoGlobal || 0]);

        // If items are provided, replace them all for simplicity (or we can just upsert/delete)
        if (itens && Array.isArray(itens)) {
          // Delete existing items to recreate the tree (simple approach)
          await client.query('DELETE FROM orcamento_itens WHERE "orcamentoId" = $1', [id]);
          
          for (const item of itens) {
            await client.query(`
              INSERT INTO orcamento_itens (id, "orcamentoId", "parentId", codigo, descricao, unidade, quantidade, "valorUnitMo", "valorUnitMat", "bdiItem", "descontoItem", overrides)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              item.id, id, item.parentId || null, item.codigo || null, item.descricao, 
              item.unidade || null, item.quantidade || null, item.valorUnitMo || null, 
              item.valorUnitMat || null, item.bdiItem !== undefined ? item.bdiItem : null,
              item.descontoItem !== undefined ? item.descontoItem : null,
              item.overrides ? JSON.stringify(item.overrides) : null
            ]);
          }
        }
        
        await client.query('COMMIT');
        return res.status(200).json({ success: true, id });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/orcamentos] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
