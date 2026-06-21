import { useState } from "react";
import { lancamentos } from "../mockData";
import { Download } from "lucide-react";

export default function DRE() {
  const [visao, setVisao] = useState<"Competencia" | "Caixa">("Competencia");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Lógica simplificada para DRE
  // Competência: considera dataCompetencia
  // Caixa: considera dataPagamento (apenas status Pago)

  const filtrarPorVisao = (l: any) => {
    if (visao === "Competencia") return true;
    return l.status === "Pago" && l.dataPagamento;
  };

  const lancamentosFiltrados = lancamentos.filter(filtrarPorVisao);

  const receitasBrutas = lancamentosFiltrados
    .filter(
      (l) =>
        l.categoria === "Receitas de Vendas" ||
        l.categoria === "Outras Receitas",
    )
    .reduce((acc, curr) => acc + curr.valor, 0);

  const impostos = lancamentosFiltrados
    .filter((l) => l.categoria === "Impostos")
    .reduce((acc, curr) => acc + curr.valor, 0);

  const receitaLiquida = receitasBrutas - impostos;

  const custosDiretos = lancamentosFiltrados
    .filter((l) =>
      ["Materiais", "Mão de Obra", "Equipamentos"].includes(l.categoria),
    )
    .reduce((acc, curr) => acc + curr.valor, 0);

  const lucroBruto = receitaLiquida - custosDiretos;

  const despesasAdmin = lancamentosFiltrados
    .filter((l) => l.categoria === "Despesas Administrativas")
    .reduce((acc, curr) => acc + curr.valor, 0);

  const lucroLiquido = lucroBruto - despesasAdmin;

  const margemLiquida =
    receitasBrutas > 0 ? (lucroLiquido / receitasBrutas) * 100 : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            DRE Construtora
          </h1>
          <p className="text-zinc-500 mt-1">
            Demonstração do Resultado do Exercício.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-100 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setVisao("Competencia")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                visao === "Competencia"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Regime de Competência
            </button>
            <button
              onClick={() => setVisao("Caixa")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                visao === "Caixa"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Regime de Caixa
            </button>
          </div>
          <button className="bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50/50">
          <h2 className="text-lg font-semibold text-zinc-900">
            Resumo do Período
          </h2>
          <p className="text-sm text-zinc-500">
            Visão consolidada de todas as obras.
          </p>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-zinc-200">
              <tr className="hover:bg-zinc-50">
                <td className="p-4 text-sm font-medium text-zinc-900 pl-6">
                  1. Receita Bruta de Vendas
                </td>
                <td className="p-4 text-sm font-semibold text-emerald-600 text-right pr-6">
                  {formatCurrency(receitasBrutas)}
                </td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="p-4 text-sm text-zinc-600 pl-10">
                  (-) Impostos sobre Vendas
                </td>
                <td className="p-4 text-sm text-rose-600 text-right pr-6">
                  -{formatCurrency(impostos)}
                </td>
              </tr>
              <tr className="bg-zinc-50/50 border-y-2 border-zinc-200">
                <td className="p-4 text-sm font-bold text-zinc-900 pl-6">
                  2. Receita Líquida
                </td>
                <td className="p-4 text-sm font-bold text-zinc-900 text-right pr-6">
                  {formatCurrency(receitaLiquida)}
                </td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="p-4 text-sm text-zinc-600 pl-10">
                  (-) Custos Diretos (Materiais, M.O., Equip.)
                </td>
                <td className="p-4 text-sm text-rose-600 text-right pr-6">
                  -{formatCurrency(custosDiretos)}
                </td>
              </tr>
              <tr className="bg-zinc-50/50 border-y-2 border-zinc-200">
                <td className="p-4 text-sm font-bold text-zinc-900 pl-6">
                  3. Lucro Bruto
                </td>
                <td className="p-4 text-sm font-bold text-zinc-900 text-right pr-6">
                  {formatCurrency(lucroBruto)}
                </td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="p-4 text-sm text-zinc-600 pl-10">
                  (-) Despesas Administrativas
                </td>
                <td className="p-4 text-sm text-rose-600 text-right pr-6">
                  -{formatCurrency(despesasAdmin)}
                </td>
              </tr>
              <tr className="bg-zinc-900 text-white">
                <td className="p-4 text-base font-bold pl-6">
                  4. Lucro Líquido do Exercício
                </td>
                <td className="p-4 text-base font-bold text-right pr-6">
                  {formatCurrency(lucroLiquido)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
          <span className="text-sm font-medium text-zinc-600">
            Margem Líquida
          </span>
          <span
            className={`text-lg font-bold ${margemLiquida >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {margemLiquida.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
