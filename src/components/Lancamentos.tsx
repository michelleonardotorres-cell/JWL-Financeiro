import React, { useState, useMemo } from "react";
import { safeFormatDate, normalizeString } from "../utils";
import { Search, Filter, Plus, Save, X, Check, MoreHorizontal } from "lucide-react";
import { Lancamento } from "../types";
import { useData } from "../contexts/DataContext";
import Combobox from "./Combobox";

export default function Lancamentos({ setActiveTab, efetivarData, setEfetivarData }: { setActiveTab?: (tab: string) => void, efetivarData?: any, setEfetivarData?: (data: any) => void }) {
    const { obras, fornecedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

  const [data, setData] = useState<Lancamento[]>(initialLancamentos);
  const [isAdding, setIsAdding] = useState(false);

  // State for the new lancamento form
  const [newEntry, setNewEntry] = useState<Partial<Lancamento>>({
    dataCompetencia: new Date().toISOString().split('T')[0],
    formaPagamento: "À VISTA",
    nf: "",
    recebedorFornecedor: "",
    descricao: "",
    tipoLancamento: "",
    subtipo: "",
    obraId: "",
    valor: 0,
    tipo: "Despesa",
    status: "Pago",
    dataPagamento: new Date().toISOString().split('T')[0],
    contratoId: undefined
  });

  const [valorInput, setValorInput] = useState("");

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingLancamento, setViewingLancamento] = useState<Lancamento | null>(null);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [deletingLancamento, setDeletingLancamento] = useState<Lancamento | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [editValorInput, setEditValorInput] = useState("");
  const [editEntry, setEditEntry] = useState<Partial<Lancamento>>({});

  // Date period filter states
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const monthNames = useMemo(() => ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"], []);

  const initialFilter = useMemo(() => {
    const defaultMonth = 5; // June (0-indexed)
    const defaultYear = 2026;
    const monthStr = String(defaultMonth + 1).padStart(2, "0");
    const start = `${defaultYear}-${monthStr}-01`;
    const lastDay = new Date(defaultYear, defaultMonth + 1, 0).getDate();
    const end = `${defaultYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    return {
      type: "mes",
      start,
      end,
      label: `${monthNames[defaultMonth]} ${defaultYear}`,
      month: defaultMonth,
      year: defaultYear
    };
  }, [monthNames]);

  const [activeFilter, setActiveFilter] = useState<{
    type: string;
    start: string;
    end: string;
    label: string;
    month?: number;
    year?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
  } | null>(initialFilter);

  const [tempPeriodType, setTempPeriodType] = useState<"personalizado" | "dia" | "semana" | "mes" | "ano">("mes");
  const [tempMonth, setTempMonth] = useState(5); // Default to June (index 5)
  const [tempYear, setTempYear] = useState(2026); // Default to 2026 (as in the image)
  const [tempDate, setTempDate] = useState("2026-06-21");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  // Column search filters state
  const [colFilters, setColFilters] = useState({
    dataCompetencia: "",
    formaPagamento: "",
    nf: "",
    recebedorFornecedor: "",
    descricao: "",
    tipoLancamento: "",
    subtipo: "",
    obraId: "",
    valor: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset current page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, colFilters]);

  const handleNavigatePeriod = (direction: "prev" | "next") => {
    if (!activeFilter) return;

    let newFilter = { ...activeFilter };

    if (activeFilter.type === "mes") {
      let currentMonth = activeFilter.month ?? 5;
      let currentYear = activeFilter.year ?? 2026;

      if (direction === "prev") {
        currentMonth -= 1;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear -= 1;
        }
      } else {
        currentMonth += 1;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear += 1;
        }
      }

      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const start = `${currentYear}-${monthStr}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const end = `${currentYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

      newFilter = {
        ...newFilter,
        start,
        end,
        label: `${monthNames[currentMonth]} ${currentYear}`,
        month: currentMonth,
        year: currentYear
      };

      setTempMonth(currentMonth);
      setTempYear(currentYear);
    } else if (activeFilter.type === "dia") {
      const currentDateStr = activeFilter.date || activeFilter.start;
      const refDate = new Date(currentDateStr + "T00:00:00");
      refDate.setDate(refDate.getDate() + (direction === "prev" ? -1 : 1));
      const formattedDate = refDate.toISOString().split("T")[0];

      newFilter = {
        ...newFilter,
        start: formattedDate,
        end: formattedDate,
        label: safeFormatDate(formattedDate),
        date: formattedDate
      };
      setTempDate(formattedDate);
    } else if (activeFilter.type === "semana") {
      const currentStartStr = activeFilter.startDate || activeFilter.start;
      const refDate = new Date(currentStartStr + "T00:00:00");
      refDate.setDate(refDate.getDate() + (direction === "prev" ? -7 : 7));
      
      const day = refDate.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatYMD = (d: Date) => d.toISOString().split("T")[0];
      const start = formatYMD(monday);
      const end = formatYMD(sunday);

      newFilter = {
        ...newFilter,
        start,
        end,
        label: `Semana de ${safeFormatDate(start)} a ${safeFormatDate(end)}`,
        startDate: start,
        endDate: end
      };
      setTempDate(start);
    } else if (activeFilter.type === "ano") {
      let currentYear = activeFilter.year ?? 2026;
      currentYear += (direction === "prev" ? -1 : 1);

      newFilter = {
        ...newFilter,
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
        label: `Ano ${currentYear}`,
        year: currentYear
      };
      setTempYear(currentYear);
    } else if (activeFilter.type === "personalizado") {
      const startD = new Date(activeFilter.start + "T00:00:00");
      const endD = new Date(activeFilter.end + "T00:00:00");
      const diffTime = Math.abs(endD.getTime() - startD.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const delta = direction === "prev" ? -diffDays : diffDays;
      startD.setDate(startD.getDate() + delta);
      endD.setDate(endD.getDate() + delta);

      const formatYMD = (d: Date) => d.toISOString().split("T")[0];
      const start = formatYMD(startD);
      const end = formatYMD(endD);

      newFilter = {
        ...newFilter,
        start,
        end,
        label: `${safeFormatDate(start)} a ${safeFormatDate(end)}`
      };
      setTempStartDate(start);
      setTempEndDate(end);
    }

    setActiveFilter(newFilter);
  };

  const handleConfirmPeriod = () => {
    let start = "";
    let end = "";
    let label = "";
    let extra: any = {};

    if (tempPeriodType === "mes") {
      label = `${monthNames[tempMonth]} ${tempYear}`;
      const monthStr = String(tempMonth + 1).padStart(2, "0");
      start = `${tempYear}-${monthStr}-01`;
      const lastDay = new Date(tempYear, tempMonth + 1, 0).getDate();
      end = `${tempYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
      extra = { month: tempMonth, year: tempYear };
    } else if (tempPeriodType === "dia") {
      if (!tempDate) {
        alert("Por favor, selecione uma data.");
        return;
      }
      label = safeFormatDate(tempDate);
      start = tempDate;
      end = tempDate;
      extra = { date: tempDate };
    } else if (tempPeriodType === "semana") {
      if (!tempDate) {
        alert("Por favor, selecione uma data.");
        return;
      }
      const refDate = new Date(tempDate + "T00:00:00");
      const day = refDate.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatYMD = (d: Date) => d.toISOString().split("T")[0];
      start = formatYMD(monday);
      end = formatYMD(sunday);
      label = `Semana de ${safeFormatDate(start)} a ${safeFormatDate(end)}`;
      extra = { startDate: start, endDate: end };
    } else if (tempPeriodType === "ano") {
      label = `Ano ${tempYear}`;
      start = `${tempYear}-01-01`;
      end = `${tempYear}-12-31`;
      extra = { year: tempYear };
    } else if (tempPeriodType === "personalizado") {
      if (!tempStartDate || !tempEndDate) {
        alert("Por favor, selecione as datas de início e fim.");
        return;
      }
      if (tempStartDate > tempEndDate) {
        alert("A data de início não pode ser posterior à data de término.");
        return;
      }
      label = `${safeFormatDate(tempStartDate)} a ${safeFormatDate(tempEndDate)}`;
      start = tempStartDate;
      end = tempEndDate;
    }

    setActiveFilter({ type: tempPeriodType, start, end, label, ...extra });
    setShowPeriodModal(false);
  };

  const checkDependency = (l: Lancamento) => {
    if (l.tipo === "Despesa" && l.status === "Pago") {
      alert("Este lançamento possui um pagamento confirmado no menu 'Contas a Pagar'. Para realizar qualquer alteração ou exclusão, você deve identificar este pagamento na tela de Contas a Pagar e desfazer o pagamento correspondente.");
      return true;
    }
    return false;
  };

  const handleStartEdit = (l: Lancamento) => {
    if (checkDependency(l)) return;
    setEditingLancamento(l);
    setEditEntry({ ...l });
    setEditValorInput(formatCurrency(l.valor));
  };

  const handleStartDelete = (l: Lancamento) => {
    if (checkDependency(l)) return;
    setDeletingLancamento(l);
    setConfirmDeleteText("");
  };

  const handleSaveEdit = () => {
    if (!editEntry.descricao || !editEntry.valor) {
      alert("Por favor, preencha a descrição e o valor.");
      return;
    }

    const isReceita =
      editEntry.tipoLancamento === "RECEITAS" ||
      editEntry.tipoLancamento === "ANTECIPAÇÃO DE RECEBÍVEIS" ||
      editEntry.tipoLancamento === "OUTRAS RECEITAS" ||
      editEntry.tipoLancamento === "EMPRESTIMOS";
    const isBoletoOuPrazo = editEntry.formaPagamento === "BOLETO" || editEntry.formaPagamento === "A PRAZO";

    const updatedEntry: Lancamento = {
      ...editingLancamento!,
      dataCompetencia: editEntry.dataCompetencia || new Date().toISOString().split('T')[0],
      dataVencimento: editEntry.dataCompetencia || new Date().toISOString().split('T')[0],
      formaPagamento: editEntry.formaPagamento,
      nf: editEntry.nf,
      recebedorFornecedor: editEntry.recebedorFornecedor,
      descricao: editEntry.descricao || "",
      valor: editEntry.valor || 0,
      tipo: isReceita ? "Receita" : "Despesa",
      categoria: editEntry.tipoLancamento || "Outros",
      tipoLancamento: editEntry.tipoLancamento,
      subtipo: editEntry.subtipo,
      obraId: editEntry.obraId,
      status: isBoletoOuPrazo ? "Aberto" : "Pago",
    };

    const index = initialLancamentos.findIndex((item) => item.id === editingLancamento!.id);
    if (index !== -1) {
      initialLancamentos.splice(index, 1, updatedEntry);
    }
    const stateIndex = data.findIndex((item) => item.id === editingLancamento!.id);
    if (stateIndex !== -1) {
      const updatedData = [...data];
      updatedData.splice(stateIndex, 1, updatedEntry);
      setData(updatedData);
    }

    setEditingLancamento(null);
    alert("Lançamento atualizado com sucesso!");
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteText.toLowerCase() !== "confirmar") {
      alert("Você deve digitar 'confirmar' para prosseguir com a exclusão.");
      return;
    }

    const index = initialLancamentos.findIndex((item) => item.id === deletingLancamento!.id);
    if (index !== -1) {
      initialLancamentos.splice(index, 1);
    }
    setData(data.filter((item) => item.id !== deletingLancamento!.id));
    setDeletingLancamento(null);
    alert("Lançamento excluído com sucesso!");
  };

  const handlePrint = (lancamento: Lancamento) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lançamento - ${lancamento.descricao}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #18181b; }
              h1 { font-size: 24px; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 12px; border-bottom: 1px solid #e4e4e7; text-align: left; }
              th { font-weight: 600; width: 30%; }
              .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            </style>
          </head>
          <body>
            <h1>Detalhamento do Lançamento</h1>
            <table>
              <tr><th>ID</th><td>${lancamento.id}</td></tr>
              <tr><th>Descrição</th><td>${lancamento.descricao}</td></tr>
              <tr><th>Valor</th><td>R$ ${lancamento.valor.toFixed(2)}</td></tr>
              <tr><th>Tipo</th><td>${lancamento.tipo}</td></tr>
              <tr><th>Categoria (Tipo Lançamento)</th><td>${lancamento.categoria || "-"}</td></tr>
              <tr><th>Subtipo</th><td>${lancamento.subtipo || "-"}</td></tr>
              <tr><th>Centro de Custo</th><td>${lancamento.obraId || "-"}</td></tr>
              <tr><th>Data Competência</th><td>${lancamento.dataCompetencia}</td></tr>
              <tr><th>Data Vencimento</th><td>${lancamento.dataVencimento}</td></tr>
              <tr><th>Forma Pagamento</th><td>${lancamento.formaPagamento || "-"}</td></tr>
              <tr><th>Nota Fiscal (NF)</th><td>${lancamento.nf || "-"}</td></tr>
              <tr><th>Recebedor/Fornecedor</th><td>${lancamento.recebedorFornecedor || "-"}</td></tr>
              <tr><th>Status</th><td>${lancamento.status}</td></tr>
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

  React.useEffect(() => {
    if (efetivarData) {
      setIsAdding(true);
      setNewEntry({
        dataCompetencia: efetivarData.dataVencimento || new Date().toISOString().split('T')[0],
        formaPagamento: "À VISTA", // Padrão que obriga a rever
        nf: "",
        recebedorFornecedor: efetivarData.recebedorFornecedor || "",
        descricao: efetivarData.descricao || "",
        tipoLancamento: efetivarData.categoria || "",
        subtipo: "",
        obraId: efetivarData.obraId || "",
        valor: efetivarData.valor || 0,
        tipo: "Despesa",
        status: "Pago",
        dataPagamento: new Date().toISOString().split('T')[0],
        contratoId: efetivarData.contratoId
      });
      setValorInput(new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(efetivarData.valor || 0));

      // Limpa para não disparar em loop
      if (setEfetivarData) setEfetivarData(null);
    }
  }, [efetivarData, setEfetivarData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const filtered = useMemo(() => {
    let result = [...data];

    if (activeFilter) {
      result = result.filter((l) => {
        const dateStr = l.dataCompetencia || l.dataVencimento || "";
        if (!dateStr) return false;
        return dateStr >= activeFilter.start && dateStr <= activeFilter.end;
      });
    }

    // Apply column filters (per-letter accent-insensitive, case-insensitive search)
    if (colFilters.dataCompetencia) {
      const colTerm = normalizeString(colFilters.dataCompetencia);
      result = result.filter((l) => {
        const formatted = normalizeString(safeFormatDate(l.dataCompetencia));
        return formatted.includes(colTerm);
      });
    }
    if (colFilters.formaPagamento) {
      const colTerm = normalizeString(colFilters.formaPagamento);
      result = result.filter((l) => {
        const val = normalizeString(l.formaPagamento || "");
        return val.includes(colTerm);
      });
    }
    if (colFilters.nf) {
      const colTerm = normalizeString(colFilters.nf);
      result = result.filter((l) => {
        const val = normalizeString(l.nf || "");
        return val.includes(colTerm);
      });
    }
    if (colFilters.recebedorFornecedor) {
      const colTerm = normalizeString(colFilters.recebedorFornecedor);
      result = result.filter((l) => {
        const supplierName = fornecedores.find(f => f.id === l.fornecedorId)?.nome || "";
        const val = normalizeString(l.recebedorFornecedor || supplierName);
        return val.includes(colTerm);
      });
    }
    if (colFilters.descricao) {
      const colTerm = normalizeString(colFilters.descricao);
      result = result.filter((l) => {
        const val = normalizeString(l.descricao || "");
        return val.includes(colTerm);
      });
    }
    if (colFilters.tipoLancamento) {
      const colTerm = normalizeString(colFilters.tipoLancamento);
      result = result.filter((l) => {
        const val = normalizeString(l.tipoLancamento || l.categoria || "");
        return val.includes(colTerm);
      });
    }
    if (colFilters.subtipo) {
      const colTerm = normalizeString(colFilters.subtipo);
      result = result.filter((l) => {
        const val = normalizeString(l.subtipo || "");
        return val.includes(colTerm);
      });
    }
    if (colFilters.obraId) {
      const colTerm = normalizeString(colFilters.obraId);
      result = result.filter((l) => {
        const obraName = obras.find(o => o.id === l.obraId || o.nome === l.obraId)?.nome || "";
        const val = normalizeString(l.obraId || obraName);
        return val.includes(colTerm);
      });
    }
    if (colFilters.valor) {
      const colTerm = normalizeString(colFilters.valor);
      result = result.filter((l) => {
        const formattedVal = normalizeString(formatCurrency(l.valor));
        const sign = l.tipo === "Despesa" ? "-" : "+";
        const valStr = normalizeString(`${sign}${l.valor.toFixed(2)} ${formattedVal}`);
        return valStr.includes(colTerm);
      });
    }

    return result.sort((a, b) => {
      const dateA = a.dataCompetencia || "";
      const dateB = b.dataCompetencia || "";
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      const idA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
      const idB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
      return idB - idA;
    });
  }, [data, activeFilter, colFilters]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const sliceStart = (currentPage - 1) * pageSize;
  const sliceEnd = Math.min(totalItems, currentPage * pageSize);

  const pageItems = useMemo(() => {
    return filtered.slice(sliceStart, sliceEnd);
  }, [filtered, sliceStart, sliceEnd]);

  const pageEntradasSum = useMemo(() => {
    return pageItems
      .filter((l) => l.tipo === "Receita")
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [pageItems]);

  const pageSaidasSum = useMemo(() => {
    return pageItems
      .filter((l) => l.tipo === "Despesa")
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [pageItems]);

  const handleAddRow = () => {
    setIsAdding(true);
    setValorInput("");
    setNewEntry({
      dataCompetencia: new Date().toISOString().split('T')[0],
      formaPagamento: "À VISTA",
      nf: "",
      recebedorFornecedor: "",
      descricao: "",
      tipoLancamento: "",
      subtipo: "",
      obraId: "",
      valor: 0,
      tipo: "Despesa",
      status: "Pago",
      dataPagamento: new Date().toISOString().split('T')[0],
      contratoId: undefined
    });
  };

  const handleSave = () => {
    if (!newEntry.descricao || !newEntry.valor) {
      alert("Por favor, preencha a descrição e o valor.");
      return;
    }

    const isReceita =
      newEntry.tipoLancamento === "RECEITAS" ||
      newEntry.tipoLancamento === "ANTECIPAÇÃO DE RECEBÍVEIS" ||
      newEntry.tipoLancamento === "OUTRAS RECEITAS" ||
      newEntry.tipoLancamento === "EMPRESTIMOS";
    const isBoletoOuPrazo = newEntry.formaPagamento === "BOLETO" || newEntry.formaPagamento === "A PRAZO";

    const entry: Lancamento = {
      id: `l${data.length + 1}`,
      dataCompetencia: newEntry.dataCompetencia || new Date().toISOString().split('T')[0],
      dataVencimento: newEntry.dataCompetencia || new Date().toISOString().split('T')[0],
      dataPagamento: isBoletoOuPrazo ? undefined : (newEntry.dataPagamento || newEntry.dataCompetencia),
      formaPagamento: newEntry.formaPagamento,
      nf: newEntry.nf,
      recebedorFornecedor: newEntry.recebedorFornecedor,
      descricao: newEntry.descricao || "",
      valor: newEntry.valor || 0,
      tipo: isReceita ? "Receita" : "Despesa",
      categoria: newEntry.tipoLancamento || "Outros",
      tipoLancamento: newEntry.tipoLancamento,
      subtipo: newEntry.subtipo,
      obraId: newEntry.obraId,
      status: isBoletoOuPrazo ? "Aberto" : "Pago",
      contratoId: newEntry.contratoId
    };

    setData([entry, ...data]);
    initialLancamentos.unshift(entry); // Mutates global mock so ContasPagar receives it
    setIsAdding(false);

    if (isBoletoOuPrazo && !isReceita) {
      if (setActiveTab) {
        setActiveTab("contas-pagar");
        // We use a small timeout to let the state update and the tab to switch before alerting
        setTimeout(() => alert(`Lançamento salvo como ${newEntry.formaPagamento}. Por favor, complete os dados do lançamento em Contas a Pagar.`), 100);
      } else {
        alert(`Lançamento salvo como ${newEntry.formaPagamento}. Acesse Contas a Pagar para mais detalhes.`);
      }
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numericValue = Number(value) / 100;
    setValorInput(formatCurrency(numericValue));
    setNewEntry({ ...newEntry, valor: numericValue });
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
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Lançamentos
          </h1>
          <p className="text-zinc-500 mt-1">
            Registro de todas as receitas e despesas.
          </p>
        </div>
        <button
          onClick={handleAddRow}
          disabled={isAdding}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          Novo Lançamento
        </button>
      </header>

      <div className="bg-white flex flex-col min-h-0 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50 gap-4">
          <div className="flex items-center gap-4">
            {/* Button group [ < ] [ período ] [ > ] */}
            <div className="flex items-stretch rounded-lg border border-zinc-350 bg-white overflow-hidden shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => handleNavigatePeriod("prev")}
                className="px-3 py-2 border-r border-zinc-300 hover:bg-zinc-50 text-zinc-650 transition-colors flex items-center justify-center"
                title="Período anterior"
              >
                <span className="text-sm font-semibold select-none">&lt;</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPeriodModal(true)}
                className="px-4 py-2 hover:bg-zinc-50 text-zinc-750 text-sm font-medium transition-colors min-w-[130px] text-center"
                title="Alterar período de visualização"
              >
                {activeFilter ? activeFilter.label : "Selecionar período"}
              </button>
              <button
                type="button"
                onClick={() => handleNavigatePeriod("next")}
                className="px-3 py-2 border-l border-zinc-300 hover:bg-zinc-50 text-zinc-650 transition-colors flex items-center justify-center"
                title="Próximo período"
              >
                <span className="text-sm font-semibold select-none">&gt;</span>
              </button>
            </div>



            {activeFilter && (
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className="text-xs text-zinc-500 hover:text-zinc-750 px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 transition-colors shadow-sm font-medium"
                title="Limpar filtro de período"
              >
                Limpar período
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="min-w-[1300px] w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-zinc-50 shadow-[inset_0_-1px_0_rgba(228,228,231,1)]">
              <tr className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="p-3 w-[110px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Data Comp.</span>
                    <input
                      type="text"
                      placeholder="Filtrar data..."
                      value={colFilters.dataCompetencia}
                      onChange={(e) => setColFilters({ ...colFilters, dataCompetencia: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 w-[110px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Pagamento</span>
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={colFilters.formaPagamento}
                      onChange={(e) => setColFilters({ ...colFilters, formaPagamento: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 w-[80px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>NF</span>
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={colFilters.nf}
                      onChange={(e) => setColFilters({ ...colFilters, nf: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 w-[140px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Recebedor/Fornecedor</span>
                    <input
                      type="text"
                      placeholder="Filtrar recebedor..."
                      value={colFilters.recebedorFornecedor}
                      onChange={(e) => setColFilters({ ...colFilters, recebedorFornecedor: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 w-[250px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Descrição</span>
                    <input
                      type="text"
                      placeholder="Filtrar descrição..."
                      value={colFilters.descricao}
                      onChange={(e) => setColFilters({ ...colFilters, descricao: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 w-[130px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Tipo</span>
                    <input
                      type="text"
                      list="col-filter-tipo-list"
                      placeholder="Filtrar tipo..."
                      value={colFilters.tipoLancamento}
                      onChange={(e) => setColFilters({ ...colFilters, tipoLancamento: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                    <datalist id="col-filter-tipo-list">
                      {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt} />)}
                    </datalist>
                  </div>
                </th>
                <th className="p-3 w-[120px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Subtipo</span>
                    <input
                      type="text"
                      placeholder="Filtrar subtipo..."
                      value={colFilters.subtipo}
                      onChange={(e) => setColFilters({ ...colFilters, subtipo: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 w-[150px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Centro de Custo</span>
                    <input
                      type="text"
                      list="col-filter-centro-list"
                      placeholder="Filtrar centro..."
                      value={colFilters.obraId}
                      onChange={(e) => setColFilters({ ...colFilters, obraId: e.target.value })}
                      className="w-full px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                    <datalist id="col-filter-centro-list">
                      {[...obras].sort((a, b) => a.nome.localeCompare(b.nome)).map(o => <option key={o.id} value={o.nome} />)}
                    </datalist>
                  </div>
                </th>
                <th className="p-3 w-[130px] text-right align-top">
                  <div className="flex flex-col gap-1.5 items-end">
                    <span>Valor</span>
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={colFilters.valor}
                      onChange={(e) => setColFilters({ ...colFilters, valor: e.target.value })}
                      className="w-full max-w-[100px] px-2 py-1 text-[10px] font-normal text-right border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 text-center w-[80px] align-top">
                  <div className="flex flex-col gap-1.5 items-center">
                    <span>Ações</span>
                    <div className="h-6" /> {/* spacer */}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {isAdding && (
                <tr className="bg-indigo-50/30">
                  <td className="p-2">
                    <input
                      type="date"
                      value={newEntry.dataCompetencia}
                      onChange={(e) => setNewEntry({ ...newEntry, dataCompetencia: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={newEntry.formaPagamento}
                      onChange={(e) => setNewEntry({ ...newEntry, formaPagamento: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      {["À VISTA", "CARTÃO", "BOLETO", "A PRAZO"].sort((a, b) => a.localeCompare(b)).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="NF"
                      value={newEntry.nf}
                      onChange={(e) => setNewEntry({ ...newEntry, nf: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <Combobox
                      options={fornecedores.map(f => ({ id: f.id, label: f.nome }))}
                      value={newEntry.recebedorFornecedor || ""}
                      onChange={(id) => setNewEntry({ ...newEntry, recebedorFornecedor: id })}
                      placeholder="Recebedor"
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
                    <datalist id="tipos-list">
                      {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Subtipo"
                      value={newEntry.subtipo}
                      onChange={(e) => setNewEntry({ ...newEntry, subtipo: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <Combobox
                      options={obras.map(o => ({ id: o.id, label: o.nome }))}
                      value={newEntry.obraId || ""}
                      onChange={(id) => setNewEntry({ ...newEntry, obraId: id })}
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
                  <td className="p-2 text-center relative max-w-[120px]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className={`flex flex-col gap-1 w-full scale-90 origin-top ${(newEntry.formaPagamento === "À VISTA" || newEntry.formaPagamento === "CARTÃO") ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}>
                        <label className="text-[9px] text-zinc-500 font-medium leading-none text-left">Data Pagto</label>
                        <input
                          type="date"
                          value={newEntry.dataPagamento || ""}
                          onChange={(e) => setNewEntry({ ...newEntry, dataPagamento: e.target.value })}
                          className="w-full p-1 bg-white border border-zinc-300 rounded text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                          title="Data do Pagamento"
                          tabIndex={(newEntry.formaPagamento === "À VISTA" || newEntry.formaPagamento === "CARTÃO") ? 0 : -1}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1.5 w-full">
                        <button onClick={handleSave} title="Salvar Lançamento" className="flex-1 p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex justify-center">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setIsAdding(false)} title="Cancelar" className="flex-1 p-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors flex justify-center">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {pageItems.map((l) => {
                const obra = obras.find((o) => o.id === l.obraId || o.nome === l.obraId);
                const fornecedor = fornecedores.find(
                  (f) => f.id === l.fornecedorId,
                );

                return (
                  <tr key={l.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 text-sm text-zinc-600 whitespace-nowrap">
                      {safeFormatDate(l.dataCompetencia)}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 whitespace-nowrap">
                      {l.formaPagamento || "-"}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 whitespace-nowrap">
                      {l.nf || "-"}
                    </td>
                    <td className="p-4 text-sm font-medium text-zinc-900 break-words whitespace-normal">
                      {l.recebedorFornecedor || fornecedor?.nome || "-"}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 text-justify break-words whitespace-normal">
                      {l.descricao}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 text-[10px] font-medium text-zinc-700">
                        {l.tipoLancamento || l.categoria}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                      {l.subtipo || "-"}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 break-words whitespace-normal">
                      {obra?.nome || l.obraId || "-"}
                    </td>
                    <td
                      className={`p-4 text-sm font-semibold text-right whitespace-nowrap ${l.tipo === "Receita" ? "text-emerald-600" : "text-zinc-900"}`}
                    >
                      {l.tipo === "Despesa" ? "-" : "+"}
                      {formatCurrency(l.valor)}
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
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setViewingLancamento(l);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors block text-left"
                              >
                                Exibir
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleStartEdit(l);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors block text-left"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleStartDelete(l);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors block text-left font-medium"
                              >
                                Apagar
                              </button>
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
              Nenhum lançamento encontrado.
            </div>
          )}
        </div>

        {/* Table Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4 flex flex-col gap-3 shrink-0">
          {/* Row 1: Sums of Entradas and Saídas */}
          <div className="flex items-center gap-6 text-sm font-semibold text-zinc-700">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Entradas:</span>
              <span className="text-emerald-600">{formatCurrency(pageEntradasSum)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Saídas:</span>
              <span className="text-rose-600">-{formatCurrency(pageSaidasSum)}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto text-xs text-zinc-500 font-medium">
              <span>Total de lançamentos filtrados: {totalItems}</span>
            </div>
          </div>

          {/* Row 2: Pagination controls */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-150">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <span>Linhas por página</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                {[25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm text-zinc-600 font-medium">
              <span>
                {totalItems === 0 ? 0 : sliceStart + 1}-{sliceEnd} de {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 px-2.5 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 disabled:opacity-40 transition-colors flex items-center justify-center font-bold text-xs select-none"
                  title="Página anterior"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 px-2.5 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 disabled:opacity-40 transition-colors flex items-center justify-center font-bold text-xs select-none"
                  title="Próxima página"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {viewingLancamento && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6 relative">
            <h3 className="text-xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
              Detalhamento do Lançamento
            </h3>
            <button
              onClick={() => setViewingLancamento(null)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-zinc-500 font-medium">Descrição</p>
                <p className="text-zinc-900 font-semibold">{viewingLancamento.descricao}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Valor</p>
                <p className="text-zinc-900 font-semibold">{formatCurrency(viewingLancamento.valor)}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Tipo</p>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${viewingLancamento.tipo === 'Receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-800'}`}>
                  {viewingLancamento.tipo}
                </span>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Status</p>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${viewingLancamento.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : viewingLancamento.status === 'Atrasado' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                  {viewingLancamento.status}
                </span>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Data Competência</p>
                <p className="text-zinc-950">{safeFormatDate(viewingLancamento.dataCompetencia)}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Data Vencimento</p>
                <p className="text-zinc-950">{safeFormatDate(viewingLancamento.dataVencimento)}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Forma Pagamento</p>
                <p className="text-zinc-955">{viewingLancamento.formaPagamento || "-"}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Nota Fiscal (NF)</p>
                <p className="text-zinc-955">{viewingLancamento.nf || "-"}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Fornecedor/Recebedor</p>
                <p className="text-zinc-955">{viewingLancamento.recebedorFornecedor || "-"}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Centro de Custo</p>
                <p className="text-zinc-955">{viewingLancamento.obraId || "-"}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                onClick={() => handlePrint(viewingLancamento)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Imprimir
              </button>
              <button
                onClick={() => setViewingLancamento(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLancamento && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-6 relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
              Editar Lançamento
            </h3>
            <button
              onClick={() => setEditingLancamento(null)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Descrição</label>
                <input
                  type="text"
                  value={editEntry.descricao || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, descricao: e.target.value })}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Valor</label>
                <input
                  type="text"
                  value={editValorInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const numericValue = Number(value) / 100;
                    setEditValorInput(formatCurrency(numericValue));
                    setEditEntry({ ...editEntry, valor: numericValue });
                  }}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Data Competência</label>
                <input
                  type="date"
                  value={editEntry.dataCompetencia || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, dataCompetencia: e.target.value })}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Forma Pagamento</label>
                <select
                  value={editEntry.formaPagamento || "À VISTA"}
                  onChange={(e) => setEditEntry({ ...editEntry, formaPagamento: e.target.value })}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {["À VISTA", "CARTÃO", "BOLETO", "A PRAZO"].sort((a, b) => a.localeCompare(b)).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Nota Fiscal (NF)</label>
                <input
                  type="text"
                  value={editEntry.nf || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, nf: e.target.value })}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Fornecedor/Recebedor</label>
                <Combobox
                  options={fornecedores.map(f => ({ id: f.id, label: f.nome }))}
                  value={editEntry.recebedorFornecedor || ""}
                  onChange={(id) => setEditEntry({ ...editEntry, recebedorFornecedor: id })}
                  placeholder="Recebedor"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Tipo de Lançamento</label>
                <input
                  type="text"
                  list="tipos-list-edit"
                  value={editEntry.tipoLancamento || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, tipoLancamento: e.target.value })}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <datalist id="tipos-list-edit">
                  {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Subtipo</label>
                <input
                  type="text"
                  value={editEntry.subtipo || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, subtipo: e.target.value })}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Centro de Custo</label>
                <Combobox
                  options={obras.map(o => ({ id: o.id, label: o.nome }))}
                  value={editEntry.obraId || ""}
                  onChange={(id) => setEditEntry({ ...editEntry, obraId: id })}
                  placeholder="Centro de Custo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => setEditingLancamento(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLancamento && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6 relative">
            <h3 className="text-xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
              Confirmar Exclusão
            </h3>
            <button
              onClick={() => setDeletingLancamento(null)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Tem certeza que deseja apagar o lançamento <strong>{deletingLancamento.descricao}</strong> de <strong>{formatCurrency(deletingLancamento.valor)}</strong>?
              </p>
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-lg border border-rose-100">
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
            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Deletar
              </button>
              <button
                onClick={() => setDeletingLancamento(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Period Modal */}
      {showPeriodModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPeriodModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-[480px] w-full p-6 shadow-xl space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-3">
              Alterar período de visualização
            </h3>
            <div className="flex gap-6 min-h-[250px] items-start pt-2">
              {/* Radio Group Left */}
              <div className="w-[42%] flex flex-col gap-5 pr-2">
                {[
                  { value: "personalizado", label: "Personalizado" },
                  { value: "dia", label: "Por dia" },
                  { value: "semana", label: "Por semana" },
                  { value: "mes", label: "Por mês" },
                  { value: "ano", label: "Por ano" },
                ].map((type) => {
                  const isChecked = tempPeriodType === type.value;
                  return (
                    <label key={type.value} className="flex items-center gap-3 cursor-pointer select-none text-zinc-800 text-sm font-normal">
                      <input
                        type="radio"
                        name="periodType"
                        checked={isChecked}
                        onChange={() => setTempPeriodType(type.value as any)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isChecked ? 'border-blue-600' : 'border-zinc-400'}`}>
                        {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <span>{type.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Controls Right */}
              <div className="w-[58%] pl-2">
                {tempPeriodType === "mes" && (
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-400 font-normal">Selecione um mês</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-semibold text-zinc-850 capitalize">
                          {monthNames[tempMonth]} {tempYear}
                        </span>
                        <button onClick={() => setTempYear(y => y - 1)} className="px-1.5 py-0.5 hover:bg-zinc-100 rounded text-zinc-500 font-bold text-xs select-none" title="Ano anterior">&lt;</button>
                        <button onClick={() => setTempYear(y => y + 1)} className="px-1.5 py-0.5 hover:bg-zinc-100 rounded text-zinc-500 font-bold text-xs select-none" title="Próximo ano">&gt;</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-center max-w-[220px]">
                      {["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"].map((m, idx) => {
                        const isSelected = tempMonth === idx;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setTempMonth(idx)}
                            className={`py-1 px-3 text-sm rounded-full transition-all text-center ${
                              isSelected
                                ? "bg-[#008000] text-white font-normal"
                                : "text-zinc-800 hover:bg-zinc-100"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {tempPeriodType === "dia" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-500">Selecione um dia</label>
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}
                {tempPeriodType === "semana" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-500">Selecione um dia da semana</label>
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}
                {tempPeriodType === "ano" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-500">Selecione um ano</label>
                    <div className="flex items-center justify-between border border-zinc-200 rounded-lg p-2 bg-zinc-50">
                      <button onClick={() => setTempYear(y => y - 1)} className="px-3 py-1 hover:bg-zinc-200 rounded text-zinc-700 font-bold transition-colors">&lt;</button>
                      <span className="text-base font-bold text-zinc-800">{tempYear}</span>
                      <button onClick={() => setTempYear(y => y + 1)} className="px-3 py-1 hover:bg-zinc-200 rounded text-zinc-700 font-bold transition-colors">&gt;</button>
                    </div>
                  </div>
                )}
                {tempPeriodType === "personalizado" && (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-zinc-500">Selecione o período personalizado</label>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-medium block">De:</span>
                      <input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-medium block">Até:</span>
                      <input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmPeriod}
                className="w-full py-3 bg-[#008000] hover:bg-[#006600] text-white rounded-lg text-base font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Confirmar período
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

