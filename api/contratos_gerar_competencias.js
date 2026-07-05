import { getPool, setCors } from "./_db.js";

// Função auxiliar para gerar um UUID compatível (ou random rápido)
function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const pool = getPool();

  try {
    const { mes, ano } = req.body;
    const targetMonth = Number(mes) || new Date().getMonth() + 1; // 1 to 12
    const targetYear = Number(ano) || new Date().getFullYear();

    // 1. Obter todos os contratos ativos
    const { rows: contratos } = await pool.query(
      `SELECT * FROM contratos WHERE status = 'Ativo'`
    );

    let parcelasGeradas = 0;

    for (const c of contratos) {
      // Regras de vigência (se dataInicio / dataTermino existirem)
      if (c.dataInicio) {
        const inicioDate = new Date(c.dataInicio);
        if (targetYear < inicioDate.getFullYear() || (targetYear === inicioDate.getFullYear() && targetMonth < inicioDate.getMonth() + 1)) {
          continue; // Contrato ainda não começou
        }
      }
      if (c.dataTermino) {
        const terminoDate = new Date(c.dataTermino);
        if (targetYear > terminoDate.getFullYear() || (targetYear === terminoDate.getFullYear() && targetMonth > terminoDate.getMonth() + 1)) {
          continue; // Contrato já terminou
        }
      }

      // 2. Checar se já existe parcela para este mês e ano
      const { rows: parcelasExistentes } = await pool.query(
        `SELECT id FROM contrato_parcelas 
         WHERE "contratoId" = $1 
         AND EXTRACT(MONTH FROM "dataVencimento") = $2 
         AND EXTRACT(YEAR FROM "dataVencimento") = $3`,
        [c.id, targetMonth, targetYear]
      );

      if (parcelasExistentes.length === 0) {
        // Criar parcela
        const diaVenc = c.diaVencimento || 1;
        // Lida com meses com menos dias (ex: Fev 30 -> Fev 28)
        let vencimentoDate = new Date(targetYear, targetMonth - 1, diaVenc);
        if (vencimentoDate.getMonth() !== targetMonth - 1) {
           vencimentoDate = new Date(targetYear, targetMonth, 0); // último dia do mês desejado
        }
        
        const dataVencimentoStr = vencimentoDate.toISOString().split('T')[0];

        // Descobrir qual o número desta parcela baseada no banco (simplificado)
        const { rows: stats } = await pool.query(
          `SELECT MAX("numeroParcela") as max_num FROM contrato_parcelas WHERE "contratoId" = $1`,
          [c.id]
        );
        const numeroParcela = (stats[0].max_num || 0) + 1;
        
        // Se for conta de consumo e não tiver valor total, o valor gerado é 0 para ser preenchido
        const valorFixo = (c.tipoLancamento === 'Conta de Consumo' && !c.valorTotal) ? 0 : (c.valorTotal || c.valorPrevisto || 0);

        const newId = generateId('cp');
        await pool.query(
          `INSERT INTO contrato_parcelas
             (id, "contratoId", "numeroParcela", valor, "dataVencimento", "statusAprovacao")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newId, c.id, numeroParcela, valorFixo, dataVencimentoStr, 'Pendente']
        );
        parcelasGeradas++;
      }
    }

    return res.status(200).json({ ok: true, message: `${parcelasGeradas} parcelas geradas com sucesso para ${targetMonth}/${targetYear}.`, count: parcelasGeradas });

  } catch (err) {
    console.error("[API/contratos_gerar_competencias] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
