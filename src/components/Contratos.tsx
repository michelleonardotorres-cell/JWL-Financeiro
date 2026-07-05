import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, Save, X, Check, CalendarDays, Droplets, Building2, Briefcase, FileText, Edit2 } from "lucide-react";
import { Contrato, ContratoParcela } from "../types";
import { normalizeString, safeParseISO, safeFormatDate } from "../utils";
import { useData } from "../contexts/DataContext";
import Combobox from "./Combobox";
import PeriodFilter from "./PeriodFilter";
import { usePeriodFilter } from "../hooks/usePeriodFilter";
import { contratoParcelasApi, contratosApi } from "../apiClient";

export default function Contratos() {
    const { obras, fornecedores, recebedores, contratos, addContrato, updateContrato } = useData();
    const periodFilterState = usePeriodFilter();
    const { activeFilter } = periodFilterState;

    const [data, setData] = useState<Contrato[]>(contratos);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Update local data when global context changes
    useEffect(() => {
      setData(contratos);
    }, [contratos]);

    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);

    // Filtering logic Option A: intercepting dates
    const filtered = useMemo(() => {
        let result = data;

        if (activeFilter) {
            const filterStart = activeFilter.start;
            const filterEnd = activeFilter.end;
            
            result = result.filter(c => {
               if (!c.dataInicio) return true; // Legacy contracts without start date
               const start = c.dataInicio;
               const end = c.dataTermino || "9999-12-31"; // Infinity if not set
               
               // Intersects if contract starts before filter ends AND ends after filter starts
               return start <= filterEnd && end >= filterStart;
            });
        }

        const term = normalizeString(searchTerm);
        if (term) {
            result = result.filter(
                (c) =>
                    normalizeString(c.descricao).includes(term) ||
                    (c.recebedorFornecedor && normalizeString(c.recebedorFornecedor).includes(term)) ||
                    (c.tipoLancamento && normalizeString(c.tipoLancamento).includes(term))
            );
        }
        
        return result;
    }, [data, searchTerm, activeFilter]);

    const getTipoIcon = (tipo: string | undefined) => {
        switch(tipo) {
            case "Conta de Consumo": return <Droplets size={14} className="text-blue-500" />;
            case "Aluguel/Locação": return <Building2 size={14} className="text-amber-500" />;
            case "Contrato de Serviço": return <Briefcase size={14} className="text-indigo-500" />;
            default: return <FileText size={14} className="text-zinc-500" />;
        }
    };

    return (
        <div className="p-8 w-full h-full flex flex-col space-y-6">
            <header className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-indigo-600" size={32} />
                        Gestão de Recorrências
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Controle de contratos fixos, aluguéis e contas de consumo.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <PeriodFilter {...periodFilterState} />
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} />
                        Nova Recorrência
                    </button>
                </div>
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
                                <th className="p-4 w-[160px]">Status / Período</th>
                                <th className="p-4 w-[180px]">Fornecedor</th>
                                <th className="p-4 w-[220px]">Descrição / Centro de Custo</th>
                                <th className="p-4 w-[160px]">Tipo de Recorrência</th>
                                <th className="p-4 text-right w-[140px]">Valor Total/Mensal</th>
                                <th className="p-4 text-center w-[96px]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                                        Nenhum contrato encontrado para este período.
                                    </td>
                                </tr>
                            ) : filtered.map((c) => {
                                const fornecedor = [...fornecedores, ...recebedores].find((f) => f.id === c.fornecedorId || f.id === c.recebedorFornecedor);
                                const obra = obras.find(o => o.id === c.obraId);

                                return (
                                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => { setSelectedContrato(c); setShowDetailsModal(true); }}>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    c.status === 'Finalizado' ? 'bg-zinc-100 text-zinc-600' :
                                                    c.status === 'Cancelado' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {c.status || 'Ativo'}
                                                </span>
                                                {c.dataInicio && (
                                                    <span className="text-[11px] text-zinc-500">
                                                        {safeFormatDate(c.dataInicio)} {c.dataTermino ? `até ${safeFormatDate(c.dataTermino)}` : '(Contínuo)'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-zinc-900 break-words whitespace-normal">
                                            {fornecedor?.nome || c.recebedorFornecedor || "-"}
                                        </td>
                                        <td className="p-4 break-words whitespace-normal">
                                            <div className="text-sm font-semibold text-zinc-800">{c.descricao}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{obra?.nome || "-"}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-700 bg-white border border-zinc-200 px-2.5 py-1 rounded-md w-fit shadow-sm">
                                                {getTipoIcon(c.tipoLancamento)}
                                                <span className="font-medium text-xs">{c.tipoLancamento || c.categoria || "Outros"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-right">
                                            <div className={c.tipo === "Despesa" ? "text-rose-600" : "text-emerald-600"}>
                                                {formatCurrency(c.valorTotal || c.valorPrevisto || 0)}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 font-normal">
                                                {c.tipoLancamento === "Conta de Consumo" ? "Est. Mensal" : "Valor Total"}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                onClick={(e) => { e.stopPropagation(); setSelectedContrato(c); setShowDetailsModal(true); }}
                                            >
                                                <Search size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <ContratoModal 
                    onClose={() => setShowModal(false)} 
                    onSave={async (entry) => {
                        await addContrato(entry);
                        setShowModal(false);
                    }} 
                    fornecedores={[...fornecedores, ...recebedores]}
                    obras={obras}
                />
            )}

            {showDetailsModal && selectedContrato && (
                <ContratoDetalhesModal 
                    contrato={selectedContrato} 
                    onClose={() => { setShowDetailsModal(false); setSelectedContrato(null); }}
                    fornecedores={[...fornecedores, ...recebedores]}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------
// COMPONENTES SECUNDÁRIOS
// ---------------------------------------------------------

function ContratoModal({ onClose, onSave, fornecedores, obras }: { onClose: () => void, onSave: (c: Omit<Contrato, "id">) => Promise<void>, fornecedores: any[], obras: any[] }) {
    const [entry, setEntry] = useState<Partial<Contrato>>({
        descricao: "",
        valorTotal: 0,
        tipo: "Despesa",
        tipoLancamento: "Contrato de Serviço",
        obraId: "",
        fornecedorId: "",
        dataInicio: new Date().toISOString().split('T')[0],
        dataTermino: "",
        diaVencimento: 10,
        status: "Ativo"
    });

    const isConsumo = entry.tipoLancamento === "Conta de Consumo";

    const formatCurrencyInput = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };
    const [valorInput, setValorInput] = useState(formatCurrencyInput(0));

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        const numericValue = Number(value) / 100;
        setValorInput(formatCurrencyInput(numericValue));
        setEntry({ ...entry, valorTotal: numericValue });
    };

    const handleSaveClick = async () => {
        if (!entry.descricao || !entry.valorTotal || !entry.fornecedorId || !entry.obraId || !entry.dataInicio) {
            alert("Por favor, preencha os campos obrigatórios (Descrição, Valor, Fornecedor, Obra, Início).");
            return;
        }
        
        const payload: Omit<Contrato, "id"> = {
            descricao: entry.descricao,
            valorTotal: entry.valorTotal,
            valorPrevisto: entry.valorTotal, // mantendo por compatibilidade
            tipo: entry.tipo as "Despesa" | "Receita",
            categoria: entry.tipoLancamento || "Outros",
            tipoLancamento: entry.tipoLancamento,
            obraId: entry.obraId,
            fornecedorId: entry.fornecedorId,
            recebedorFornecedor: fornecedores.find(f => f.id === entry.fornecedorId)?.nome || "",
            diaVencimento: entry.diaVencimento || 1,
            ativo: true,
            status: entry.status,
            dataInicio: entry.dataInicio,
            dataTermino: entry.dataTermino || undefined,
        };

        try {
            await onSave(payload);
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
                <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Plus size={20} />
                        Nova Recorrência
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto bg-zinc-50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-xs font-semibold text-zinc-600">Tipo de Recorrência</label>
                            <select 
                                value={entry.tipoLancamento} 
                                onChange={e => {
                                    setEntry({...entry, tipoLancamento: e.target.value, dataTermino: "" });
                                }}
                                className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            >
                                <option value="Contrato de Serviço">Contrato de Serviço</option>
                                <option value="Aluguel/Locação">Aluguel/Locação</option>
                                <option value="Conta de Consumo">Conta de Consumo (Água, Luz, etc)</option>
                            </select>
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-xs font-semibold text-zinc-600">Descrição *</label>
                            <input type="text" value={entry.descricao} onChange={e => setEntry({...entry, descricao: e.target.value})} className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ex: Aluguel Sede, Conta de Luz" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-xs font-semibold text-zinc-600">Fornecedor / Credor *</label>
                            <div className="bg-white border border-zinc-300 rounded">
                                <Combobox options={fornecedores.map(f => ({id: f.id, label: f.nome}))} value={entry.fornecedorId || ""} onChange={id => setEntry({...entry, fornecedorId: id})} placeholder="Selecione o Fornecedor" />
                            </div>
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-xs font-semibold text-zinc-600">Centro de Custo (Obra) *</label>
                            <div className="bg-white border border-zinc-300 rounded">
                                <Combobox options={obras.map(o => ({id: o.id, label: o.nome}))} value={entry.obraId || ""} onChange={id => setEntry({...entry, obraId: id})} placeholder="Selecione a Obra" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-zinc-200">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-600">{isConsumo ? "Valor Mensal Estimado *" : "Valor Total *"}</label>
                            <input type="text" value={valorInput} onChange={handleValorChange} className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-600">Data de Início *</label>
                            <input type="date" value={entry.dataInicio} onChange={e => setEntry({...entry, dataInicio: e.target.value})} className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-600">Data de Término {isConsumo && "(Opcional)"}</label>
                            <input type="date" value={entry.dataTermino || ""} onChange={e => setEntry({...entry, dataTermino: e.target.value})} className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white border-t border-zinc-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancelar</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2">
                        <Save size={16} /> Salvar Recorrência
                    </button>
                </div>
            </div>
        </div>
    );
}

function ContratoDetalhesModal({ contrato, onClose, fornecedores }: { contrato: Contrato, onClose: () => void, fornecedores: any[] }) {
    const [parcelas, setParcelas] = useState<ContratoParcela[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        contratoParcelasApi.getByContratoId(contrato.id).then(res => {
            setParcelas(res);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [contrato.id]);

    const isConsumo = contrato.tipoLancamento === "Conta de Consumo";
    
    // Calcula o consumido (apenas de parcelas aprovadas ou todas geradas? Vamos usar todas geradas para mostrar comprometimento)
    const totalConsumido = parcelas.reduce((acc, p) => acc + Number(p.valor), 0);
    const valorReferencia = isConsumo ? (contrato.valorTotal || contrato.valorPrevisto || 0) : (contrato.valorTotal || contrato.valorPrevisto || 0);
    
    // Se for consumo (infinito), o "progress bar" mostra a media ou do mes, mas como temos as parcelas, faremos um fallback visual
    const percent = isConsumo ? 0 : Math.min(100, Math.round((totalConsumido / (valorReferencia || 1)) * 100));
    
    const fornecedorNome = fornecedores.find(f => f.id === contrato.fornecedorId || f.id === contrato.recebedorFornecedor)?.nome || contrato.recebedorFornecedor;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-50 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] overflow-hidden">
                <div className="bg-white p-5 border-b border-zinc-200 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                contrato.status === 'Finalizado' ? 'bg-zinc-100 text-zinc-600' :
                                contrato.status === 'Cancelado' ? 'bg-rose-100 text-rose-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                                {contrato.status || 'Ativo'}
                            </span>
                            <span className="text-xs text-zinc-500 font-medium bg-zinc-100 px-2 py-0.5 rounded">{contrato.tipoLancamento || "Outros"}</span>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900">{contrato.descricao}</h2>
                        <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1">Fornecedor: <span className="font-semibold text-zinc-700">{fornecedorNome}</span></p>
                    </div>
                    <button onClick={onClose} className="hover:bg-zinc-100 p-2 rounded-full transition-colors text-zinc-400">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {!isConsumo && (
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-700">Consumo do Contrato</h3>
                                    <p className="text-xs text-zinc-500">Valor gerado em parcelas vs Valor Total</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-zinc-900">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalConsumido)}</span>
                                    <span className="text-xs text-zinc-500 ml-1">/ {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorReferencia)}</span>
                                </div>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                                <div className={`h-2.5 rounded-full ${percent > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                            <div className="mt-1 text-xs text-right font-medium text-zinc-500">{percent}% comprometido</div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                            <h3 className="font-semibold text-zinc-800 flex items-center gap-2">
                                <CalendarDays size={18} className="text-indigo-600" />
                                Ocorrências / Parcelas Geradas
                            </h3>
                            <button className="text-xs bg-white border border-zinc-300 hover:bg-zinc-50 px-3 py-1.5 rounded-md font-medium text-zinc-700 transition-colors shadow-sm">
                                Gerar Próxima
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50/50">
                                    <tr className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-200">
                                        <th className="p-3 w-16 text-center">Nº</th>
                                        <th className="p-3 w-32 text-center">Vencimento</th>
                                        <th className="p-3 w-40 text-right">Valor</th>
                                        <th className="p-3 w-32 text-center">Status</th>
                                        <th className="p-3 w-20 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-zinc-400">Carregando parcelas...</td></tr>
                                    ) : parcelas.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-zinc-400">Nenhuma parcela gerada para este contrato.</td></tr>
                                    ) : parcelas.map((p) => (
                                        <ParcelaRow key={p.id} parcela={p} onUpdate={(updated) => setParcelas(prev => prev.map(x => x.id === updated.id ? updated : x))} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParcelaRow({ parcela, onUpdate }: { parcela: ContratoParcela, onUpdate: (p: ContratoParcela) => void }) {
    const isPendente = parcela.statusAprovacao === "Pendente";
    const [isEditing, setIsEditing] = useState(false);
    
    const [editData, setEditData] = useState(parcela.dataVencimento);
    const [editValor, setEditValor] = useState(parcela.valor);

    const handleSave = async () => {
        try {
            const res = await contratoParcelasApi.update({ ...parcela, valor: editValor, dataVencimento: editData });
            onUpdate(res);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar parcela.");
        }
    };

    if (isEditing) {
        return (
            <tr className="bg-indigo-50/30">
                <td className="p-3 text-center text-sm font-semibold text-zinc-700">{parcela.numeroParcela}</td>
                <td className="p-3">
                    <input type="date" value={editData} onChange={e => setEditData(e.target.value)} className="w-full p-1.5 border border-indigo-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white" />
                </td>
                <td className="p-3">
                    <input 
                        type="number" 
                        step="0.01"
                        value={editValor} 
                        onChange={e => setEditValor(Number(e.target.value))} 
                        className="w-full p-1.5 border border-indigo-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-right bg-white font-semibold" 
                    />
                </td>
                <td className="p-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Pendente</span>
                </td>
                <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <button onClick={handleSave} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"><Check size={14}/></button>
                        <button onClick={() => { setIsEditing(false); setEditData(parcela.dataVencimento); setEditValor(parcela.valor); }} className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors"><X size={14}/></button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-zinc-50 transition-colors group">
            <td className="p-3 text-center text-sm font-medium text-zinc-600">{parcela.numeroParcela}</td>
            <td className="p-3 text-center text-sm font-medium text-zinc-800">{safeFormatDate(parcela.dataVencimento)}</td>
            <td className="p-3 text-right text-sm font-semibold text-zinc-900">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parcela.valor)}</td>
            <td className="p-3 text-center">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isPendente ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    parcela.statusAprovacao === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-rose-100 text-rose-700'
                }`}>
                    {parcela.statusAprovacao}
                </span>
            </td>
            <td className="p-3 text-center">
                {isPendente && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors opacity-0 group-hover:opacity-100" title="Editar Valores">
                        <Edit2 size={16} />
                    </button>
                )}
            </td>
        </tr>
    );
}
