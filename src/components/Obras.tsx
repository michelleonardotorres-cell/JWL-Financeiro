import React, { useState, useEffect } from "react";
import { Building2, Search, Plus, Edit, Trash2, X, Save, BarChart3, Edit2 } from "lucide-react";
import { normalizeString } from "../utils";
import { useData } from "../contexts/DataContext";
import { Obra, ObraAditivo, ObraMedicao } from "../types";
import ModalRelatorioObra from "./ModalRelatorioObra";
import { obraAditivosApi, obraMedicoesApi } from "../apiClient";
import CurrencyInput from "./CurrencyInput";
import AprovarMedicaoModal from "./AprovarMedicaoModal";

export default function Obras() {
  const { obras, addObra, updateObra, deleteObra, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [relatorioObraId, setRelatorioObraId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Obra, "id">>({
    nome: "",
    cliente: "",
    endereco: "",
    valorContrato: 0,
    aditivo: 0,
    reajusteContrato: 0,
    status: "Em Andamento"
  });

  const formatCurrency = (value: number | undefined) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  const term = normalizeString(searchTerm);

  const filtered = obras.filter(
    (o) =>
      normalizeString(o.nome).includes(term) ||
      (o.cliente && normalizeString(o.cliente).includes(term))
  );

  const openModal = (o?: Obra) => {
    if (o) {
      setEditingId(o.id);
      setFormData({
        nome: o.nome,
        cliente: o.cliente || "",
        endereco: o.endereco || "",
        valorContrato: o.valorContrato || 0,
        aditivo: o.aditivo || 0,
        reajusteContrato: o.reajusteContrato || 0,
        status: o.status
      });
    } else {
      setEditingId(null);
      setFormData({ 
        nome: "", 
        cliente: "", 
        endereco: "", 
        valorContrato: 0, 
        aditivo: 0, 
        reajusteContrato: 0, 
        status: "Planejamento" 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      alert("O nome da obra é obrigatório.");
      return;
    }

    try {
      if (editingId) {
        await updateObra({ ...formData, id: editingId });
      } else {
        await addObra(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar obra.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir esta obra? Todos os lançamentos vinculados poderão ficar sem referência.")) {
      try {
        await deleteObra(id);
      } catch (err) {
        alert("Erro ao excluir obra.");
      }
    }
  };

  return (
    <div className="flex-1 p-8 overflow-auto bg-zinc-50 relative">
      <div className={`w-full mx-auto space-y-6 ${relatorioObraId ? 'print:hidden' : ''}`}>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Building2 className="text-indigo-600" />
              Gestão de Obras
            </h1>
            <p className="text-zinc-500 mt-1">
              Cadastre e gerencie obras, clientes e contratos
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            Nova Obra
          </button>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nome da obra ou cliente..."
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-sm text-zinc-500">
                  <th className="p-4 font-medium">Nome da Obra / Local</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Valor Contrato</th>
                  <th className="p-4 font-medium text-right">Total (com Aditivos)</th>
                  <th className="p-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm">
                {filtered.map((o) => {
                  const valorTotal = (o.valorContrato || 0) + (o.aditivo || 0) + (o.reajusteContrato || 0);
                  return (
                    <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-zinc-900">{o.nome}</div>
                        {o.endereco && <div className="text-xs text-zinc-500 mt-1">{o.endereco}</div>}
                      </td>
                      <td className="p-4 text-zinc-600">
                        {o.cliente || "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            o.status === "Em Andamento"
                              ? "bg-emerald-100 text-emerald-700"
                              : o.status === "Planejamento"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-zinc-600">
                        {formatCurrency(o.valorContrato)}
                      </td>
                      <td className="p-4 text-right font-medium text-zinc-800">
                        {formatCurrency(valorTotal)}
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button onClick={() => setRelatorioObraId(o.id)} className="p-1.5 text-zinc-400 hover:text-emerald-600 bg-zinc-100 hover:bg-emerald-50 rounded transition-colors" title="Ver Relatório">
                          <BarChart3 size={16} />
                        </button>
                        <button onClick={() => openModal(o)} className="p-1.5 text-zinc-400 hover:text-indigo-600 bg-zinc-100 hover:bg-indigo-50 rounded transition-colors" title="Editar / Medições">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(o.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50 rounded transition-colors" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      Nenhuma obra encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-50 rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-zinc-800">
                {editingId ? "Detalhes da Obra" : "Nova Obra"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <form id="obraForm" onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-800 mb-4">Dados da Obra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Nome da Obra *</label>
                    <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Residencial Silva" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="Planejamento">Planejamento</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Cliente</label>
                    <input type="text" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Nome do Cliente" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Endereço da Obra</label>
                    <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Rua, Número, Bairro, Cidade" />
                  </div>

                  <div className="col-span-2 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Valor do Contrato Inicial</label>
                        <CurrencyInput value={formData.valorContrato || 0} onChangeValue={val => setFormData({...formData, valorContrato: val})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="R$ 0,00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Reajuste de Contrato (+)</label>
                        <CurrencyInput value={formData.reajusteContrato || 0} onChangeValue={val => setFormData({...formData, reajusteContrato: val})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="R$ 0,00" />
                      </div>
                      {/* O aditivo é gerenciado pela tabela abaixo */}
                      <div className="flex flex-col justify-end">
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Total de Aditivos</label>
                        <div className="w-full p-2.5 bg-zinc-100 border border-zinc-200 rounded-lg font-medium text-zinc-700">
                          {formatCurrency(formData.aditivo)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {editingId && (
                <>
                  <AditivosSection obraId={editingId} onAditivosChange={() => refreshData()} />
                  <MedicoesSection obraId={editingId} onMedicoesChange={() => refreshData()} />
                </>
              )}

            </div>

            <div className="p-4 border-t border-zinc-200 bg-white flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-zinc-700 hover:bg-zinc-100 font-medium rounded-lg transition-colors">
                Cancelar / Fechar
              </button>
              <button type="submit" form="obraForm" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                <Save size={20} />
                Salvar Obra
              </button>
            </div>
          </div>
        </div>
      )}

      {relatorioObraId && (
        <ModalRelatorioObra 
          obraId={relatorioObraId} 
          onClose={() => setRelatorioObraId(null)} 
        />
      )}
    </div>
  );
}

function AditivosSection({ obraId, onAditivosChange }: { obraId: string, onAditivosChange: () => void }) {
  const [aditivos, setAditivos] = useState<ObraAditivo[]>([]);
  
  const [showAdd, setShowAdd] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newVal, setNewVal] = useState<number>(0);

  useEffect(() => {
    obraAditivosApi.getByObraId(obraId).then(setAditivos).catch(console.error);
  }, [obraId]);

  const handleAdd = async () => {
    try {
      const res = await obraAditivosApi.create({
        obraId,
        descricao: newDesc,
        valor: newVal,
        data: new Date().toISOString().split('T')[0]
      });
      setAditivos(prev => [...prev, res]);
      setShowAdd(false);
      setNewDesc("");
      setNewVal(0);
      onAditivosChange();
    } catch (e) {
      alert("Erro ao salvar aditivo.");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Excluir aditivo?")) return;
    try {
      await obraAditivosApi.delete(id);
      setAditivos(prev => prev.filter(x => x.id !== id));
      onAditivosChange();
    } catch (e) {
      alert("Erro ao excluir aditivo.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-800">Aditivos da Obra</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1">
          <Plus size={16} /> Aditivo
        </button>
      </div>

      {showAdd && (
        <div className="flex items-end gap-3 mb-4 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-600 mb-1">Descrição</label>
            <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full p-2 border border-zinc-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Acréscimo de material" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Valor (pode ser negativo)</label>
            <CurrencyInput allowNegative value={newVal || 0} onChangeValue={setNewVal} className="w-full p-2 border border-zinc-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-emerald-700 transition-colors">
            Salvar
          </button>
        </div>
      )}

      {aditivos.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">Nenhum aditivo registrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 border-b border-zinc-200 uppercase tracking-wider bg-zinc-50">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Descrição</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {aditivos.map(a => (
                <tr key={a.id}>
                  <td className="p-3 text-zinc-600">{a.data ? new Date(a.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                  <td className="p-3 font-medium text-zinc-800">{a.descricao || 'Aditivo'}</td>
                  <td className={`p-3 text-right font-medium ${a.valor < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(a.valor)}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDelete(a.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded transition-colors"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MedicoesSection({ obraId, onMedicoesChange }: { obraId: string, onMedicoesChange: () => void }) {
  const [medicoes, setMedicoes] = useState<ObraMedicao[]>([]);
  const { refreshData } = useData();

  useEffect(() => {
    obraMedicoesApi.getByObraId(obraId).then(setMedicoes).catch(console.error);
  }, [obraId]);

  const handleAdd = async () => {
    try {
      const nextNum = medicoes.length > 0 ? Math.max(...medicoes.map(m => m.numeroMedicao)) + 1 : 1;
      const res = await obraMedicoesApi.create({
        obraId,
        numeroMedicao: nextNum,
        valor: 0,
        valorRetencao: 0,
        dataVencimento: new Date().toISOString().split('T')[0],
        statusAprovacao: "Pendente"
      });
      setMedicoes(prev => [...prev, res]);
    } catch (e) {
      alert("Erro ao criar medição.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-800">Medições Emitidas</h3>
        <button onClick={handleAdd} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1">
          <Plus size={16} /> Emitir Medição
        </button>
      </div>

      {medicoes.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">Nenhuma medição registrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 border-b border-zinc-200 uppercase tracking-wider bg-zinc-50">
              <tr>
                <th className="p-3 w-16 text-center">Nº</th>
                <th className="p-3 w-32 text-center">Vencimento</th>
                <th className="p-3 w-32 text-right">Valor da Receita</th>
                <th className="p-3 w-32 text-right">Retenção (Imposto)</th>
                <th className="p-3 w-32 text-center">Status</th>
                <th className="p-3 w-20 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {medicoes.map(m => (
                <MedicaoRow 
                  key={m.id} 
                  medicao={m} 
                  onUpdate={(updated) => {
                    setMedicoes(prev => prev.map(x => x.id === updated.id ? updated : x));
                    onMedicoesChange();
                  }}
                  onDelete={(id) => {
                    setMedicoes(prev => prev.filter(x => x.id !== id));
                    onMedicoesChange();
                  }}
                  onApprove={() => {
                    refreshData();
                    onMedicoesChange();
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MedicaoRow({ medicao, onUpdate, onDelete, onApprove }: { medicao: ObraMedicao, onUpdate: (m: ObraMedicao) => void, onDelete: (id: string) => void, onApprove: () => void }) {
  const { fornecedores, recebedores } = useData();
  const allFornecedores = [...fornecedores, ...recebedores];
  
  const isPendente = medicao.statusAprovacao === "Pendente";
  const [isEditing, setIsEditing] = useState(false);
  const [showAprovarModal, setShowAprovarModal] = useState(false);

  const [editData, setEditData] = useState(medicao.dataVencimento ? medicao.dataVencimento.split('T')[0] : "");
  const [editValor, setEditValor] = useState<number>(Number(medicao.valor) || 0);
  const [editRetencao, setEditRetencao] = useState<number>(Number(medicao.valorRetencao) || 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleSave = async () => {
    try {
      const res = await obraMedicoesApi.update({ ...medicao, valor: editValor, valorRetencao: editRetencao, dataVencimento: editData });
      onUpdate(res);
      setIsEditing(false);
    } catch (e: any) {
      alert("Erro ao salvar medição. " + (e.response?.data?.error || ""));
    }
  };

  const handleApproveAction = async (dados: any) => {
    try {
      const res = await obraMedicoesApi.approve(medicao.id, dados);
      onUpdate(res);
      onApprove();
      setShowAprovarModal(false);
      alert("Medição aprovada e lançamentos gerados!");
    } catch (e: any) {
      alert("Erro ao aprovar. " + (e.response?.data?.error || ""));
    }
  };

  const handleRevertApproveAction = async () => {
    if (!confirm(`Reverter aprovação? Os lançamentos gerados serão apagados (se não estiverem pagos).`)) return;
    try {
      const res = await obraMedicoesApi.revertApprove(medicao.id);
      onUpdate(res);
      onApprove();
      alert("Aprovação revertida.");
    } catch (e: any) {
      alert("Erro ao reverter. " + (e.response?.data?.error || ""));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir medição?")) return;
    try {
      await obraMedicoesApi.delete(medicao.id);
      onDelete(medicao.id);
    } catch (e: any) {
      alert("Erro ao excluir. " + (e.response?.data?.error || ""));
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-indigo-50/30">
        <td className="p-3 text-center font-medium">{medicao.numeroMedicao}</td>
        <td className="p-3 text-center">
          <input type="date" value={editData} onChange={e => setEditData(e.target.value)} className="w-full p-1.5 text-xs border border-zinc-300 rounded focus:ring-1 focus:ring-indigo-500" />
        </td>
        <td className="p-3 text-right">
          <CurrencyInput value={editValor || 0} onChangeValue={setEditValor} className="w-full text-right p-1.5 text-xs border border-zinc-300 rounded focus:ring-1 focus:ring-indigo-500" placeholder="R$ 0,00" />
        </td>
        <td className="p-3 text-right">
          <CurrencyInput value={editRetencao || 0} onChangeValue={setEditRetencao} className="w-full text-right p-1.5 text-xs border border-zinc-300 rounded focus:ring-1 focus:ring-indigo-500" placeholder="R$ 0,00" />
        </td>
        <td className="p-3 text-center">
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">Editando</span>
        </td>
        <td className="p-3 text-center space-x-2">
          <button onClick={handleSave} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded" title="Salvar"><Save size={16} /></button>
          <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:bg-zinc-100 p-1.5 rounded" title="Cancelar"><X size={16} /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="p-3 text-center font-medium text-zinc-900">{medicao.numeroMedicao}</td>
      <td className="p-3 text-center text-zinc-600">{medicao.dataVencimento ? new Date(medicao.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
      <td className="p-3 text-right font-medium text-emerald-600">{formatCurrency(medicao.valor)}</td>
      <td className="p-3 text-right font-medium text-rose-600">{formatCurrency(medicao.valorRetencao)}</td>
      <td className="p-3 text-center">
        {isPendente ? (
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">Pendente</span>
        ) : (
          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">Aprovado</span>
        )}
      </td>
      <td className="p-3 text-center flex justify-center gap-1">
        {isPendente ? (
          <>
            <button onClick={() => setShowAprovarModal(true)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded text-xs font-semibold" title="Aprovar">Aprovar</button>
            <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded" title="Editar"><Edit2 size={16}/></button>
            <button onClick={handleDelete} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded" title="Excluir"><Trash2 size={16}/></button>
          </>
        ) : (
          <button onClick={handleRevertApproveAction} className="text-amber-600 hover:bg-amber-50 p-1.5 rounded text-xs font-semibold" title="Reverter Aprovação">Reverter</button>
        )}
      </td>
      {showAprovarModal && (
        <AprovarMedicaoModal
          titulo={`Aprovar Medição ${medicao.numeroMedicao}`}
          valorOriginal={medicao.valor}
          valorRetencao={medicao.valorRetencao}
          dataOriginal={medicao.dataVencimento ? medicao.dataVencimento.split('T')[0] : ""}
          fornecedores={allFornecedores}
          onConfirm={handleApproveAction}
          onClose={() => setShowAprovarModal(false)}
        />
      )}
    </tr>
  );
}
