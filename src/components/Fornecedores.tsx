import { useState } from "react";
import { Users, Search, AlertCircle } from "lucide-react";
import { normalizeString } from "../utils";
import { useData } from "../contexts/DataContext";

export default function Fornecedores() {
    const { obras, fornecedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const term = normalizeString(searchTerm);

  const fornecedoresComSaldo = fornecedores
    .map((f) => {
      const contasDoFornecedor = lancamentos.filter(
        (l) => l.fornecedorId === f.id && l.tipo === "Despesa",
      );
      const totalAberto = contasDoFornecedor
        .filter((l) => l.status === "Aberto")
        .reduce((acc, curr) => acc + curr.valor, 0);
      const totalAtrasado = contasDoFornecedor
        .filter((l) => l.status === "Atrasado")
        .reduce((acc, curr) => acc + curr.valor, 0);

      return {
        ...f,
        totalAberto,
        totalAtrasado,
        totalDevido: totalAberto + totalAtrasado,
      };
    })
    .filter(
      (f) =>
        f.totalDevido > 0 ||
        normalizeString(f.nome).includes(term),
    );

  const filtered = fornecedoresComSaldo
    .filter(
      (f) =>
        normalizeString(f.nome).includes(term) ||
        f.cnpj.includes(searchTerm),
    )
    .sort((a, b) => b.totalDevido - a.totalDevido);

  return (
    <div className="p-8 w-full h-full flex flex-col space-y-6 overflow-hidden max-w-7xl mx-auto">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Contas a Pagar por Fornecedor
          </h1>
          <p className="text-zinc-500 mt-1">
            Visão consolidada de débitos em aberto por parceiro.
          </p>
        </div>
        <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-rose-100 shrink-0">
          <AlertCircle size={16} />
          Total em Atraso:{" "}
          {formatCurrency(
            fornecedoresComSaldo.reduce(
              (acc, curr) => acc + curr.totalAtrasado,
              0,
            ),
          )}
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-4 bg-zinc-50/50 shrink-0">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar fornecedor por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="min-w-[900px] w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-zinc-50 shadow-[inset_0_-1px_0_rgba(228,228,231,1)]">
              <tr className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="p-4 w-[220px]">Fornecedor</th>
                <th className="p-4 w-[180px]">CNPJ</th>
                <th className="p-4 text-right w-[130px]">A Vencer</th>
                <th className="p-4 text-right w-[130px]">Atrasado</th>
                <th className="p-4 text-right w-[130px]">Total Devido</th>
                <th className="p-4 text-center w-[110px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-zinc-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      <Users className="text-zinc-500" size={14} />
                    </div>
                    <span className="break-words whitespace-normal">{f.nome}</span>
                  </td>
                  <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">{f.cnpj}</td>
                  <td className="p-4 text-sm text-zinc-600 text-right">
                    {formatCurrency(f.totalAberto)}
                  </td>
                  <td
                    className={`p-4 text-sm font-semibold text-right ${f.totalAtrasado > 0 ? "text-rose-600" : "text-zinc-400"}`}
                  >
                    {formatCurrency(f.totalAtrasado)}
                  </td>
                  <td className="p-4 text-sm font-bold text-zinc-900 text-right">
                    {formatCurrency(f.totalDevido)}
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-sm text-indigo-600 font-medium hover:underline">
                      Ver Contas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              Nenhum fornecedor com saldo devedor encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
