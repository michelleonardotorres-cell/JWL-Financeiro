import React, { useState, useMemo, useEffect } from "react";
import { safeFormatDate, normalizeString } from "../utils";
import { Search, Filter, Plus, Save, X, Check, MoreHorizontal, ChevronDown, Upload, Download, UploadCloud, AlertCircle } from "lucide-react";
import { Lancamento } from "../types";
import { useData } from "../contexts/DataContext";
import Combobox from "./Combobox";
import * as XLSX from "xlsx";
import LancamentosImportErrorsModal, { ImportError } from "./LancamentosImportErrorsModal";
import { lancamentosApi } from "../apiClient";

export default function Lancamentos({ setActiveTab, efetivarData, setEfetivarData }: { setActiveTab?: (tab: string) => void, efetivarData?: any, setEfetivarData?: (data: any) => void }) {
    const { obras, fornecedores, recebedores, lancamentos, contratos, addLancamento, updateLancamento, deleteLancamento, addObra, updateObra, deleteObra, addFornecedor, updateFornecedor, deleteFornecedor, addContrato, updateContrato, deleteContrato } = useData();
      const initialLancamentos = lancamentos;
      const initialContratos = contratos;
      const initialObras = obras;
      const initialFornecedores = fornecedores;

  const [data, setData] = useState<Lancamento[]>(initialLancamentos);
  const [isAdding, setIsAdding] = useState(false);
  const [showMainActions, setShowMainActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [validImportEntries, setValidImportEntries] = useState<Omit<Lancamento, "id">[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Parcelas state
  const [parcelasCount, setParcelasCount] = useState<number>(1);
  const [parcelasDates, setParcelasDates] = useState<string[]>([]);

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

  const [debouncedColFilters, setDebouncedColFilters] = useState(colFilters);
  const [serverTotalItems, setServerTotalItems] = useState(0);
  const [pageEntradasSum, setPageEntradasSum] = useState(0);
  const [pageSaidasSum, setPageSaidasSum] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedColFilters(colFilters);
    }, 500);
    return () => clearTimeout(handler);
  }, [colFilters]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedColFilters]);

  const fetchTableData = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        ...debouncedColFilters
      };
      if (activeFilter && activeFilter.start && activeFilter.end) {
        params.startDate = activeFilter.start;
        params.endDate = activeFilter.end;
      }
      
      const res = await lancamentosApi.getPaginated(params);
      setData(res.data);
      setServerTotalItems(res.totalItems);
      
      const entradas = res.data.filter((l: any) => l.tipo === "Receita").reduce((acc: number, curr: any) => acc + curr.valor, 0);
      const saidas = res.data.filter((l: any) => l.tipo === "Despesa").reduce((acc: number, curr: any) => acc + curr.valor, 0);
      setPageEntradasSum(entradas);
      setPageSaidasSum(saidas);
    } catch (err) {
      console.error("Failed to fetch paginated data:", err);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [currentPage, pageSize, debouncedColFilters, activeFilter]);


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

  const handleSaveEdit = async () => {
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
      fornecedorId: editEntry.fornecedorId,
      recebedorFornecedor: [...fornecedores, ...recebedores].find(f => f.id === editEntry.fornecedorId)?.nome || editEntry.recebedorFornecedor || "",
      descricao: editEntry.descricao || "",
      valor: editEntry.valor || 0,
      tipo: isReceita ? "Receita" : "Despesa",
      categoria: editEntry.tipoLancamento || "Outros",
      tipoLancamento: editEntry.tipoLancamento,
      subtipo: editEntry.subtipo,
      obraId: editEntry.obraId,
      status: isBoletoOuPrazo ? "Aberto" : "Pago",
    };

    try {
      const updated = await updateLancamento(updatedEntry);
      const stateIndex = data.findIndex((item) => item.id === editingLancamento!.id);
      if (stateIndex !== -1) {
        const updatedData = [...data];
        updatedData.splice(stateIndex, 1, updated);
        setData(updatedData);
      }
    } catch (e) {
      alert("Erro ao atualizar lançamento");
      return;
    }

    setEditingLancamento(null);
    alert("Lançamento atualizado com sucesso!");
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteText.toLowerCase() !== "confirmar") {
      alert("Você deve digitar 'confirmar' para prosseguir com a exclusão.");
      return;
    }

    try {
      await deleteLancamento(deletingLancamento!.id);
      setData(data.filter((item) => item.id !== deletingLancamento!.id));
    } catch (e) {
      alert("Erro ao excluir lançamento");
      return;
    }
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
      setParcelasCount(1);
      setParcelasDates([]);

      // Limpa para não disparar em loop
      if (setEfetivarData) setEfetivarData(null);
    }
  }, [efetivarData, setEfetivarData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const totalItems = serverTotalItems;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const sliceStart = (currentPage - 1) * pageSize;
  const sliceEnd = Math.min(totalItems, currentPage * pageSize);

  const pageItems = data;

  const handleAddRow = () => {
    setIsAdding(true);
    setValorInput("");
    setParcelasCount(1);
    setParcelasDates([]);
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

  const handleSave = async () => {
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

    if (newEntry.formaPagamento !== "À VISTA" && parcelasCount > 1) {
      let totalAssigned = 0;
      const createdItems = [];
      const entryValue = newEntry.valor || 0;
      
      for (let i = 0; i < parcelasCount; i++) {
        let parcelaValor = Number((entryValue / parcelasCount).toFixed(2));
        if (i === parcelasCount - 1) {
          parcelaValor = Number((entryValue - totalAssigned).toFixed(2));
        } else {
          totalAssigned += parcelaValor;
        }

        const date = parcelasDates[i] || (newEntry.dataCompetencia || new Date().toISOString().split('T')[0]);

        const pEntry: Omit<Lancamento, "id"> = {
          dataCompetencia: newEntry.dataCompetencia || new Date().toISOString().split('T')[0],
          dataVencimento: date,
          dataPagamento: isBoletoOuPrazo ? undefined : (newEntry.dataPagamento || date),
          formaPagamento: newEntry.formaPagamento,
          nf: newEntry.nf,
          fornecedorId: newEntry.recebedorFornecedor,
          recebedorFornecedor: [...fornecedores, ...recebedores].find(f => f.id === newEntry.recebedorFornecedor)?.nome || newEntry.recebedorFornecedor || "",
          descricao: `${newEntry.descricao} (${i + 1}/${parcelasCount})`,
          valor: parcelaValor,
          tipo: isReceita ? "Receita" : "Despesa",
          categoria: newEntry.tipoLancamento || "Outros",
          tipoLancamento: newEntry.tipoLancamento,
          subtipo: newEntry.subtipo,
          obraId: newEntry.obraId,
          status: isBoletoOuPrazo ? "Aberto" : "Pago",
          contratoId: newEntry.contratoId
        };

        try {
          const created = await addLancamento(pEntry);
          createdItems.push(created);
        } catch (e) {
          alert(`Erro ao salvar parcela ${i + 1}`);
          return;
        }
      }
      setData([...createdItems, ...data]);
    } else {
      const entry: Omit<Lancamento, "id"> = {
        dataCompetencia: newEntry.dataCompetencia || new Date().toISOString().split('T')[0],
        dataVencimento: newEntry.dataCompetencia || new Date().toISOString().split('T')[0],
        dataPagamento: isBoletoOuPrazo ? undefined : (newEntry.dataPagamento || newEntry.dataCompetencia),
        formaPagamento: newEntry.formaPagamento,
        nf: newEntry.nf,
        fornecedorId: newEntry.recebedorFornecedor,
        recebedorFornecedor: [...fornecedores, ...recebedores].find(f => f.id === newEntry.recebedorFornecedor)?.nome || newEntry.recebedorFornecedor || "",
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

      try {
        const created = await addLancamento(entry);
        setData([created, ...data]);
      } catch (e) {
        alert("Erro ao salvar lançamento");
        return;
      }
    }
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

  const handleExport = async () => {
    try {
      const params: any = { ...debouncedColFilters };
      if (activeFilter && activeFilter.start && activeFilter.end) {
        params.startDate = activeFilter.start;
        params.endDate = activeFilter.end;
      }
      
      const exportData = await lancamentosApi.getPaginated(params) as any;
      const recordsToExport = Array.isArray(exportData) ? exportData : exportData.data;

      if (!recordsToExport || recordsToExport.length === 0) {
        alert("Nenhum dado para exportar.");
        return;
      }

      const dataToExport = recordsToExport.map((l: Lancamento) => ({
        'ID': l.id,
        'Data Competência': safeFormatDate(l.dataCompetencia),
        'Data Vencimento': safeFormatDate(l.dataVencimento),
        'Data Pagamento': l.dataPagamento ? safeFormatDate(l.dataPagamento) : "",
        'Forma Pagamento': l.formaPagamento,
        'NF': l.nf,
        'Recebedor/Fornecedor': l.recebedorFornecedor,
        'Descrição': l.descricao,
        'Tipo de Lançamento (Categoria)': l.categoria || l.tipoLancamento,
        'Subtipo': l.subtipo,
        'Centro de Custo': obras.find(o => o.id === l.obraId)?.nome || l.obraId,
        'Valor': l.valor,
        'Tipo': l.tipo,
        'Status': l.status
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
      XLSX.writeFile(wb, "lancamentos_export.xlsx");
      setShowMainActions(false);
    } catch (error) {
      console.error("Erro na exportação", error);
      alert("Erro ao exportar");
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Aba principal de preenchimento
    const templateData = [{
      'Data Competência (AAAA-MM-DD)': '2026-07-01',
      'Data Pagamento (AAAA-MM-DD)': '2026-07-01',
      'Forma Pagamento': 'À VISTA',
      'NF': '12345',
      'Recebedor/Fornecedor': 'Nome do Fornecedor A',
      'Descrição': 'Descrição do Lançamento',
      'Tipo Lançamento': 'DESPESAS OPERACIONAIS',
      'Subtipo': 'Material de Escritório',
      'Centro de Custo': obras[0]?.nome || 'Obra A',
      'Valor (Apenas números e vírgula)': 1500.50,
      'Tipo (Despesa/Receita)': 'Despesa'
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");

    // Aba de Opções Válidas
    const validOptionsData = [];
    const maxLen = Math.max(obras.length, fornecedores.length, recebedores.length, tiposOptions.length);
    for (let i = 0; i < maxLen; i++) {
      validOptionsData.push({
        'Centros de Custo (Obras)': obras[i]?.nome || '',
        'Fornecedores (Despesas)': fornecedores[i]?.nome || '',
        'Recebedores (Receitas)': recebedores[i]?.nome || '',
        'Tipos de Lançamento': tiposOptions[i] || '',
        'Formas de Pagamento': i === 0 ? 'À VISTA' : (i === 1 ? 'CARTÃO' : (i === 2 ? 'BOLETO' : (i === 3 ? 'A PRAZO' : '')))
      });
    }
    const wsOptions = XLSX.utils.json_to_sheet(validOptionsData);
    XLSX.utils.book_append_sheet(wb, wsOptions, "Opções Válidas");

    XLSX.writeFile(wb, "modelo_importacao_lancamentos.xlsx");
  };

  const processImportData = (importData: any[], startIndex: number = 2) => {
    const validEntries: Omit<Lancamento, "id">[] = [];
    const errors: ImportError[] = [];
    const allProviders = [...fornecedores, ...recebedores];

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      const rowErrors: string[] = [];
      
      const dataCompRaw = row['Data Competência (AAAA-MM-DD)'];
      const dataPagRaw = row['Data Pagamento (AAAA-MM-DD)'];
      const formaPagamento = row['Forma Pagamento']?.toString().trim().toUpperCase() || 'À VISTA';
      const descricao = row['Descrição']?.toString().trim();
      const valorRaw = row['Valor (Apenas números e vírgula)'];
      const tipo = row['Tipo (Despesa/Receita)']?.toString().trim() || 'Despesa';
      const centroCustoName = row['Centro de Custo']?.toString().trim();
      const recebedorName = row['Recebedor/Fornecedor']?.toString().trim();
      
      let dataComp = '';
      if (dataCompRaw) {
        if (typeof dataCompRaw === 'number') {
          const d = new Date(Math.round((dataCompRaw - 25569) * 864e5));
          dataComp = d.toISOString().split('T')[0];
        } else {
          dataComp = dataCompRaw.toString().trim();
        }
      }

      let dataPag = '';
      if (dataPagRaw) {
        if (typeof dataPagRaw === 'number') {
          const d = new Date(Math.round((dataPagRaw - 25569) * 864e5));
          dataPag = d.toISOString().split('T')[0];
        } else {
          dataPag = dataPagRaw.toString().trim();
        }
      }

      const valor = parseFloat(valorRaw?.toString().replace(',', '.') || '0');

      if (!dataComp) rowErrors.push("Data Competência é obrigatória.");
      if (formaPagamento !== 'À VISTA' && formaPagamento !== 'CARTÃO') {
        rowErrors.push("Apenas lançamentos 'À VISTA' ou 'CARTÃO' podem ser importados por esta tela.");
      }
      if (!descricao) {
        rowErrors.push("Descrição é obrigatória.");
      } else if (descricao.length > 200) {
        rowErrors.push("Descrição não pode conter mais de 200 caracteres.");
      }
      if (isNaN(valor) || valor <= 0) {
        rowErrors.push("Valor inválido.");
      }
      if (tipo !== 'Despesa' && tipo !== 'Receita') {
        rowErrors.push("Tipo deve ser 'Despesa' ou 'Receita'.");
      }
      
      let obraIdFinal = "";
      if (centroCustoName) {
        const foundObra = obras.find(o => o.nome.toLowerCase() === centroCustoName.toLowerCase() || o.id === centroCustoName);
        if (foundObra) obraIdFinal = foundObra.id;
        else rowErrors.push(`Centro de Custo '${centroCustoName}' não encontrado.`);
      }

      let recebedorIdFinal = "";
      let recebedorNomeFinal = recebedorName || "";
      if (recebedorName) {
        const foundProv = allProviders.find(p => p.nome.toLowerCase() === recebedorName.toLowerCase());
        if (foundProv) {
          recebedorIdFinal = foundProv.id;
          recebedorNomeFinal = foundProv.nome;
        } else {
          rowErrors.push(`Recebedor/Fornecedor '${recebedorName}' não encontrado.`);
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ rowIndex: startIndex + i, data: row, errors: rowErrors });
      } else {
        const entry: Omit<Lancamento, "id"> = {
          dataCompetencia: dataComp,
          dataVencimento: dataComp,
          dataPagamento: dataPag || dataComp,
          formaPagamento: formaPagamento,
          nf: row['NF']?.toString() || "",
          fornecedorId: recebedorIdFinal,
          recebedorFornecedor: recebedorNomeFinal,
          descricao: descricao!,
          valor: Number(valor.toFixed(2)),
          tipo: tipo as 'Despesa' | 'Receita',
          categoria: row['Tipo Lançamento']?.toString() || "Outros",
          tipoLancamento: row['Tipo Lançamento']?.toString() || "Outros",
          subtipo: row['Subtipo']?.toString() || "",
          obraId: obraIdFinal,
          status: "Pago",
        };
        validEntries.push(entry);
      }
    }

    return { validEntries, errors };
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const btnText = document.title;
    document.title = "Validando... Aguarde!";
    
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const importData = XLSX.utils.sheet_to_json(ws);
          
          if (importData.length > 2000) {
            alert("A planilha não poderá conter mais de 2000 registros.");
            return;
          }

          const result = processImportData(importData, 2);
          
          if (result.errors.length > 0 || result.validEntries.length > 0) {
            setImportErrors(result.errors);
            setValidImportEntries(result.validEntries);
            setShowValidationModal(true);
            setShowImportModal(false);
          } else {
            alert("Nenhum dado encontrado para importação.");
            setShowImportModal(false);
          }
        } catch (error: any) {
          console.error("Erro na importação:", error);
          alert(`Erro ao importar dados: ${error.message}`);
        } finally {
          document.title = btnText;
          if (fileInputRef.current) fileInputRef.current.value = '';
          setIsImporting(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      document.title = btnText;
      alert(`Erro ao ler arquivo: ${error.message}`);
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async (correctedData: any[], importValidOnly?: boolean) => {
    setIsImporting(true);
    let finalValidEntries = [...validImportEntries];
    
    if (!importValidOnly && correctedData.length > 0) {
      const result = processImportData(correctedData, 2); // Start index might be wrong here for display, but that's ok
      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        setValidImportEntries(finalValidEntries.concat(result.validEntries));
        setIsImporting(false);
        return; // Stop and show errors again
      }
      finalValidEntries = finalValidEntries.concat(result.validEntries);
    }

    try {
      let successCount = 0;
      for (const entry of finalValidEntries) {
        await addLancamento(entry);
        successCount++;
      }
      alert(`${successCount} lançamentos importados com sucesso!`);
    } catch (error: any) {
      alert(`Erro ao salvar lançamentos: ${error.message}`);
    } finally {
      setShowValidationModal(false);
      setImportErrors([]);
      setValidImportEntries([]);
      setIsImporting(false);
    }
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
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight truncate">
            Lançamentos
          </h1>
          <p className="text-zinc-500 mt-1 truncate">
            Registro de todas as receitas e despesas.
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <div className="flex w-full sm:w-auto rounded-lg overflow-hidden shadow-sm border border-indigo-700">
            <button
              onClick={handleAddRow}
              disabled={isAdding}
              className="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              Novo Lançamento
            </button>
            <button
              onClick={() => setShowMainActions(!showMainActions)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-2 border-l border-indigo-700/50 flex items-center justify-center transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          {showMainActions && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50">
              <button 
                onClick={() => { setShowMainActions(false); setShowImportModal(true); }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 text-sm font-medium"
              >
                <UploadCloud size={16} />
                Importar Lançamentos
              </button>
              <button 
                onClick={handleExport}
                className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 text-sm font-medium"
              >
                <Download size={16} />
                Exportar Lançamentos
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="bg-white flex flex-col min-h-0 min-w-0 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1">
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-50/50 gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full">
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

        <div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0">
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
                      className="w-full min-w-[90px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
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
                      className="w-full min-w-[90px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
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
                      className="w-full min-w-[60px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
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
                      className="w-full min-w-[120px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
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
                      className="w-full min-w-[150px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
                    />
                  </div>
                </th>
                <th className="p-3 w-[130px] align-top">
                  <div className="flex flex-col gap-1.5">
                    <span>Tipo</span>
                    <select
                      value={colFilters.tipoLancamento}
                      onChange={(e) => setColFilters({ ...colFilters, tipoLancamento: e.target.value })}
                      className="w-full min-w-[110px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case cursor-pointer"
                    >
                      <option value="">Filtrar tipo...</option>
                      {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
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
                      className="w-full min-w-[100px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
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
                      onClick={() => setColFilters({ ...colFilters, obraId: "" })}
                      className="w-full min-w-[120px] px-2 py-1 text-[10px] font-normal border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
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
                      className="w-full min-w-[80px] max-w-[100px] px-2 py-1 text-[10px] font-normal text-right border border-zinc-300 rounded bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent normal-case"
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
                      options={[...fornecedores, ...recebedores].map(f => ({ id: f.id, label: f.nome }))}
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
                    <select
                      value={newEntry.tipoLancamento}
                      onChange={(e) => setNewEntry({ ...newEntry, tipoLancamento: e.target.value })}
                      className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="" disabled>Tipo</option>
                      {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
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
              {isAdding && newEntry.formaPagamento !== "À VISTA" && (
                <tr className="bg-indigo-50/10">
                  <td colSpan={10} className="p-3 border-t border-indigo-100">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <label className="text-xs font-semibold text-zinc-600">Quantidade de Parcelas:</label>
                        <input
                          type="number"
                          min="1"
                          max="72"
                          value={parcelasCount}
                          onChange={(e) => {
                            const count = parseInt(e.target.value) || 1;
                            setParcelasCount(count);
                            const baseDate = new Date((newEntry.dataCompetencia || new Date().toISOString().split('T')[0]) + "T12:00:00");
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
                      </div>
                      {parcelasCount > 1 && (
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
                      {(l.recebedorFornecedor?.startsWith("f_") || l.recebedorFornecedor?.startsWith("r_")) 
                        ? ([...fornecedores, ...recebedores].find(f => f.id === l.recebedorFornecedor)?.nome || l.recebedorFornecedor) 
                        : (l.recebedorFornecedor || fornecedor?.nome || "-")}
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
          {data.length === 0 && (
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
                  options={[...fornecedores, ...recebedores].map(f => ({ id: f.id, label: f.nome }))}
                  value={editEntry.fornecedorId || ""}
                  onChange={(id) => setEditEntry({ ...editEntry, fornecedorId: id })}
                  placeholder="Recebedor"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Tipo de Lançamento</label>
                <select
                  value={editEntry.tipoLancamento || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, tipoLancamento: e.target.value })}
                  className="w-full p-2 bg-white border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="" disabled>Selecione o Tipo</option>
                  {[...tiposOptions].sort((a, b) => a.localeCompare(b)).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
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
      
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-[#2f88cc] p-4 flex items-center justify-between text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UploadCloud size={20} />
                Importação de Dados &gt; Pagamentos
              </h2>
              <button onClick={() => setShowImportModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-zinc-50 flex-1">
              <div className="flex items-center justify-center mb-10 text-xs font-medium text-zinc-400">
                <div className="flex flex-col items-center gap-2 text-[#2f88cc]">
                  <div className="w-10 h-10 rounded-full bg-[#2f88cc] text-white flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <span>Envio da Planilha</span>
                </div>
                <div className="w-16 h-[2px] bg-zinc-200 mx-2 -mt-6"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 text-zinc-400 flex items-center justify-center">
                    2
                  </div>
                  <span>Cadastros de dados</span>
                </div>
                <div className="w-16 h-[2px] bg-zinc-200 mx-2 -mt-6"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 text-zinc-400 flex items-center justify-center">
                    3
                  </div>
                  <span>Análise dos dados</span>
                </div>
                <div className="w-16 h-[2px] bg-zinc-200 mx-2 -mt-6"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 text-zinc-400 flex items-center justify-center">
                    <Check size={18} />
                  </div>
                  <span>Finalização</span>
                </div>
              </div>

              <div className="bg-[#f0f7ff] border border-[#d6e8ff] p-4 rounded-lg mb-8 text-[#2b5a8e] text-sm">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-[#2f88cc]" />
                  Regras importantes para importação
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>A planilha não poderá conter mais de 2000 registros.</li>
                  <li>Apenas lançamentos à vista ou cartão (parcela única) podem ser importados.</li>
                  <li>O campo descrição não poderá conter mais de 200 caracteres.</li>
                  <li>Só é possível executar uma importação por vez. Aguarde a finalização antes de iniciar uma nova.</li>
                  <li>Os valores não podem conter mais de duas casas decimais.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={downloadTemplate}
                  className="bg-white border-2 border-dashed border-zinc-300 hover:border-[#2f88cc] hover:bg-[#f8fbff] rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all text-zinc-600 hover:text-[#2f88cc] group"
                >
                  <Download size={40} className="group-hover:scale-110 transition-transform text-[#2f88cc]" />
                  <span className="font-semibold text-lg">Baixar Planilha Modelo</span>
                </button>
                
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    ref={fileInputRef} 
                    onChange={handleImport}
                    disabled={isImporting}
                  />
                  <div className={`bg-white border-2 border-dashed ${isImporting ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-300 hover:border-emerald-500 hover:bg-emerald-50'} rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all text-zinc-600 ${isImporting ? '' : 'group hover:text-emerald-600'} h-full`}>
                    {isImporting ? (
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2f88cc]"></div>
                    ) : (
                      <UploadCloud size={40} className="group-hover:scale-110 transition-transform text-zinc-400 group-hover:text-emerald-500" />
                    )}
                    <div className="text-center">
                      <span className="font-semibold text-lg block">{isImporting ? "Importando..." : "Selecionar Arquivo"}</span>
                      <span className="text-xs text-zinc-400">Formatos aceitos: .xlsx</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showValidationModal && (
        <LancamentosImportErrorsModal
          validCount={validImportEntries.length}
          errors={importErrors}
          obras={obras}
          fornecedores={fornecedores}
          recebedores={recebedores}
          isImporting={isImporting}
          onConfirm={handleConfirmImport}
          onClose={() => {
            setShowValidationModal(false);
            setImportErrors([]);
            setValidImportEntries([]);
          }}
        />
      )}
    </div>
  );
}

