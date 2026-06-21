import { lancamentos, obras } from "../mockData";
import { Building2, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { safeFormatDate } from "../utils";

export default function Dashboard() {
  const receitas = lancamentos
    .filter((l) => l.tipo === "Receita")
    .reduce((acc, curr) => acc + curr.valor, 0);
  const despesas = lancamentos
    .filter((l) => l.tipo === "Despesa")
    .reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = receitas - despesas;
  const atrasados = lancamentos
    .filter((l) => l.status === "Atrasado")
    .reduce((acc, curr) => acc + curr.valor, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
          Visão Geral Financeira
        </h1>
        <p className="text-zinc-500 mt-1">
          Resumo consolidado de todas as obras e contas.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">
              Receitas Totais
            </h3>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 mt-4">
            {formatCurrency(receitas)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">
              Despesas Totais
            </h3>
            <TrendingDown className="text-rose-500" size={20} />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 mt-4">
            {formatCurrency(despesas)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">
              Saldo Consolidado
            </h3>
            <Building2 className="text-indigo-500" size={20} />
          </div>
          <p
            className={`text-3xl font-semibold mt-4 ${saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {formatCurrency(saldo)}
          </p>
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-rose-700">
              Contas Atrasadas
            </h3>
            <AlertCircle className="text-rose-600" size={20} />
          </div>
          <p className="text-3xl font-semibold text-rose-700 mt-4">
            {formatCurrency(atrasados)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">
              Últimos Lançamentos
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {lancamentos.slice(0, 5).map((l) => (
              <div
                key={l.id}
                className="p-4 flex items-center justify-between hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {l.descricao}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {safeFormatDate(l.dataCompetencia)} &bull;{" "}
                    {l.categoria}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${l.tipo === "Receita" ? "text-emerald-600" : "text-zinc-900"}`}
                  >
                    {l.tipo === "Despesa" ? "-" : "+"}
                    {formatCurrency(l.valor)}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1
                    ${
                      l.status === "Pago"
                        ? "bg-emerald-100 text-emerald-800"
                        : l.status === "Atrasado"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">
              Obras Ativas
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {obras.map((o) => (
              <div
                key={o.id}
                className="p-4 flex items-center justify-between hover:bg-zinc-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Building2 className="text-indigo-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {o.nome}
                    </p>
                    <p className="text-xs text-zinc-500">{o.status}</p>
                  </div>
                </div>
                <button className="text-sm text-indigo-600 font-medium hover:underline">
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
