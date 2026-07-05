import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  subMonths,
  isAfter,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { safeParseISO } from "../utils";
import { ptBR } from "date-fns/locale";
import { TrendingUp, CalendarDays } from "lucide-react";
import { useData } from "../contexts/DataContext";

export default function Receitas() {
    const { obras, fornecedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  // Gerar últimos 12 meses
  const hoje = new Date(); // Usando data dinâmica atual
  const meses = Array.from({ length: 12 }).map((_, i) => {
    const data = subMonths(hoje, 11 - i);
    return {
      mes: format(data, "MMM/yy", { locale: ptBR }),
      inicio: startOfMonth(data),
      fim: endOfMonth(data),
      valor: 0,
    };
  });

  // Preencher valores
  const receitas = lancamentos.filter((l) => l.tipo === "Receita");

  meses.forEach((m) => {
    const receitasMes = receitas.filter((r) => {
      const dataComp = safeParseISO(r.dataCompetencia);
      if (!dataComp) return false;
      return isAfter(dataComp, m.inicio) && isAfter(m.fim, dataComp);
    });
    m.valor = receitasMes.reduce((acc, curr) => acc + curr.valor, 0);
  });

  const total12Meses = meses.reduce((acc, curr) => acc + curr.valor, 0);
  const mediaMensal = total12Meses / 12;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Relatório de Faturamento
          </h1>
          <p className="text-zinc-500 mt-1">
            Análise de receitas dos últimos 12 meses.
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-emerald-100">
          <TrendingUp size={16} />
          Total 12M: {formatCurrency(total12Meses)}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <CalendarDays className="text-indigo-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Média Mensal de Faturamento
            </p>
            <p className="text-2xl font-semibold text-zinc-900">
              {formatCurrency(mediaMensal)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Melhor Mês</p>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatCurrency(Math.max(...meses.map((m) => m.valor)))}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-6">
          Faturamento por Mês (Últimos 12 Meses)
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={meses}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e4e4e7"
              />
              <XAxis
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "#f4f4f5" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Faturamento",
                ]}
                labelStyle={{
                  color: "#71717a",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              />
              <Bar
                dataKey="valor"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
