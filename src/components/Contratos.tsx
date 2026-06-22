import React, { useState, useMemo } from "react";
import { Search, Plus, Save, X, Check, CalendarDays } from "lucide-react";
import { Contrato } from "../types";
import { normalizeString } from "../utils";
import { useData } from "../contexts/DataContext";

export default function Contratos() {
    const { obras, fornecedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

    const [data, setData] = useState<Contrato[]>(initialContratos);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const [newEntry, setNewEntry] = useState<Partial<Contrato>>({
        descricao: "",
        valorPrevisto: 0,
        tipo: "Despesa",
        categoria: "",
        tipoLancamento: "",
        subtipo: "",
        obraId: "",
        recebedorFornecedor: "",
        diaVencimento: 10,
        ativo: true,
    });

    const [valorInput, setValorInput] = useState("");

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);

    const filtered = useMemo(() => {
        const term = normalizeString(searchTerm);
        return data.filter(
            (c) =>
                normalizeString(c.descricao).includes(term) ||
                (c.recebedorFornecedor && normalizeString(c.recebedorFornecedor).includes(term))
        );
    }, [data, searchTerm]);

    const handleAddRow = () => {
        setIsAdding(true);
        setValorInput("");
        setNewEntry({
            descricao: "",
            valorPrevisto: 0,
            tipo: "Despesa",
            categoria: "",
            tipoLancamento: "",
            subtipo: "",
            obraId: "",
            recebedorFornecedor: "",
            diaVencimento: 10,
            ativo: true,
        });
    };

    const handleSave = () => {
        if (!newEntry.descricao || !newEntry.valorPrevisto || !newEntry.diaVencimento) {
            alert("Por favor, preencha a descrição, valor e dia de vencimento.");
            return;
        }

        const entry: Contrato = {
            id: `c${data.length + 1}`,
            descricao: newEntry.descricao,
            valorPrevisto: newEntry.valorPrevisto,
            tipo: "Despesa",
            categoria: newEntry.tipoLancamento || "Outros",
            tipoLancamento: newEntry.tipoLancamento,
            subtipo: newEntry.subtipo,
            obraId: newEntry.obraId,
            recebedorFornecedor: newEntry.recebedorFornecedor,
            diaVencimento: newEntry.diaVencimento,
            ativo: true,
        };

        setData([entry, ...data]);
        initialContratos.unshift(entry);
        setIsAdding(false);
    };

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        const numericValue = Number(value) / 100;
        setValorInput(formatCurrency(numericValue));
        setNewEntry({ ...newEntry, valorPrevisto: numericValue });
    };

    const tiposOptions = [
        "RECEITAS", "COMISSÕES SOBRE VENDAS", "IMPOSTOS", "CUSTO VARIÁVEL",
        "CUSTO FIXO", "DESPESAS OPERACIONAIS", "DESPESAS ADMINISTRATIVAS",
        "DESPESAS FINANCEIRAS", "OUTRAS RECEITAS", "OUTRAS DESPESAS", "PARCELA",
        "RETIRADA VB", "ANTECIPAÇÃO DE RECEBÍVEIS", "AMORTIZAÇÃO",
        "PATRIMÔNIO", "EMPRESTIMOS"
    ];

    return (
        <div className="p-8 w-full h-full flex flex-col space-y-6">
            <header className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-indigo-600" size={32} />
                        Contratos e Recorrências
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Gestão de despesas fixas e previsões de repetição.
                    </p>
                </div>
                <button
                    onClick={handleAddRow}
                    disabled={isAdding}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Plus size={16} />
                    Novo Contrato
                </button>
            </header>

            <div className="bg-white flex flex-col min-h-0 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1">
                <div className="p-4 border-b border-zinc-200 flex items-center gap-4 bg-zinc-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar contratos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="min-w-[990px] w-full table-fixed text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-zinc-50 shadow-[inset_0_-1px_0_rgba(228,228,231,1)]">
                            <tr className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                                <th className="p-4 w-[96px]">Dia Venc.</th>
                                <th className="p-4 w-[150px]">Recebedor/Fornecedor</th>
                                <th className="p-4 w-[220px]">Descrição</th>
                                <th className="p-4 w-[140px]">Tipo Lancamento</th>
                                <th className="p-4 w-[160px]">Centro de Custo</th>
                                <th className="p-4 text-right w-[128px]">Valor Previsto</th>
                                <th className="p-4 text-center w-[96px]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {isAdding && (
                                <tr className="bg-indigo-50/30">
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            placeholder="Dia"
                                            value={newEntry.diaVencimento}
                                            onChange={(e) => setNewEntry({ ...newEntry, diaVencimento: Number(e.target.value) })}
                                            className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-center"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            list="recebedores-list"
                                            placeholder="Recebedor"
                                            value={newEntry.recebedorFornecedor}
                                            onChange={(e) => setNewEntry({ ...newEntry, recebedorFornecedor: e.target.value })}
                                            className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Descrição"
                                            value={newEntry.descricao}
                                            onChange={(e) => setNewEntry({ ...newEntry, descricao: e.target.value })}
                                            className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            list="tipos-list"
                                            placeholder="Tipo"
                                            value={newEntry.tipoLancamento}
                                            onChange={(e) => setNewEntry({ ...newEntry, tipoLancamento: e.target.value })}
                                            className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            list="obras-list"
                                            placeholder="Centro de Custo"
                                            value={newEntry.obraId || ""}
                                            onChange={(e) => setNewEntry({ ...newEntry, obraId: e.target.value })}
                                            className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="R$ 0,00"
                                            value={valorInput}
                                            onChange={handleValorChange}
                                            className="w-full p-2 bg-white border border-zinc-300 rounded text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none font-semibold"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-1.5 w-full">
                                            <button onClick={handleSave} title="Salvar" className="flex-1 p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex justify-center">
                                                <Check size={14} />
                                            </button>
                                            <button onClick={() => setIsAdding(false)} title="Cancelar" className="flex-1 p-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors flex justify-center">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((c) => {
                                const obra = obras.find((o) => o.id === c.obraId || o.nome === c.obraId);
                                const fornecedor = fornecedores.find((f) => f.id === c.fornecedorId);

                                return (
                                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="p-4 text-sm text-zinc-600 whitespace-nowrap text-center font-medium">
                                            Dia {c.diaVencimento}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-zinc-900 break-words whitespace-normal">
                                            {c.recebedorFornecedor || fornecedor?.nome || "-"}
                                        </td>
                                        <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                                            {c.descricao}
                                        </td>
                                        <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 text-[10px] font-medium text-zinc-700">
                                                {c.tipoLancamento || c.categoria}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                                            {obra?.nome || c.obraId || "-"}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-right whitespace-nowrap text-zinc-900">
                                            {formatCurrency(c.valorPrevisto)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Editar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">
                            Nenhum contrato encontrado.
                        </div>
                    )}
                </div>
            </div>
            <datalist id="recebedores-list">
                {[...fornecedores].sort((a, b) => a.nome.localeCompare(b.nome)).map(f => <option key={f.id} value={f.nome} />)}
            </datalist>
            <datalist id="tipos-list">
                {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt} />)}
            </datalist>
            <datalist id="obras-list">
                {[...obras].sort((a, b) => a.nome.localeCompare(b.nome)).map(o => <option key={o.id} value={o.nome} />)}
            </datalist>
        </div>
    );
}
