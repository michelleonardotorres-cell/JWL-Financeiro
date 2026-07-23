import { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Building2, X, Printer } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { obraMedicoesApi } from "../apiClient";

interface ModalRelatorioObraProps {
  obraId: string;
  onClose: () => void;
}

export default function ModalRelatorioObra({ obraId, onClose }: ModalRelatorioObraProps) {
  const { obras, lancamentos } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedObraId, setSelectedObraId] = useState<string>(obraId);
  const [totalMedido, setTotalMedido] = useState<number>(0);

  // Update selected if obraId changes (in case it is reused)
  useEffect(() => {
    if (obraId) setSelectedObraId(obraId);
  }, [obraId]);

  useEffect(() => {
    if (selectedObraId) {
      obraMedicoesApi.getByObraId(selectedObraId).then(medicoes => {
        const medido = medicoes.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
        setTotalMedido(medido);
      }).catch(console.error);
    }
  }, [selectedObraId]);

  const sortedObras = [...obras].sort((a, b) => a.nome.localeCompare(b.nome));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const lancamentosObra = lancamentos.filter(
    (l) => l.obraId === selectedObraId,
  );

  const receitas = lancamentosObra
    .filter((l) => l.tipo === "Receita")
    .reduce((acc, curr) => acc + curr.valor, 0);
  const despesas = lancamentosObra.filter((l) => l.tipo === "Despesa");
  const totalDespesas = despesas.reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = receitas - totalDespesas;

  const despesasPorCategoriaMap = despesas.reduce((acc, d) => {
    const cat = d.tipoLancamento || d.categoria || "Outros";
    acc[cat] = (acc[cat] || 0) + d.valor;
    return acc;
  }, {} as Record<string, number>);

  const despesasPorCategoria = Object.entries(despesasPorCategoriaMap)
    .map(([name, value]) => ({ name, value: value as number }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const COLORS = ["#0ea5e9", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981", "#64748b", "#ec4899"];

  const obraSelecionada = obras.find(o => o.id === selectedObraId);
  const valorTotalContrato = (obraSelecionada?.valorContrato || 0) + (obraSelecionada?.aditivo || 0) + (obraSelecionada?.reajusteContrato || 0);
  const saldoAMedir = Math.max(0, valorTotalContrato - totalMedido);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow || !printRef.current) return;

    // Collect all stylesheets from current document
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.outerHTML)
      .join("\n");
    const styleTags = Array.from(document.querySelectorAll('style'))
      .map(style => style.outerHTML)
      .join("\n");

    const contentHtml = printRef.current.innerHTML;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório da Obra: ${obraSelecionada?.nome || ""}</title>
  ${styleLinks}
  ${styleTags}
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 24px; font-family: sans-serif; background: white; }
    .report-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .report-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
    .report-card { background: white; padding: 16px; border-radius: 16px; border: 1px solid #e4e4e7; }
    .report-card.emerald { border-color: #6ee7b7; background: #ecfdf5; }
    .card-label { font-size: 10px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; }
    .card-label.emerald { color: #059669; }
    .card-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .card-value.gray { color: #18181b; }
    .card-value.green { color: #059669; }
    .card-value.red { color: #e11d48; }
    .report-two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .report-section { background: white; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; }
    .report-section-header { padding: 16px 24px; border-bottom: 1px solid #f4f4f5; display: flex; justify-content: space-between; align-items: center; }
    .report-section-title { font-size: 16px; font-weight: 600; color: #18181b; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f4f4f5; }
    .detail-row:last-child { border-bottom: none; }
    .detail-left { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #3f3f46; font-weight: 500; }
    .detail-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .detail-right { text-align: right; }
    .detail-value { font-size: 13px; font-weight: 600; color: #18181b; }
    .detail-pct { font-size: 11px; color: #71717a; }
    .report-header { margin-bottom: 24px; border-bottom: 2px solid #e4e4e7; padding-bottom: 16px; }
    .report-header h1 { font-size: 22px; font-weight: 700; color: #18181b; margin: 0 0 4px 0; }
    .report-header p { font-size: 13px; color: #71717a; margin: 2px 0; }
    .chart-placeholder { display: flex; align-items: center; justify-content: center; height: 300px; }
    .legend-row { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px 24px; justify-content: center; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #3f3f46; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    @media print {
      body { padding: 0; }
      .report-two-cols { page-break-inside: avoid; }
      .report-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>Relatório da Obra: ${obraSelecionada?.nome || "—"}</h1>
    <p>Cliente: ${obraSelecionada?.cliente || "N/A"}</p>
    <p>Status: ${obraSelecionada?.status || "—"}</p>
    <p style="font-size:11px;color:#a1a1aa;margin-top:8px;">Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
  </div>

  <div class="report-grid-5">
    <div class="report-card">
      <div class="card-label">Valor do Contrato</div>
      <div class="card-value gray">${formatCurrency(valorTotalContrato)}</div>
    </div>
    <div class="report-card emerald">
      <div class="card-label emerald">Saldo a Medir</div>
      <div class="card-value green">${formatCurrency(saldoAMedir)}</div>
    </div>
    <div class="report-card">
      <div class="card-label">Receitas</div>
      <div class="card-value green">${formatCurrency(receitas)}</div>
    </div>
    <div class="report-card">
      <div class="card-label">Custos</div>
      <div class="card-value red">${formatCurrency(totalDespesas)}</div>
    </div>
    <div class="report-card">
      <div class="card-label">Resultado</div>
      <div class="card-value ${saldo >= 0 ? "green" : "red"}">${formatCurrency(saldo)}</div>
    </div>
  </div>

  <div class="report-two-cols">
    <div class="report-section">
      <div class="report-section-header">
        <span class="report-section-title">Composição de Custos</span>
      </div>
      <div id="chart-placeholder" class="chart-placeholder">
        <p style="color:#a1a1aa;font-size:13px;">Gráfico gerado dinamicamente na tela</p>
      </div>
      <div class="legend-row">
        ${despesasPorCategoria.map((cat, idx) => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${COLORS[idx % COLORS.length]}"></div>
            ${cat.name} (${totalDespesas > 0 ? ((cat.value / totalDespesas) * 100).toFixed(0) : 0}%)
          </div>
        `).join("")}
      </div>
    </div>

    <div class="report-section">
      <div class="report-section-header">
        <span class="report-section-title">Detalhamento de Custos</span>
      </div>
      ${despesasPorCategoria.map((cat, idx) => `
        <div class="detail-row">
          <div class="detail-left">
            <div class="detail-dot" style="background:${COLORS[idx % COLORS.length]}"></div>
            ${cat.name}
          </div>
          <div class="detail-right">
            <div class="detail-value">${formatCurrency(cat.value)}</div>
            <div class="detail-pct">${totalDespesas > 0 ? ((cat.value / totalDespesas) * 100).toFixed(1) : 0}% do total</div>
          </div>
        </div>
      `).join("")}
      ${despesasPorCategoria.length === 0 ? `<div style="padding:32px;text-align:center;color:#a1a1aa;font-size:13px;">Nenhum detalhamento disponível.</div>` : ""}
    </div>
  </div>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    // Give time for styles to load then print
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-50 rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
              <Building2 className="text-indigo-600" />
              Relatório por Obra
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Resumo financeiro detalhado por projeto.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex-1 sm:flex-none shadow-sm"
            >
              <Printer size={18} /> <span>Imprimir</span>
            </button>
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              className="bg-zinc-50 border border-zinc-300 text-zinc-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 px-3 shadow-sm flex-1 sm:flex-none max-w-[200px] truncate"
            >
              {sortedObras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content (what the user sees) */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-500 uppercase">Valor do Contrato</p>
              <p className="text-lg lg:text-xl font-bold text-zinc-900 mt-1">
                {formatCurrency(valorTotalContrato)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-medium text-emerald-700 uppercase">Saldo a Medir</p>
              <p className="text-lg lg:text-xl font-bold text-emerald-800 mt-1">
                {formatCurrency(saldoAMedir)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-500 uppercase">Receitas</p>
              <p className="text-lg lg:text-xl font-bold text-emerald-600 mt-1">
                {formatCurrency(receitas)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-500 uppercase">Custos</p>
              <p className="text-lg lg:text-xl font-bold text-rose-600 mt-1">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm md:col-span-2 flex flex-col justify-center">
              <p className="text-xs font-medium text-zinc-500 uppercase">Resultado</p>
              <p className={`text-lg lg:text-xl font-bold mt-1 ${saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2 shrink-0">
                Composição de Custos
              </h3>
              <div className="flex-1 min-h-[400px]">
                {despesasPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={despesasPorCategoria}
                        cx="50%"
                        cy="45%"
                        innerRadius={90}
                        outerRadius={120}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {despesasPorCategoria.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend verticalAlign="bottom" height={48} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    Sem custos registrados para esta obra.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Detalhamento de Custos
                </h3>
                <Building2 className="text-zinc-400" size={20} />
              </div>
              <div className="divide-y divide-zinc-100 flex-1 overflow-y-auto">
                {despesasPorCategoria.map((cat, idx) => (
                  <div
                    key={cat.name}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium text-zinc-700">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(cat.value)}
                      </span>
                      <p className="text-xs text-zinc-500">
                        {totalDespesas > 0
                          ? ((cat.value / totalDespesas) * 100).toFixed(1)
                          : 0}
                        % do total
                      </p>
                    </div>
                  </div>
                ))}
                {despesasPorCategoria.length === 0 && (
                  <div className="p-8 text-center text-zinc-500">
                    Nenhum detalhamento disponível.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
