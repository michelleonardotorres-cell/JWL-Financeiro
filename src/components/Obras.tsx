import React, { useState } from "react";
import { Building2, Search, Plus, Edit, Trash2, X, Save } from "lucide-react";
import { normalizeString } from "../utils";
import { useData } from "../contexts/DataContext";
import { Obra } from "../types";

export default function Obras() {
  const { obras, addObra, updateObra, deleteObra } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      <div className="max-w-7xl mx-auto space-y-6">
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
                        <button onClick={() => openModal(o)} className="p-1.5 text-zinc-400 hover:text-indigo-600 bg-zinc-100 hover:bg-indigo-50 rounded transition-colors" title="Editar">
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h2 className="text-xl font-bold text-zinc-800">
                {editingId ? "Editar Obra" : "Nova Obra"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
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

                <div className="col-span-2 border-t border-zinc-200 mt-2 pt-6">
                  <h3 className="text-sm font-semibold text-zinc-800 mb-4">Dados Financeiros do Contrato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Valor do Contrato Inicial</label>
                      <input type="number" step="0.01" min="0" value={formData.valorContrato || ""} onChange={e => setFormData({...formData, valorContrato: Number(e.target.value)})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="R$ 0,00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Aditivos (+)</label>
                      <input type="number" step="0.01" min="0" value={formData.aditivo || ""} onChange={e => setFormData({...formData, aditivo: Number(e.target.value)})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="R$ 0,00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Reajuste de Contrato (+)</label>
                      <input type="number" step="0.01" min="0" value={formData.reajusteContrato || ""} onChange={e => setFormData({...formData, reajusteContrato: Number(e.target.value)})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="R$ 0,00" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-zinc-700 hover:bg-zinc-100 font-medium rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Save size={20} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
