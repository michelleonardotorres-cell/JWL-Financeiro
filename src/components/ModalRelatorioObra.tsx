import { useState, useEffect } from "react";
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

  const COLORS = ["#0ea5e9", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981"];

  const obraSelecionada = obras.find(o => o.id === selectedObraId);
  const valorTotalContrato = (obraSelecionada?.valorContrato || 0) + (obraSelecionada?.aditivo || 0) + (obraSelecionada?.reajusteContrato || 0);
  const saldoAMedir = Math.max(0, valorTotalContrato - totalMedido);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-50 rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
              <Building2 className="text-indigo-600" />
              Relatório por Obra
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Resumo financeiro detalhado por projeto.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              className="bg-zinc-50 border border-zinc-300 text-zinc-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 px-3 shadow-sm"
            >
              {sortedObras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm col-span-1 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium text-zinc-500 uppercase">Valor Total do Contrato</p>
              <p className="text-xl font-bold text-zinc-900 mt-2">
                {formatCurrency(valorTotalContrato)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm col-span-1 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium text-emerald-700 uppercase">Saldo a Medir</p>
              <p className="text-xl font-bold text-emerald-800 mt-2">
                {formatCurrency(saldoAMedir)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
              <p className="text-xs font-medium text-zinc-500 uppercase">Receitas</p>
              <p className="text-xl font-bold text-emerald-600 mt-2">
                {formatCurrency(receitas)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
              <p className="text-xs font-medium text-zinc-500 uppercase">Custos</p>
              <p className="text-xl font-bold text-rose-600 mt-2">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
              <p className="text-xs font-medium text-zinc-500 uppercase">Resultado</p>
              <p className={`text-xl font-bold mt-2 ${saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col print:mb-8 print:break-inside-avoid">
              <h3 className="text-lg font-semibold text-zinc-900 mb-2 shrink-0">
                Composição de Custos
              </h3>
              <div className="flex-1 min-h-[400px]">
                {despesasPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
                      <Pie
                        data={despesasPorCategoria}
                        cx="50%"
                        cy="45%"
                        innerRadius={90}
                        outerRadius={130}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={true}
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
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    Sem custos registrados para esta obra.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col print:break-inside-avoid">
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
                        className="w-3 h-3 rounded-full"
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
