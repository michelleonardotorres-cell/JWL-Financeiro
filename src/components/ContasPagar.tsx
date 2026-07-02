import React, { useState, useMemo } from "react";
import { Fornecedor, Lancamento } from "../types";
import { CheckCircle2, Clock, AlertCircle, Plus, Check, X, Eye, MoreHorizontal } from "lucide-react";
import { useData } from "../contexts/DataContext";
import Combobox from "./Combobox";
import { safeFormatDate } from "../utils";

export default function ContasPagar({ onEfetivar }: { onEfetivar?: (data: any) => void }) {
    const { obras, fornecedores, recebedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "Todos" | "Aberto" | "Atrasado" | "Pago"
  >("Todos");
  const [isAdding, setIsAdding] = useState(false);
  const [valorInput, setValorInput] = useState("");
  const [newConta, setNewConta] = useState({
    dataVencimento: new Date().toISOString().split('T')[0],
    descricao: "",
    fornecedorId: "",
    obraId: "",
    valor: 0,
    formaPagamento: "A PRAZO",
    dataCompetencia: "",
    tipoLancamento: "Conta Fixa",
    subtipo: "",
    nf: "",
  });
  
  const [isCompletingConta, setIsCompletingConta] = useState(false);
  
  const [parcelasCount, setParcelasCount] = useState<number>(1);
  const [parcelasDates, setParcelasDates] = useState<string[]>([]);

  // States for Modals
  const [pagandoContaId, setPagandoContaId] = useState<string | null>(null);
  const [dataPagamentoInput, setDataPagamentoInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [valorPagoInput, setValorPagoInput] = useState<string>("");
  const [jurosMultaInput, setJurosMultaInput] = useState<string>("");
  
  const [deletandoContaId, setDeletandoContaId] = useState<string | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const tiposOptions = [
    "RECEITAS", "COMISSÕES SOBRE VENDAS", "IMPOSTOS", "CUSTO VARIÁVEL",
    "CUSTO FIXO", "DESPESAS OPERACIONAIS", "DESPESAS ADMINISTRATIVAS",
    "DESPESAS FINANCEIRAS", "OUTRAS RECEITAS", "OUTRAS DESPESAS", "PARCELA",
    "RETIRADA VB", "ANTECIPAÇÃO DE RECEBÍVEIS", "AMORTIZAÇÃO",
    "PATRIMÔNIO", "EMPRESTIMOS"
  ];

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numericValue = Number(value) / 100;
    setValorInput(formatCurrency(numericValue));
    setNewConta((prev) => ({ ...prev, valor: numericValue }));
  };

  const handleOpenCompletionModal = () => {
    if (!newConta.descricao || !newConta.valor) {
      alert("Por favor, preencha a descrição e o valor.");
      return;
    }
    setNewConta(prev => ({
      ...prev,
      dataCompetencia: prev.dataCompetencia || new Date().toISOString().split('T')[0]
    }));
    setIsCompletingConta(true);
  };

  const handleFinalizeNewConta = async () => {
    if (newConta.formaPagamento !== "À VISTA" && parcelasCount > 1) {
      let totalAssigned = 0;
      const createdItems = [];
      const entryValue = newConta.valor || 0;
      
      for (let i = 0; i < parcelasCount; i++) {
        let parcelaValor = Number((entryValue / parcelasCount).toFixed(2));
        if (i === parcelasCount - 1) {
          parcelaValor = Number((entryValue - totalAssigned).toFixed(2));
        } else {
          totalAssigned += parcelaValor;
        }

        const date = parcelasDates[i] || newConta.dataVencimento;

        const newLancamento: Omit<Lancamento, "id"> = {
          dataCompetencia: newConta.dataCompetencia || undefined,
          dataVencimento: date,
          dataPagamento: undefined,
          formaPagamento: newConta.formaPagamento,
          nf: newConta.nf || "",
          recebedorFornecedor: [...fornecedores, ...recebedores].find(f => f.id === newConta.fornecedorId)?.nome || "",
          descricao: `${newConta.descricao} (${i + 1}/${parcelasCount})`,
          categoria: newConta.tipoLancamento || "Conta Fixa",
          tipoLancamento: newConta.tipoLancamento || "Conta Fixa",
          subtipo: newConta.subtipo || "",
          obraId: newConta.obraId || undefined,
          valor: parcelaValor,
          tipo: "Despesa" as const,
          status: "Aberto" as const,
          fornecedorId: newConta.fornecedorId || undefined,
        };

        try {
          const created = await addLancamento(newLancamento);
          createdItems.push(created);
        } catch(e) {
          alert(`Erro ao salvar parcela ${i + 1}`);
          return;
        }
      }
      setLancamentosBase([...createdItems, ...lancamentosBase]);
      alert("Contas cadastradas com sucesso!");
    } else {
      const newLancamento: Omit<Lancamento, "id"> = {
        dataCompetencia: newConta.dataCompetencia || undefined,
        dataVencimento: newConta.dataVencimento,
        dataPagamento: undefined,
        formaPagamento: newConta.formaPagamento,
        nf: newConta.nf || "",
        recebedorFornecedor: [...fornecedores, ...recebedores].find(f => f.id === newConta.fornecedorId)?.nome || "",
        descricao: newConta.descricao,
        categoria: newConta.tipoLancamento || "Conta Fixa",
        tipoLancamento: newConta.tipoLancamento || "Conta Fixa",
        subtipo: newConta.subtipo || "",
        obraId: newConta.obraId || undefined,
        valor: newConta.valor,
        tipo: "Despesa" as const,
        status: "Aberto" as const,
        fornecedorId: newConta.fornecedorId || undefined,
      };
      try {
        const created = await addLancamento(newLancamento);
        setLancamentosBase([created, ...lancamentosBase]);
        alert("Nova conta cadastrada com sucesso!");
      } catch(e) {
        alert("Erro ao salvar conta");
        return;
      }
    }

    setIsCompletingConta(false);
    setIsAdding(false);
    setNewConta({
      dataVencimento: new Date().toISOString().split('T')[0],
      descricao: "",
      fornecedorId: "",
      obraId: "",
      valor: 0,
      formaPagamento: "A PRAZO",
      dataCompetencia: "",
      tipoLancamento: "Conta Fixa",
      subtipo: "",
      nf: "",
    });
    setValorInput("");
    setParcelasCount(1);
    setParcelasDates([]);
  };

  const handleCancelNewConta = () => {
    setIsAdding(false);
    setNewConta({
      dataVencimento: new Date().toISOString().split('T')[0],
      descricao: "",
      fornecedorId: "",
      obraId: "",
      valor: 0,
      formaPagamento: "A PRAZO",
      dataCompetencia: "",
      tipoLancamento: "Conta Fixa",
      subtipo: "",
      nf: "",
    });
    setValorInput("");
    setParcelasCount(1);
    setParcelasDates([]);
  };

  const handlePagar = async (id: string) => {
    setPagandoContaId(id);
    setDataPagamentoInput(new Date().toISOString().split("T")[0]);
    const item = lancamentosBase.find((l) => l.id === id);
    if (item) {
      setValorPagoInput(formatCurrency(item.valor));
      setJurosMultaInput(formatCurrency(0));
    }
  };

  const handleConfirmarPagamento = async () => {
    if (!pagandoContaId) return;
    const item = lancamentosBase.find((l) => l.id === pagandoContaId);
    if (item) {
      const valorPagoNum = Number(valorPagoInput.replace(/\D/g, "")) / 100;
      const jurosMultaNum = Number(jurosMultaInput.replace(/\D/g, "")) / 100;
      const updated: Lancamento = {
        ...item,
        status: "Pago" as const,
        dataPagamento: dataPagamentoInput,
        valorPago: valorPagoNum,
        jurosMulta: jurosMultaNum,
      };
      try {
        await updateLancamento(updated);
        setLancamentosBase(prev => prev.map(l => l.id === pagandoContaId ? updated : l));
        alert("Conta marcada como paga!");
      } catch(e) {
        alert("Erro ao marcar como pago");
      }
    }
    setPagandoContaId(null);
  };

  const handleDesfazerPagamento = async (id: string) => {
    const item = lancamentosBase.find((l) => l.id === id);
    if (item) {
      const updated: Lancamento = {
        ...item,
        status: "Aberto" as const,
        dataPagamento: undefined,
        valorPago: undefined,
        jurosMulta: undefined,
      };
      try {
        await updateLancamento(updated);
        setLancamentosBase(prev => prev.map(l => l.id === id ? updated : l));
        alert("Pagamento desfeito com sucesso! A conta voltou para o estado em aberto.");
      } catch(e) {
        alert("Erro ao desfazer pagamento");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletandoContaId) return;
    if (confirmDeleteText.toLowerCase() !== "confirmar") {
      alert("Digite 'confirmar' para prosseguir.");
      return;
    }
    try {
      await deleteLancamento(deletandoContaId);
      setLancamentosBase(prev => prev.filter(l => l.id !== deletandoContaId));
      alert("Conta excluída com sucesso!");
    } catch(e) {
      alert("Erro ao excluir conta");
    }
    setDeletandoContaId(null);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [lancamentosBase, setLancamentosBase] = useState(initialLancamentos);

  const previsoes = useMemo(() => {
    return contratos
      .filter((c) => c.ativo)
      .filter((c) => {
        // Only show if a lancamento hasn't been generated for this month
        const thisMonthLancamento = lancamentosBase.find((l) => {
          if (!l.contratoId || l.contratoId !== c.id) return false;
          const compDate = l.dataCompetencia ? new Date(l.dataCompetencia) : new Date(l.dataVencimento);
          return compDate.getMonth() === currentMonth && compDate.getFullYear() === currentYear;
        });
        return !thisMonthLancamento;
      })
      .map((c) => {
        const dataVencimento = new Date(currentYear, currentMonth, c.diaVencimento).toISOString().split('T')[0];
        return {
          id: `prev-${c.id}`,
          isPrevisao: true,
          contratoId: c.id,
          dataCompetencia: dataVencimento, // Defaults to vencimento until effective
          dataVencimento,
          descricao: c.descricao,
          recebedorFornecedor: c.recebedorFornecedor,
          fornecedorId: c.fornecedorId,
          valor: c.valorPrevisto,
          status: "Aberto" as const,
          tipo: "Despesa" as const,
          categoria: c.categoria,
          obraId: c.obraId,
        };
      });
  }, [contratos, lancamentosBase, currentMonth, currentYear]);

  const despesas = [
    ...lancamentosBase.filter((l) => l.tipo === "Despesa"),
    ...previsoes
  ];

  const filtered = despesas
    .filter((l) => {
      if (filterStatus === "Todos") return true;
      return l.status === filterStatus;
    })
    .sort(
      (a, b) =>
        new Date(a.dataVencimento).getTime() -
        new Date(b.dataVencimento).getTime(),
    );

  const totalAberto = despesas
    .filter((l) => l.status === "Aberto")
    .reduce((acc, curr) => acc + curr.valor, 0);
  const totalAtrasado = despesas
    .filter((l) => l.status === "Atrasado" && !(l as any).isPrevisao)
    .reduce((acc, curr) => acc + curr.valor, 0);
  const totalPago = despesas
    .filter((l) => l.status === "Pago" && !(l as any).isPrevisao)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const handleEfetivar = (prev: any) => {
    if (onEfetivar) {
      onEfetivar(prev);
    } else {
      alert("Redirecionando para Lançamentos...");
    }
  };

  return (
    <div className="p-8 w-full h-full flex flex-col space-y-6 overflow-hidden max-w-7xl mx-auto">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Contas a Pagar
          </h1>
          <p className="text-zinc-500 mt-1">
            Gerenciamento de vencimentos e pagamentos.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          Nova Conta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">A Vencer</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {formatCurrency(totalAberto)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertCircle className="text-rose-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Atrasadas</p>
            <p className="text-2xl font-semibold text-rose-600">
              {formatCurrency(totalAtrasado)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Pagas</p>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatCurrency(totalPago)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2 bg-zinc-50/50 shrink-0">
          {["Todos", "Aberto", "Atrasado", "Pago"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === status
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="min-w-[1040px] w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-zinc-50 shadow-[inset_0_-1px_0_rgba(228,228,231,1)]">
              <tr className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="p-4 w-[120px]">Vencimento</th>
                <th className="p-4 w-[120px]">Data Pgto</th>
                <th className="p-4 w-[250px]">Descrição</th>
                <th className="p-4 w-[150px]">Fornecedor</th>
                <th className="p-4 w-[180px]">Centro de Custo</th>
                <th className="p-4 text-right w-[120px]">Valor</th>
                <th className="p-4 text-center w-[110px]">Status</th>
                <th className="p-4 text-center w-[80px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {isAdding && (
                <>
                <tr className="bg-indigo-50/30">
                  <td className="p-2">
                    <input
                      type="date"
                      value={newConta.dataVencimento}
                      onChange={(e) => setNewConta({ ...newConta, dataVencimento: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="p-2"></td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={newConta.descricao}
                      onChange={(e) => setNewConta({ ...newConta, descricao: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <Combobox
                      options={[...fornecedores, ...recebedores].map(f => ({ id: f.id, label: f.nome }))}
                      value={newConta.fornecedorId || ""}
                      onChange={(id) => setNewConta({ ...newConta, fornecedorId: id })}
                      placeholder="Fornecedor"
                    />
                  </td>
                  <td className="p-2">
                    <Combobox
                      options={obras.map(o => ({ id: o.id, label: o.nome }))}
                      value={newConta.obraId || ""}
                      onChange={(id) => setNewConta({ ...newConta, obraId: id })}
                      placeholder="Centro de Custo"
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Aberto
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleOpenCompletionModal} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={handleCancelNewConta} className="p-1.5 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="bg-indigo-50/10">
                  <td colSpan={8} className="p-3 border-t border-indigo-100">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <label className="text-xs font-semibold text-zinc-600">Forma de Pagamento:</label>
                        <select
                          value={newConta.formaPagamento}
                          onChange={(e) => setNewConta({ ...newConta, formaPagamento: e.target.value })}
                          className="w-32 p-1.5 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          {["À VISTA", "CARTÃO", "BOLETO", "A PRAZO"].sort((a, b) => a.localeCompare(b)).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>

                        {newConta.formaPagamento !== "À VISTA" && (
                          <>
                            <label className="text-xs font-semibold text-zinc-600 ml-4">Quantidade de Parcelas:</label>
                            <input
                              type="number"
                              min="1"
                              max="72"
                              value={parcelasCount}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 1;
                                setParcelasCount(count);
                                const baseDate = new Date(newConta.dataVencimento + "T12:00:00");
                                const newDates = [];
                                for(let i = 0; i < count; i++) {
                                   const d = new Date(baseDate);
                                   d.setMonth(d.getMonth() + i);
                                   newDates.push(d.toISOString().split("T")[0]);
                                }
                                setParcelasDates(newDates);
                              }}
                              className="w-20 p-1.5 border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                          </>
                        )}
                      </div>
                      
                      {newConta.formaPagamento !== "À VISTA" && parcelasCount > 1 && (
                        <div className="flex flex-wrap gap-4 mt-2 bg-white p-3 rounded border border-zinc-200">
                          {Array.from({ length: parcelasCount }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-zinc-500">{i + 1}ª Parcela</span>
                              <input
                                type="date"
                                value={parcelasDates[i] || ""}
                                onChange={(e) => {
                                  const newDates = [...parcelasDates];
                                  newDates[i] = e.target.value;
                                  setParcelasDates(newDates);
                                }}
                                className="p-1 border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none w-[110px]"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                </>
              )}
              {filtered.map((l) => {
                const fornecedor = [...fornecedores, ...recebedores].find(
                  (f) => f.id === l.fornecedorId
                );
                const obra = obras.find(
                  (o) => o.id === l.obraId || o.nome === l.obraId
                );
                return (
                  <tr key={l.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-zinc-900 whitespace-nowrap">
                      {safeFormatDate(l.dataVencimento)}
                    </td>
                    <td className="p-4 text-sm font-medium text-zinc-900 whitespace-nowrap">
                      {l.dataPagamento ? safeFormatDate(l.dataPagamento) : "-"}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">{l.descricao}</td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                      {fornecedor?.nome || "-"}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                      {obra?.nome || l.obraId || "-"}
                    </td>
                    <td className="p-4 text-sm font-semibold text-zinc-900 text-right whitespace-nowrap">
                      {formatCurrency(l.valor)}
                    </td>
                    <td className="p-4 text-center select-none cursor-default" title={(l as any).isPrevisao ? "Esta é uma previsão de contrato. Confirme os valores para efetivar e enviar ao Lançamentos." : ""}>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${l.status === "Pago"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.status === "Atrasado"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          } ${(l as any).isPrevisao ? "border border-amber-300 border-dashed" : ""}`}
                      >
                        {l.status} {(l as any).isPrevisao && <span className="ml-1 opacity-70 italic">- Previsão</span>}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === l.id ? null : l.id)}
                          className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-700 transition-colors"
                          title="Opções"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {activeMenuId === l.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-0 mt-1 w-32 bg-white border border-zinc-200 rounded-lg shadow-lg z-30 py-1 text-left">
                              {l.status !== "Pago" ? (
                                (l as any).isPrevisao ? (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleEfetivar(l);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors block text-left font-medium"
                                  >
                                    Efetivar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handlePagar(l.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors block text-left font-medium"
                                  >
                                    Pagar
                                  </button>
                                )
                              ) : (
                                !(l as any).isPrevisao && (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleDesfazerPagamento(l.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors block text-left font-medium"
                                  >
                                    Desfazer
                                  </button>
                                )
                              )}
                              {!(l as any).isPrevisao && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setDeletandoContaId(l.id);
                                    setConfirmDeleteText("");
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors block text-left font-medium"
                                >
                                  Excluir
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              Nenhuma conta encontrada para o filtro selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {pagandoContaId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-6 relative">
            <h3 className="text-xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
              Confirmar Pagamento
            </h3>
            <button
              onClick={() => setPagandoContaId(null)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700">Data do Pagamento</label>
                <input
                  type="date"
                  value={dataPagamentoInput}
                  onChange={(e) => setDataPagamentoInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-zinc-700">Valor Pago</label>
                <input
                  type="text"
                  value={valorPagoInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setValorPagoInput(formatCurrency(Number(value) / 100));
                  }}
                  className="w-full mt-1 p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700">Juros / Multa</label>
                <input
                  type="text"
                  value={jurosMultaInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setJurosMultaInput(formatCurrency(Number(value) / 100));
                  }}
                  className="w-full mt-1 p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={handleConfirmarPagamento}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setPagandoContaId(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletandoContaId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6 relative">
            <h3 className="text-xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
              Confirmar Exclusão
            </h3>
            <button
              onClick={() => setDeletandoContaId(null)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Tem certeza que deseja apagar esta conta?
              </p>
              <p className="text-sm text-rose-600 font-semibold bg-rose-50 p-3 rounded-lg border border-rose-100 mb-4">
                Esta ação é irreversível. Para prosseguir, digite a palavra <strong>confirmar</strong> no campo abaixo:
              </p>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder='Digite "confirmar"'
                className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none font-medium"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Deletar
              </button>
              <button
                onClick={() => setDeletandoContaId(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completar Conta Modal */}
      {isCompletingConta && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-6 relative">
            <h3 className="text-xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
              Completar Dados
            </h3>
            <button
              onClick={() => setIsCompletingConta(false)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700">Data de Competência</label>
                <input
                  type="date"
                  value={newConta.dataCompetencia}
                  onChange={(e) => setNewConta({ ...newConta, dataCompetencia: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700">Nota Fiscal (NF)</label>
                <input
                  type="text"
                  value={newConta.nf}
                  onChange={(e) => setNewConta({ ...newConta, nf: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: 123456"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700">Tipo de Lançamento</label>
                <select
                  value={newConta.tipoLancamento}
                  onChange={(e) => setNewConta({ ...newConta, tipoLancamento: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="" disabled>Selecione o Tipo</option>
                  {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700">Subtipo</label>
                <input
                  type="text"
                  value={newConta.subtipo}
                  onChange={(e) => setNewConta({ ...newConta, subtipo: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={handleFinalizeNewConta}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Salvar Conta
              </button>
              <button
                onClick={() => setIsCompletingConta(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
