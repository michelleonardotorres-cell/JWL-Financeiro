import { getPool, setCors } from "./_db.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    // Garantir que a coluna existe antes de qualquer query (seja GET ou POST)
    await pool.query('ALTER TABLE orcamentos_detalhados ADD COLUMN IF NOT EXISTS numero_controle INTEGER').catch(() => {});

    if (req.method === "GET") {
      const { obra_id } = req.query;
      let query = "SELECT * FROM orcamentos_detalhados";
      const params = [];
      
      if (obra_id) {
        query += " WHERE obra_id = $1";
        params.push(obra_id);
      }
      query += " ORDER BY numero_controle DESC NULLS LAST, xata_createdat DESC";
      
      const { rows } = await pool.query(query, params);
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { nome_etapa, obra_id, itens, cotacoes_mat, cotacoes_mo, total_planilha, total_real_mat, total_real_mo } = req.body;


      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Obter o maximo numero_controle atual para a obra
        const maxResult = await client.query('SELECT MAX(numero_controle) as max_num FROM orcamentos_detalhados WHERE obra_id = $1', [obra_id]);
        const nextNum = (maxResult.rows[0].max_num || 0) + 1;

        const { rows } = await client.query(
          `INSERT INTO orcamentos_detalhados 
          (nome_etapa, obra_id, itens, cotacoes_mat, cotacoes_mo, total_planilha, total_real_mat, total_real_mo, numero_controle) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            nome_etapa, obra_id, 
            itens ? JSON.stringify(itens) : "[]", 
            cotacoes_mat ? JSON.stringify(cotacoes_mat) : "[]", 
            cotacoes_mo ? JSON.stringify(cotacoes_mo) : "[]", 
            total_planilha || 0, 
            total_real_mat || 0, 
            total_real_mo || 0,
            nextNum
          ]
        );
        
        await client.query('COMMIT');
        return res.status(201).json(rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    if (req.method === "PUT") {
      const { id, nome_etapa, itens, cotacoes_mat, cotacoes_mo, total_planilha, total_real_mat, total_real_mo } = req.body;
      const { rows } = await pool.query(
        `UPDATE orcamentos_detalhados 
        SET nome_etapa = $1, itens = $2, cotacoes_mat = $3, cotacoes_mo = $4, total_planilha = $5, total_real_mat = $6, total_real_mo = $7, xata_updatedat = now()
        WHERE id = $8 RETURNING *`,
        [
          nome_etapa, 
          itens ? JSON.stringify(itens) : "[]", 
          cotacoes_mat ? JSON.stringify(cotacoes_mat) : "[]", 
          cotacoes_mo ? JSON.stringify(cotacoes_mo) : "[]", 
          total_planilha || 0, 
          total_real_mat || 0, 
          total_real_mo || 0,
          id
        ]
      );
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      await pool.query("DELETE FROM orcamentos_detalhados WHERE id = $1", [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("API orcamentos_detalhados error:", error);
    return res.status(500).json({ error: error.message });
  }
}
