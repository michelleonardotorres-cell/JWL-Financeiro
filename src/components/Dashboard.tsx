import React, { useState, useEffect } from "react";
import { Building2, TrendingDown, TrendingUp, AlertCircle, Edit2, X, Printer, Phone, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { safeFormatDate } from "../utils";
import { useData } from "../contexts/DataContext";
import { Lancamento } from "../types";

const today = new Date();
today.setHours(0, 0, 0, 0);

const getDaysDiff = (dateStr: string | undefined | null) => {
  if (!dateStr) return null;
  const targetDate = new Date(dateStr + "T00:00:00");
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function Dashboard() {
  const { obras, fornecedores, lancamentos: allLancamentos } = useData();

  const [globalPeriod, setGlobalPeriod] = useState<string>("mes_atual");
  const [globalObra, setGlobalObra] = useState<string>("all");
  const [filterPagamentos, setFilterPagamentos] = useState<string>("all");
  const [filterRecebimentos, setFilterRecebimentos] = useState<string>("all");
  const [modalData, setModalData] = useState<{ title: string; items: Lancamento[] } | null>(null);

  useEffect(() => {
    // TODO: Connect to backend API (Prisma/PostgreSQL)
    // This hook will trigger refetch whenever globalPeriod or globalObra changes.
    console.log("Refetching dashboard data for:", { globalPeriod, globalObra });
  }, [globalPeriod, globalObra]);

  const isDateInPeriod = (dateStr: string | null | undefined, period: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T00:00:00");
    const now = new Date();
    
    if (period === "mes_atual") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (period === "ultimos_30") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return date >= thirtyDaysAgo && date <= now;
    }
    if (period === "este_ano") {
      return date.getFullYear() === now.getFullYear();
    }
    return true; 
  };

  const lancamentos = allLancamentos.filter(l => {
    if (globalObra !== "all") {
       const obra = obras.find(o => o.id === globalObra);
       if (l.obraId !== globalObra && l.obraId !== obra?.nome) return false;
    }
    if (globalPeriod !== "personalizado") {
       const dateToUse = l.dataVencimento || l.dataCompetencia;
       if (!isDateInPeriod(dateToUse, globalPeriod)) return false;
    }
    return true;
  });

  const receitas = lancamentos.filter((l) => l.tipo === "Receita").reduce((acc, curr) => acc + curr.valor, 0);
  const despesas = lancamentos.filter((l) => l.tipo === "Despesa").reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = receitas - despesas;
  const atrasados = lancamentos.filter((l) => l.status === "Atrasado").reduce((acc, curr) => acc + curr.valor, 0);

  const getBuckets = (type: "Despesa" | "Receita", filter: string) => {
    const filtered = lancamentos.filter((l) => {
      if (l.tipo !== type) return false;
      if (l.status === "Pago") return false; // only abertos/atrasados
      if (filter !== "all" && l.obraId !== filter && obras.find(o => o.id === filter)?.nome !== l.obraId) return false;
      return true;
    });

    const buckets = {
      vencidos: [] as Lancamento[],
      hoje: [] as Lancamento[],
      dias7: [] as Lancamento[],
      dias30: [] as Lancamento[],
    };

    filtered.forEach((l) => {
      const days = getDaysDiff(l.dataVencimento || l.dataCompetencia);
      if (days === null) return;

      if (days < 0 && days >= -90) {
        buckets.vencidos.push(l);
      } else if (days === 0) {
        buckets.hoje.push(l);
      } else if (days > 0 && days <= 7) {
        buckets.dias7.push(l);
      } else if (days > 7 && days <= 30) {
        buckets.dias30.push(l);
      }
    });

    return buckets;
  };

  const pagamentos = getBuckets("Despesa", filterPagamentos);
  const recebimentos = getBuckets("Receita", filterRecebimentos);

  const sumBucket = (items: Lancamento[]) => items.reduce((acc, curr) => acc + curr.valor, 0);

  const pagamentosData = [
    { id: "vencidos", name: "Vencidos", value: sumBucket(pagamentos.vencidos), count: pagamentos.vencidos.length, color: "#ef4444", bgClass: "bg-red-500", items: pagamentos.vencidos, label: "Vencidos nos últimos 90 dias" },
    { id: "hoje", name: "Hoje", value: sumBucket(pagamentos.hoje), count: pagamentos.hoje.length, color: "#f59e0b", bgClass: "bg-amber-500", items: pagamentos.hoje, label: "A pagar hoje" },
    { id: "dias7", name: "7 dias", value: sumBucket(pagamentos.dias7), count: pagamentos.dias7.length, color: "#3b82f6", bgClass: "bg-blue-500", items: pagamentos.dias7, label: "A pagar em 7 dias" },
    { id: "dias30", name: "30 dias", value: sumBucket(pagamentos.dias30), count: pagamentos.dias30.length, color: "#9ca3af", bgClass: "bg-gray-400", items: pagamentos.dias30, label: "A pagar em 30 dias" },
  ];

  const recebimentosData = [
    { id: "vencidos", name: "Vencidos", value: sumBucket(recebimentos.vencidos), count: recebimentos.vencidos.length, color: "#ef4444", bgClass: "bg-red-500", items: recebimentos.vencidos, label: "Vencidos nos últimos 90 dias" },
    { id: "hoje", name: "Hoje", value: sumBucket(recebimentos.hoje), count: recebimentos.hoje.length, color: "#f59e0b", bgClass: "bg-amber-500", items: recebimentos.hoje, label: "A receber hoje" },
    { id: "dias7", name: "7 dias", value: sumBucket(recebimentos.dias7), count: recebimentos.dias7.length, color: "#3b82f6", bgClass: "bg-blue-500", items: recebimentos.dias7, label: "A receber em 7 dias" },
    { id: "dias30", name: "30 dias", value: sumBucket(recebimentos.dias30), count: recebimentos.dias30.length, color: "#9ca3af", bgClass: "bg-gray-400", items: recebimentos.dias30, label: "A receber em 30 dias" },
  ];

  const totalPagamentosCount = pagamentosData.reduce((acc, curr) => acc + curr.count, 0);
  const totalRecebimentosCount = recebimentosData.reduce((acc, curr) => acc + curr.count, 0);

  const projecaoRecebimentos = recebimentosData.reduce((acc, curr) => acc + curr.value, 0);
  const projecaoPagamentos = pagamentosData.reduce((acc, curr) => acc + curr.value, 0);
  const saldoProjetado = saldo + projecaoRecebimentos - projecaoPagamentos;
  const isPositivo = saldoProjetado >= 0;

  const renderCard = (title: string, data: any[], filterVal: string, setFilter: (val: string) => void, donutLabel: string, totalCount: number) => {
    const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-600">{title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Conta:</span>
            <div className="relative">
              <select
                value={filterVal}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-transparent text-xs font-medium text-zinc-600 pr-6 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <option value="all">Todas as contas</option>
                {obras.map(o => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
              <Edit2 size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="w-full">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-500">{totalCount} registros</span>
              <span className="font-semibold text-zinc-700">{formatCurrency(totalValue)}</span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-zinc-100">
              {totalValue > 0 ? (
                data.map((item) => {
                  const percentage = (item.value / totalValue) * 100;
                  if (percentage === 0) return null;
                  return (
                    <div
                      key={item.id}
                      style={{ width: `${percentage}%` }}
                      className={`h-full ${item.bgClass} transition-all duration-500 hover:opacity-80 cursor-default`}
                      title={`${item.label}: ${formatCurrency(item.value)}`}
                    ></div>
                  );
                })
              ) : (
                <div className="w-full h-full bg-zinc-100"></div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-0">
            {data.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setModalData({ title: item.label, items: item.items })}
                className={`flex items-center justify-between py-3 px-2 transition-colors hover:bg-zinc-50 rounded-lg ${idx !== data.length - 1 ? 'border-b border-zinc-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.bgClass}`}></div>
                  <span className="text-sm font-medium text-zinc-700">{item.label}</span>
                  <span className="text-xs text-zinc-400">({item.count})</span>
                </div>
                <span className="text-sm font-semibold text-zinc-700">{formatCurrency(item.value)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handlePrintModal = () => {
    if (!modalData) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório - ${modalData.title}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #18181b; }
              h1 { font-size: 24px; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: left; font-size: 14px; }
              th { font-weight: 600; color: #52525b; }
            </style>
          </head>
          <body>
            <h1>${modalData.title}</h1>
            <table>
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Descrição</th>
                  <th>Fornecedor/Recebedor</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${modalData.items.map(l => `
                  <tr>
                    <td>${safeFormatDate(l.dataVencimento || l.dataCompetencia)}</td>
                    <td>${l.descricao}</td>
                    <td>${l.recebedorFornecedor || "-"}</td>
                    <td>${formatCurrency(l.valor)}</td>
                  </tr>
                `).join("")}
                ${modalData.items.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Nenhuma conta encontrada.</td></tr>' : ''}
              </tbody>
            </table>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleWhatsApp = () => {
    if (!modalData) return;
    
    let text = `*${modalData.title}*\n\n`;
    modalData.items.forEach(l => {
      text += `- ${safeFormatDate(l.dataVencimento || l.dataCompetencia)}: ${l.descricao} (${formatCurrency(l.valor)})\n`;
    });
    
    if (modalData.items.length === 0) {
      text += "Nenhuma conta encontrada.\n";
    }
    
    const total = modalData.items.reduce((acc, curr) => acc + curr.valor, 0);
    text += `\n*Total: ${formatCurrency(total)}*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Visão Geral Financeira
          </h1>
          <p className="text-zinc-500 mt-1">
            {globalObra === "all" 
              ? "Resumo consolidado de todas as obras e contas." 
              : `Resumo da obra: ${obras.find(o => o.id === globalObra)?.nome || globalObra}`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={globalPeriod}
            onChange={(e) => setGlobalPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          >
            <option value="mes_atual">Mês Atual</option>
            <option value="ultimos_30">Últimos 30 Dias</option>
            <option value="este_ano">Este Ano</option>
            <option value="personalizado">Personalizado</option>
          </select>
          
          <select
            value={globalObra}
            onChange={(e) => setGlobalObra(e.target.value)}
            className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          >
            <option value="all">Todas as Obras</option>
            {obras.map(o => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Receitas Totais</h3>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <p className="text-2xl font-semibold text-zinc-900 mt-4">{formatCurrency(receitas)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Despesas Totais</h3>
            <TrendingDown className="text-rose-500" size={20} />
          </div>
          <p className="text-2xl font-semibold text-zinc-900 mt-4">{formatCurrency(despesas)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Saldo Consolidado</h3>
            <Building2 className="text-indigo-500" size={20} />
          </div>
          <p className={`text-2xl font-semibold mt-4 ${saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(saldo)}
          </p>
        </div>
        <div className={`p-6 rounded-2xl border shadow-sm transition-colors flex flex-col justify-between ${atrasados > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${atrasados > 0 ? "text-rose-700" : "text-emerald-700"}`}>Contas Atrasadas</h3>
            {atrasados > 0 ? (
              <AlertCircle className="text-rose-600" size={20} />
            ) : (
              <CheckCircle className="text-emerald-600" size={20} />
            )}
          </div>
          <p className={`text-2xl font-semibold mt-4 ${atrasados > 0 ? "text-rose-700" : "text-emerald-700"}`}>{formatCurrency(atrasados)}</p>
        </div>
        
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${isPositivo ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${isPositivo ? "text-emerald-700" : "text-rose-700"}`}>Projeção (30d)</h3>
            {isPositivo ? <ArrowUpRight className="text-emerald-600" size={20} /> : <ArrowDownRight className="text-rose-600" size={20} />}
          </div>
          <p className={`text-2xl font-semibold mt-4 ${isPositivo ? "text-emerald-700" : "text-rose-700"}`}>{formatCurrency(saldoProjetado)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {renderCard("Pagamentos em aberto", pagamentosData, filterPagamentos, setFilterPagamentos, "Pagamentos", totalPagamentosCount)}
        {renderCard("Recebimentos em aberto", recebimentosData, filterRecebimentos, setFilterRecebimentos, "Recebimentos", totalRecebimentosCount)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Últimos Lançamentos</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {lancamentos.slice(0, 5).map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between hover:bg-zinc-50">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{l.descricao}</p>
                  <p className="text-xs text-zinc-500">{safeFormatDate(l.dataCompetencia)} &bull; {l.categoria}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${l.tipo === "Receita" ? "text-emerald-600" : "text-zinc-900"}`}>
                    {l.tipo === "Despesa" ? "-" : "+"}{formatCurrency(l.valor)}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${
                    l.status === "Pago" ? "bg-emerald-100 text-emerald-800" : 
                    l.status === "Atrasado" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {l.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Obras Ativas</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {obras.map((o) => {
              const custoRealizado = allLancamentos.filter(l => l.tipo === "Despesa" && (l.obraId === o.id || l.obraId === o.nome)).reduce((acc, curr) => acc + curr.valor, 0);
              const orcamentoPrevisto = (o.valorContrato || 0) + (o.aditivo || 0) + (o.reajusteContrato || 0) || Math.max(custoRealizado * 1.5, 100000);
              const consumedPercent = Math.min((custoRealizado / orcamentoPrevisto) * 100, 100);
              
              let barColor = "bg-emerald-500";
              if (consumedPercent > 70) barColor = "bg-amber-500";
              if (consumedPercent > 90) barColor = "bg-rose-500";

              return (
                <div key={o.id} className="p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Building2 className="text-indigo-600" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{o.nome}</p>
                        <p className="text-xs text-zinc-500">{o.status}</p>
                      </div>
                    </div>
                    <button className="text-sm text-indigo-600 font-medium hover:underline">Ver Detalhes</button>
                  </div>
                  
                  <div className="mt-3 ml-[52px]">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-500">Orçamento consumido</span>
                      <span className="font-semibold text-zinc-700">{consumedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${consumedPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {modalData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-zinc-800">{modalData.title}</h3>
                <p className="text-sm text-zinc-500 mt-1">{modalData.items.length} registro(s) encontrado(s)</p>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors bg-white p-2 rounded-full border border-zinc-200 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {modalData.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500">Nenhuma conta encontrada neste período.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalData.items.map(l => (
                    <div key={l.id} className="flex justify-between items-center p-4 border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">{l.descricao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${l.status === 'Atrasado' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {safeFormatDate(l.dataVencimento || l.dataCompetencia)}
                          </span>
                          <span className="text-xs text-zinc-500">{l.recebedorFornecedor || "-"}</span>
                        </div>
                      </div>
                      <p className="text-base font-bold text-zinc-900">{formatCurrency(l.valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 rounded-b-2xl flex justify-between items-center">
              <p className="text-sm text-zinc-500 font-medium">
                Total: <span className="text-lg font-bold text-zinc-900">{formatCurrency(modalData.items.reduce((a,b)=>a+b.valor,0))}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handlePrintModal}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Phone size={16} />
                  Enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
