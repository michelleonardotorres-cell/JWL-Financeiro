import React, { useState, useRef } from "react";
import { Users, Search, AlertCircle, Plus, Edit, Trash2, X, Save, Info, MoreVertical, Download, Upload, Star, ChevronLeft, Check } from "lucide-react";
import { normalizeString, fetchCep, fetchCnpj } from "../utils";
import { useData } from "../contexts/DataContext";
import { Fornecedor } from "../types";
import * as XLSX from "xlsx";
import ImportErrorsModal, { ImportError } from "./ImportErrorsModal";

export default function Fornecedores() {
  const { fornecedores, addFornecedor, updateFornecedor, deleteFornecedor } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterCidade, setFilterCidade] = useState("Todos");
  const [filterQualificacao, setFilterQualificacao] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState<"Ativo" | "Inativo" | "Todos">("Ativo");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showOptions, setShowOptions] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultFormData: Omit<Fornecedor, "id"> = {
    nome: "",
    nomeFantasia: "",
    tipoPessoa: "Pessoa Jurídica",
    isCliente: false,
    ativo: true,
    cnpj: "",
    cpf: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    telefone1: "",
    telefone2: "",
    email: "",
    qualificacao: 0,
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    estado: "",
    cidade: "",
    comentario: "",
    segmento: "",
    contaBancaria: "",
    contato1Nome: "",
    contato1Email: "",
    contato1Cargo: "",
    contato1Telefone: "",
    contato1Aniversario: "",
    contato2Nome: "",
    contato2Email: "",
    contato2Cargo: "",
    contato2Telefone: "",
    contato2Aniversario: "",
  };

  const [formData, setFormData] = useState<Omit<Fornecedor, "id">>(defaultFormData);

  const term = normalizeString(searchTerm);

  const filtered = fornecedores.filter((f) => {
    const matchesSearch = normalizeString(f.nome).includes(term) || (f.nomeFantasia && normalizeString(f.nomeFantasia).includes(term)) || (f.cnpj && f.cnpj.includes(term));
    const matchesSegmento = filterSegmento === "Todos" || f.segmento === filterSegmento;
    const matchesCidade = filterCidade === "Todos" || f.cidade === filterCidade;
    const matchesQualificacao = filterQualificacao === "Todos" || (f.qualificacao?.toString() === filterQualificacao);
    
    let matchesStatus = true;
    if (filterStatus === "Ativo") matchesStatus = f.ativo !== false;
    if (filterStatus === "Inativo") matchesStatus = f.ativo === false;

    return matchesSearch && matchesSegmento && matchesCidade && matchesQualificacao && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = filtered.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const uniqueSegmentos = Array.from(new Set(fornecedores.map(f => f.segmento).filter(Boolean)));
  const uniqueCidades = Array.from(new Set(fornecedores.map(f => f.cidade).filter(Boolean)));

  const openModal = (f?: Fornecedor, viewMode: boolean = false) => {
    if (f) {
      setEditingId(f.id);
      setFormData({
        ...defaultFormData,
        ...f
      });
    } else {
      setEditingId(null);
      setFormData(defaultFormData);
    }
    setIsViewing(viewMode);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      alert("Razão Social / Nome é obrigatório.");
      return;
    }

    try {
      if (editingId) {
        await updateFornecedor({ ...formData, id: editingId });
      } else {
        await addFornecedor(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar fornecedor.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este fornecedor?")) {
      try {
        await deleteFornecedor(id);
      } catch (err) {
        alert("Erro ao excluir fornecedor.");
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Deseja excluir ${selectedIds.size} fornecedores selecionados?`)) {
      for (const id of selectedIds) {
        await deleteFornecedor(id);
      }
      setSelectedIds(new Set());
      setShowOptions(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(f => f.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleExport = (type: 'all' | 'selected' | 'displayed') => {
    let sourceData = [];
    if (type === 'all') sourceData = fornecedores;
    else if (type === 'selected') sourceData = fornecedores.filter(f => selectedIds.has(f.id));
    else if (type === 'displayed') sourceData = paginatedData;

    if (sourceData.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const dataToExport = sourceData.map(f => ({
      'Nome': f.nomeFantasia || f.nome,
      'Razão Social': f.nome,
      'CPF': f.cpf,
      'CNPJ': f.cnpj,
      'Insc. Estadual': f.inscricaoEstadual,
      'Insc. Municipal': f.inscricaoMunicipal,
      'E-mail': f.email,
      'Status': f.ativo !== false ? 'Ativo' : 'Inativo',
      'Tipo Endereço': '', 
      'Número': f.numero,
      'Complemento': f.complemento,
      'Bairro': f.bairro,
      'CEP': f.cep,
      'Cidade': f.cidade,
      'Estado': f.estado,
      'Telefones': [f.telefone1, f.telefone2].filter(Boolean).join(" / "),
      'Conta Bancária': f.contaBancaria,
      'Segmento': f.segmento,
      'Comentários': f.comentario
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fornecedores");
    XLSX.writeFile(wb, "fornecedores.xlsx");
    setShowOptions(false);
  };

  const processImportData = async (data: any[], startIndex: number = 2) => {
    let imported = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];
      const nome = row['Nome / Razão Social']?.toString().trim();
      const tipo = row['Tipo']?.toString().trim();
      const doc = row['CNPJ/CPF']?.toString().replace(/\D/g, '');

      if (!nome) {
        rowErrors.push("Nome / Razão Social é obrigatório.");
      }
      
      if (tipo !== 'Pessoa Física' && tipo !== 'Pessoa Jurídica') {
        rowErrors.push("Tipo deve ser 'Pessoa Física' ou 'Pessoa Jurídica'.");
      }

      if (doc) {
        if (tipo === 'Pessoa Física' && doc.length !== 11) {
          rowErrors.push(`CPF inválido (tem ${doc.length} digitos, esperado 11).`);
        } else if (tipo === 'Pessoa Jurídica' && doc.length !== 14) {
          rowErrors.push(`CNPJ inválido (tem ${doc.length} digitos, esperado 14).`);
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ rowIndex: startIndex + i, data: row, errors: rowErrors });
      } else {
        await addFornecedor({
          ...defaultFormData,
          nome,
          nomeFantasia: row['Nome Fantasia'] || "",
          tipoPessoa: tipo as "Pessoa Física" | "Pessoa Jurídica",
          cnpj: doc || "",
          segmento: row['Segmento'] || "",
          telefone1: row['Telefone'] || "",
          email: row['E-mail'] || "",
          cidade: row['Cidade'] || "",
          estado: row['Estado'] || "",
          qualificacao: parseInt(row['Qualificação']) || 0,
          ativo: row['Status'] === 'Inativo' ? false : true
        });
        imported++;
      }
    }

    return { imported, errors };
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowOptions(false);
    const btnText = document.title;
    document.title = "Importando... Aguarde!";
    
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          const result = await processImportData(data, 2);
          
          if (result.errors.length > 0) {
            setImportErrors(result.errors);
            if (result.imported > 0) {
              alert(`${result.imported} fornecedores importados com sucesso! ${result.errors.length} apresentaram inconsistências.`);
            }
          } else {
            alert(`${result.imported} fornecedores importados com sucesso!`);
          }
        } catch (error: any) {
          console.error("Erro na importação:", error);
          alert(`Erro ao importar dados: ${error.message}`);
        } finally {
          document.title = btnText;
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      document.title = btnText;
      alert(`Erro ao ler arquivo: ${error.message}`);
    }
  };

  const handleRetryImport = async (correctedData: any[]) => {
    const result = await processImportData(correctedData, 2);
    
    if (result.errors.length > 0) {
      setImportErrors(result.errors);
      alert(`${result.imported} fornecedores corrigidos foram importados. ${result.errors.length} ainda apresentam erros.`);
    } else {
      setImportErrors([]);
      alert(`${result.imported} fornecedores corrigidos importados com sucesso!`);
    }
  };

  const renderStars = (rating: number = 0, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={interactive ? 20 : 14} 
            className={`${star <= rating ? "text-orange-400 fill-orange-400" : "text-zinc-300"} ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 overflow-auto bg-zinc-50 relative text-sm">
      <div className="max-w-full mx-auto space-y-4">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-700 flex items-center gap-2">
            Fornecedores / Recebedores
          </h1>
        </div>

        {/* Barra de Ferramentas */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded border border-zinc-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Digite aqui sua busca..."
                className="w-full pl-9 pr-3 py-1.5 border border-zinc-300 rounded focus:ring-1 focus:ring-[#2f88cc] focus:border-[#2f88cc]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-zinc-600 font-medium text-xs">Segmento:</label>
              <select 
                value={filterSegmento} 
                onChange={e => setFilterSegmento(e.target.value)}
                className="border border-zinc-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2f88cc]"
              >
                <option value="Todos">Todos</option>
                {uniqueSegmentos.map((s, i) => <option key={i} value={s as string}>{s}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-zinc-600 font-medium text-xs">Cidade:</label>
              <select 
                value={filterCidade} 
                onChange={e => setFilterCidade(e.target.value)}
                className="border border-zinc-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2f88cc]"
              >
                <option value="Todos">Todos</option>
                {uniqueCidades.map((c, i) => <option key={i} value={c as string}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-zinc-600 font-medium text-xs">Qualificação:</label>
              <select 
                value={filterQualificacao} 
                onChange={e => setFilterQualificacao(e.target.value)}
                className="border border-zinc-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2f88cc]"
              >
                <option value="Todos">Todos</option>
                {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} Estrela{s>1?'s':''}</option>)}
              </select>
            </div>

            <div className="flex rounded border border-zinc-300 overflow-hidden">
              <button 
                onClick={() => setFilterStatus(filterStatus === "Ativo" ? "Todos" : "Ativo")}
                className={`px-4 py-1.5 text-xs font-medium ${filterStatus === "Ativo" ? "bg-[#3db2e3] text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
              >
                Ativo
              </button>
              <button 
                onClick={() => setFilterStatus(filterStatus === "Inativo" ? "Todos" : "Inativo")}
                className={`px-4 py-1.5 text-xs font-medium ${filterStatus === "Inativo" ? "bg-[#3db2e3] text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
              >
                Inativo
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal()}
              className="px-4 py-1.5 bg-[#4caf50] text-white rounded font-medium hover:bg-[#43a047] flex items-center gap-1 shadow-sm"
            >
              <Plus size={16} />
              Novo
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-1.5 border border-zinc-300 rounded text-zinc-600 hover:bg-zinc-50"
              >
                <MoreVertical size={16} />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-zinc-200 rounded shadow-lg z-10 py-1">
                  <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 font-medium">
                    <Upload size={14} /> Importar Excel
                  </button>
                  <div className="border-t border-zinc-100 my-1"></div>
                  <div className="px-4 py-1 text-xs text-zinc-400 font-semibold uppercase tracking-wider">Exportar</div>
                  <button onClick={() => handleExport('all')} className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700">
                    <Download size={14} /> Todos os fornecedores
                  </button>
                  <button onClick={() => handleExport('displayed')} className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700">
                    <Download size={14} /> Apenas em exibição
                  </button>
                  <button onClick={() => handleExport('selected')} disabled={selectedIds.size === 0} className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Download size={14} /> Apenas selecionados
                  </button>
                  <div className="border-t border-zinc-100 my-1"></div>
                  <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Trash2 size={14} /> Remover selecionados
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600 font-semibold bg-white">
                  <th className="p-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-300" 
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Segmento</th>
                  <th className="p-3">Cidade</th>
                  <th className="p-3">Qualificação</th>
                  <th className="p-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-600">
                {paginatedData.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
                      openModal(f, true);
                    }
                  }}>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-zinc-300"
                        checked={selectedIds.has(f.id)}
                        onChange={() => toggleSelect(f.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-3 uppercase text-zinc-700 font-medium hover:text-[#2f88cc] hover:underline" onClick={(e) => { e.stopPropagation(); openModal(f, true); }}>{f.nome}</td>
                    <td className="p-3">{f.segmento}</td>
                    <td className="p-3">{f.cidade && f.estado ? `${f.cidade} - ${f.estado}` : f.cidade}</td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>{renderStars(f.qualificacao)}</td>
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openModal(f, false)} className="p-1 text-zinc-400 hover:text-[#2f88cc] transition-colors" title="Editar">
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      Nenhum fornecedor encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-xs text-zinc-500">
            <div>
              Mostrando de {filtered.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1} a {Math.min(safeCurrentPage * itemsPerPage, filtered.length)} de {filtered.length} registros
            </div>
            <div className="flex items-center gap-2">
              <span>Exibir</span>
              <select 
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-zinc-300 rounded px-1 py-0.5"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>por página</span>
              
              <div className="flex ml-4 border border-zinc-300 rounded overflow-hidden">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2 py-1 bg-white hover:bg-zinc-100 border-r border-zinc-300 disabled:opacity-50"
                >«</button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 ${safeCurrentPage === i + 1 ? "bg-[#2f88cc] text-white" : "bg-white hover:bg-zinc-100 border-l border-zinc-300 text-zinc-600"}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2 py-1 bg-white hover:bg-zinc-100 border-l border-zinc-300 disabled:opacity-50"
                >»</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Fornecedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#f3f4f6] shadow-xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh] rounded border border-zinc-300">
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#5e6e82] flex items-center gap-2 uppercase tracking-wide">
                {isViewing ? "Ficha de Cadastro" : (editingId ? "Editar Cadastro" : "Novo Cadastro")}
              </h2>
              <div className="flex gap-2">
                {isViewing ? (
                  <>
                    <button onClick={() => { if(editingId && window.confirm("Deseja realmente excluir este fornecedor?")) { deleteFornecedor(editingId); setIsModalOpen(false); } }} className="px-3 py-1.5 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded shadow-sm text-xs font-semibold uppercase transition-colors">
                      <Trash2 size={14} /> Deletar
                    </button>
                    <button onClick={() => setIsViewing(false)} className="px-3 py-1.5 flex items-center gap-2 bg-[#ff9800] hover:bg-[#f57c00] text-white rounded shadow-sm text-xs font-semibold uppercase transition-colors">
                      <Edit size={14} /> Alterar
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 flex items-center gap-2 bg-zinc-500 hover:bg-zinc-600 text-white rounded shadow-sm text-xs font-semibold uppercase transition-colors">
                      <ChevronLeft size={14} /> Retornar
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleSave} className="w-8 h-8 flex items-center justify-center bg-[#4caf50] hover:bg-[#43a047] text-white rounded shadow-sm" title="Salvar">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-zinc-500 hover:bg-zinc-600 text-white rounded shadow-sm" title="Cancelar">
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className={`flex gap-4 text-xs text-[#5e6e82] ${isViewing ? 'pointer-events-none opacity-80 select-none' : ''}`}>
                {/* Coluna Esquerda */}
              <div className="flex-1 space-y-4">
                
                {/* Linha Superior: Tipo, Cliente, Status */}
                <div className="flex gap-8">
                  <div>
                    <label className="block mb-1 font-medium">Tipo: <span className="text-red-500">*</span></label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="tipoPessoa" checked={formData.tipoPessoa === "Pessoa Jurídica"} onChange={() => setFormData({...formData, tipoPessoa: "Pessoa Jurídica"})} />
                        Pessoa Jurídica
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="tipoPessoa" checked={formData.tipoPessoa === "Pessoa Física"} onChange={() => setFormData({...formData, tipoPessoa: "Pessoa Física"})} />
                        Pessoa Física
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Também é cliente?</label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="isCliente" checked={formData.isCliente === true} onChange={() => setFormData({...formData, isCliente: true})} />
                        Sim
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="isCliente" checked={formData.isCliente === false} onChange={() => setFormData({...formData, isCliente: false})} />
                        Não
                      </label>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <label className="block mb-1 font-medium text-right">Status:</label>
                    <div className="flex rounded border border-zinc-300 overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setFormData({...formData, ativo: true})}
                        className={`px-3 py-1 font-medium ${formData.ativo ? "bg-[#3db2e3] text-white" : "bg-white hover:bg-zinc-50"}`}
                      >Ativo</button>
                      <button 
                        onClick={() => setFormData({...formData, ativo: false})}
                        className={`px-3 py-1 font-medium ${!formData.ativo ? "bg-[#3db2e3] text-white" : "bg-white hover:bg-zinc-50"}`}
                      >Inativo</button>
                    </div>
                  </div>
                </div>

                {/* Bloco Identificação */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Nome Fantasia: <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.nomeFantasia} onChange={e => setFormData({...formData, nomeFantasia: e.target.value})} className="w-full p-1.5 border border-[#3db2e3] rounded shadow-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Razão Social:</label>
                    <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">CNPJ:</label>
                    <input type="text" value={formData.cnpj} onChange={async e => {
                      const val = e.target.value;
                      setFormData({...formData, cnpj: val});
                      const clean = val.replace(/\D/g, '');
                      if (clean.length === 14) {
                        const data = await fetchCnpj(clean);
                        if (data) setFormData(prev => ({...prev, ...data, cnpj: val}));
                      }
                    }} placeholder="__.___.___/____-__" className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">Insc. Estadual:</label>
                      <input type="text" value={formData.inscricaoEstadual} onChange={e => setFormData({...formData, inscricaoEstadual: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Insc. Municipal:</label>
                      <input type="text" value={formData.inscricaoMunicipal} onChange={e => setFormData({...formData, inscricaoMunicipal: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Telefone 1:</label>
                    <input type="text" value={formData.telefone1} onChange={e => setFormData({...formData, telefone1: e.target.value})} placeholder="(__) ____-____" className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Telefone 2:</label>
                    <input type="text" value={formData.telefone2} onChange={e => setFormData({...formData, telefone2: e.target.value})} placeholder="(__) ____-____" className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">E-mail:</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Qualificação do Fornecedor:</label>
                    <div className="flex gap-2 items-center bg-white border border-zinc-300 p-1.5 rounded shadow-sm w-max">
                      {renderStars(formData.qualificacao, true, (r) => setFormData({...formData, qualificacao: r}))}
                      <button onClick={() => setFormData({...formData, qualificacao: 0})} className="ml-2 text-zinc-400 hover:text-zinc-600"><RotateCcwIcon size={14}/></button>
                    </div>
                  </div>
                </div>

                {/* Bloco Endereço */}
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <h3 className="font-medium text-lg text-zinc-700 mb-3">Endereço</h3>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3">
                      <label className="block mb-1 font-medium">CEP:</label>
                      <input type="text" value={formData.cep} onChange={async e => {
                        const val = e.target.value;
                        setFormData({...formData, cep: val});
                        const clean = val.replace(/\D/g, '');
                        if (clean.length === 8) {
                          const data = await fetchCep(clean);
                          if (data) setFormData(prev => ({...prev, ...data, cep: val}));
                        }
                      }} placeholder="_____-___" className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div className="col-span-5">
                      <label className="block mb-1 font-medium">Endereço:</label>
                      <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 font-medium">Número:</label>
                      <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 font-medium">Complemento:</label>
                      <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    
                    <div className="col-span-4">
                      <label className="block mb-1 font-medium">Bairro:</label>
                      <input type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div className="col-span-4">
                      <label className="block mb-1 font-medium">Estado:</label>
                      <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3] bg-white">
                        <option value="">Selecione</option>
                        {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <label className="block mb-1 font-medium">Cidade:</label>
                      <input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} placeholder="Digite a cidade" className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                  </div>
                </div>

                {/* Comentário */}
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <label className="block mb-1 font-medium">Comentário:</label>
                  <textarea rows={2} value={formData.comentario} onChange={e => setFormData({...formData, comentario: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded shadow-sm focus:outline-none focus:border-[#3db2e3]"></textarea>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="w-[45%] flex flex-col gap-4">
                
                {/* Informações Complementares */}
                <div className="bg-white p-4 border border-zinc-200 rounded shadow-sm">
                  <h3 className="font-medium text-sm text-zinc-700 mb-3">Informações Complementares</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1 font-medium">Segmento:</label>
                      <input 
                        list="segmento-options"
                        value={formData.segmento} 
                        onChange={e => setFormData({...formData, segmento: e.target.value})} 
                        className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3] text-zinc-600 bg-white"
                        placeholder="Digite ou selecione..."
                      />
                      <datalist id="segmento-options">
                        {uniqueSegmentos.map((s, i) => <option key={i} value={s as string} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Conta Bancária:</label>
                      <div className="flex gap-1">
                        <input type="text" value={formData.contaBancaria} onChange={e => setFormData({...formData, contaBancaria: e.target.value})} className="flex-1 p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                        <button className="px-3 border border-zinc-300 rounded bg-zinc-50 hover:bg-zinc-100"><RotateCcwIcon size={14}/></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contato 1 */}
                <div className="bg-white p-4 border border-zinc-200 rounded shadow-sm">
                  <h3 className="font-medium text-sm text-zinc-700 mb-3">Contato 1</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-medium">Nome:</label>
                      <input type="text" value={formData.contato1Nome} onChange={e => setFormData({...formData, contato1Nome: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">E-mail:</label>
                      <input type="email" value={formData.contato1Email} onChange={e => setFormData({...formData, contato1Email: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Cargo:</label>
                      <input type="text" value={formData.contato1Cargo} onChange={e => setFormData({...formData, contato1Cargo: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block mb-1 font-medium">Telefone:</label>
                        <input type="text" value={formData.contato1Telefone} onChange={e => setFormData({...formData, contato1Telefone: e.target.value})} placeholder="(__) _____" className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1 font-medium">Aniversário:</label>
                        <div className="flex">
                          <input type="text" value={formData.contato1Aniversario} onChange={e => setFormData({...formData, contato1Aniversario: e.target.value})} placeholder="__/__" className="w-full p-1.5 border border-zinc-300 rounded-l focus:outline-none focus:border-[#3db2e3]" />
                          <div className="p-1.5 border-y border-r border-zinc-300 bg-zinc-50 rounded-r flex items-center"><CalendarIcon size={14} className="text-zinc-500" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contato 2 */}
                <div className="bg-white p-4 border border-zinc-200 rounded shadow-sm">
                  <h3 className="font-medium text-sm text-zinc-700 mb-3">Contato 2</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-medium">Nome:</label>
                      <input type="text" value={formData.contato2Nome} onChange={e => setFormData({...formData, contato2Nome: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">E-mail:</label>
                      <input type="email" value={formData.contato2Email} onChange={e => setFormData({...formData, contato2Email: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Cargo:</label>
                      <input type="text" value={formData.contato2Cargo} onChange={e => setFormData({...formData, contato2Cargo: e.target.value})} className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block mb-1 font-medium">Telefone:</label>
                        <input type="text" value={formData.contato2Telefone} onChange={e => setFormData({...formData, contato2Telefone: e.target.value})} placeholder="(__) _____" className="w-full p-1.5 border border-zinc-300 rounded focus:outline-none focus:border-[#3db2e3]" />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1 font-medium">Aniversário:</label>
                        <div className="flex">
                          <input type="text" value={formData.contato2Aniversario} onChange={e => setFormData({...formData, contato2Aniversario: e.target.value})} placeholder="__/__" className="w-full p-1.5 border border-zinc-300 rounded-l focus:outline-none focus:border-[#3db2e3]" />
                          <div className="p-1.5 border-y border-r border-zinc-300 bg-zinc-50 rounded-r flex items-center"><CalendarIcon size={14} className="text-zinc-500" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arquivos */}
                <div className="bg-white p-4 border border-zinc-200 rounded shadow-sm">
                  <h3 className="font-medium text-sm text-zinc-700 mb-3">Arquivos</h3>
                  <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 flex flex-col items-center justify-center text-zinc-400 hover:bg-zinc-50 transition-colors cursor-pointer">
                    <Upload size={20} className="mb-2" />
                    <span className="text-xs">Clique ou arraste aqui</span>
                  </div>
                </div>

              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Erros de Importação */}
      {importErrors.length > 0 && (
        <ImportErrorsModal
          errors={importErrors}
          onRetry={handleRetryImport}
          onClose={() => setImportErrors([])}
        />
      )}
    </div>
  );
}

// Icons placeholders if lucide-react doesn't export them exactly as needed
function RotateCcwIcon(props: any) {
  return <svg xmlns="http://www.000.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
}

function CalendarIcon(props: any) {
  return <svg xmlns="http://www.000.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
}
