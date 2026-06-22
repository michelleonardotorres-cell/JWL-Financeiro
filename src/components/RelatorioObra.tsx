import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Building2 } from "lucide-react";
import { useData } from "../contexts/DataContext";

export default function RelatorioObra() {
    const { obras, fornecedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

  const sortedObras = [...obras].sort((a, b) => a.nome.localeCompare(b.nome));
  const [selectedObraId, setSelectedObraId] = useState<string>(sortedObras[0]?.id || "");

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

  const categorias = [
    "Materiais",
    "Mão de Obra",
    "Equipamentos",
    "Impostos",
    "Despesas Administrativas",
  ];
  const despesasPorCategoria = categorias
    .map((cat) => ({
      name: cat,
      value: despesas
        .filter((d) => d.categoria === cat)
        .reduce((acc, curr) => acc + curr.valor, 0),
    }))
    .filter((c) => c.value > 0);

  const COLORS = ["#0ea5e9", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981"];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Relatório por Obra
          </h1>
          <p className="text-zinc-500 mt-1">
            Resumo financeiro detalhado por projeto.
          </p>
        </div>
        <select
          value={selectedObraId}
          onChange={(e) => setSelectedObraId(e.target.value)}
          className="bg-white border border-zinc-300 text-zinc-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm"
        >
          {sortedObras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Receitas da Obra</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">
            {formatCurrency(receitas)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Custos Totais</p>
          <p className="text-3xl font-semibold text-rose-600 mt-2">
            {formatCurrency(totalDespesas)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Resultado da Obra</p>
          <p
            className={`text-3xl font-semibold mt-2 ${saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">
            Composição de Custos
          </h3>
          <div className="h-80">
            {despesasPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={despesasPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
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
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Sem custos registrados para esta obra.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900">
              Detalhamento de Custos
            </h3>
            <Building2 className="text-zinc-400" size={20} />
          </div>
          <div className="divide-y divide-zinc-100">
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
  );
}
