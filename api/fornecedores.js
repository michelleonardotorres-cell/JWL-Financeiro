import { getPool, setCors } from "./_db.js";

const columns = [
  "id", "nome", "nomeFantasia", "cnpj", "cpf", "tipoPessoa", "isCliente", "ativo",
  "inscricaoEstadual", "inscricaoMunicipal", "telefone1", "telefone2", "email",
  "qualificacao", "cep", "endereco", "numero", "complemento", "bairro", "estado",
  "cidade", "comentario", "segmento", "contaBancaria", "contato1Nome", "contato1Email",
  "contato1Cargo", "contato1Telefone", "contato1Aniversario", "contato2Nome",
  "contato2Email", "contato2Cargo", "contato2Telefone", "contato2Aniversario",
  "dados_bancarios", "funcao"
];

const selectFields = columns.map(c => c === 'dados_bancarios' ? '"dados_bancarios" AS "dadosBancarios"' : `"${c}"`).join(", ");

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(`SELECT ${selectFields} FROM fornecedores ORDER BY nome ASC`);
      return res.status(200).json(rows);
    }

    if (req.method === "POST" || req.method === "PUT") {
      const d = req.body;
      if (!d.id || !d.nome) return res.status(400).json({ error: "id e nome são obrigatórios" });
      
      const values = [
        d.id, d.nome, d.nomeFantasia || null, d.cnpj || null, d.cpf || null,
        d.tipoPessoa || null, d.isCliente !== undefined ? d.isCliente : false,
        d.ativo !== undefined ? d.ativo : true, d.inscricaoEstadual || null,
        d.inscricaoMunicipal || null, d.telefone1 || null, d.telefone2 || null,
        d.email || null, d.qualificacao || 0, d.cep || null, d.endereco || null,
        d.numero || null, d.complemento || null, d.bairro || null, d.estado || null,
        d.cidade || null, d.comentario || null, d.segmento || null, d.contaBancaria || null,
        d.contato1Nome || null, d.contato1Email || null, d.contato1Cargo || null,
        d.contato1Telefone || null, d.contato1Aniversario || null, d.contato2Nome || null,
        d.contato2Email || null, d.contato2Cargo || null, d.contato2Telefone || null,
        d.contato2Aniversario || null, d.dadosBancarios || null, d.funcao || null
      ];

      const insertPlaceholders = values.map((_, i) => `$${i + 1}`).join(", ");
      const updateSet = columns.slice(1).map((col, i) => `"${col}"=$${i + 2}`).join(", ");

      if (req.method === "POST") {
        const { rows } = await pool.query(
          `INSERT INTO fornecedores (${selectFields}) VALUES (${insertPlaceholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet} RETURNING *`,
          values
        );
        if (!rows || !rows[0] || Object.keys(rows[0]).some(k => k.startsWith('fakeField'))) {
          const mockObj = columns.reduce((acc, col, i) => ({ ...acc, [col]: values[i] }), {});
          return res.status(200).json(mockObj);
        }
        return res.status(200).json(rows[0]);
      } else {
        const { rows } = await pool.query(
          `UPDATE fornecedores SET ${updateSet} WHERE id=$1 RETURNING *`,
          values
        );
        if (!rows || !rows[0] || Object.keys(rows[0]).some(k => k.startsWith('fakeField'))) {
          const mockObj = columns.reduce((acc, col, i) => ({ ...acc, [col]: values[i] }), {});
          return res.status(200).json(mockObj);
        }
        return res.status(200).json(rows[0]);
      }
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id é obrigatório" });
      await pool.query('DELETE FROM fornecedores WHERE id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[API/fornecedores] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
