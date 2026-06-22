import React, { useState } from "react";
import { Users, Search, AlertCircle, Plus, Edit, Trash2, X, Save } from "lucide-react";
import { normalizeString } from "../utils";
import { useData } from "../contexts/DataContext";
import { Fornecedor } from "../types";

export default function Fornecedores() {
  const { fornecedores, lancamentos, addFornecedor, updateFornecedor, deleteFornecedor } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Fornecedor, "id">>({
    nome: "",
    cnpj: "",
    cpf: "",
    endereco: "",
    dadosBancarios: "",
    funcao: ""
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const term = normalizeString(searchTerm);

  const fornecedoresComSaldo = fornecedores.map((f) => {
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
  });

  const filtered = fornecedoresComSaldo.filter(
    (f) =>
      normalizeString(f.nome).includes(term) ||
      (f.cnpj && f.cnpj.includes(term)) ||
      (f.cpf && f.cpf.includes(term))
  );

  const openModal = (f?: Fornecedor) => {
    if (f) {
      setEditingId(f.id);
      setFormData({
        nome: f.nome,
        cnpj: f.cnpj || "",
        cpf: f.cpf || "",
        endereco: f.endereco || "",
        dadosBancarios: f.dadosBancarios || "",
        funcao: f.funcao || ""
      });
    } else {
      setEditingId(null);
      setFormData({ nome: "", cnpj: "", cpf: "", endereco: "", dadosBancarios: "", funcao: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      alert("O nome é obrigatório.");
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

  return (
    <div className="flex-1 p-8 overflow-auto bg-zinc-50 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Users className="text-indigo-600" />
              Gestão de Fornecedores
            </h1>
            <p className="text-zinc-500 mt-1">
              Cadastre e gerencie fornecedores, funcionários e prestadores de serviço
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            Novo Fornecedor
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
              placeholder="Buscar por nome, CPF ou CNPJ..."
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
                  <th className="p-4 font-medium">Nome / Razão Social</th>
                  <th className="p-4 font-medium">Documento (CPF/CNPJ)</th>
                  <th className="p-4 font-medium">Função/Serviço</th>
                  <th className="p-4 font-medium text-right">Aberto (A Vencer)</th>
                  <th className="p-4 font-medium text-right">Atrasado</th>
                  <th className="p-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-zinc-900">{f.nome}</div>
                      {f.endereco && <div className="text-xs text-zinc-500 mt-1">{f.endereco}</div>}
                    </td>
                    <td className="p-4 text-zinc-600">
                      {f.cnpj && <div>CNPJ: {f.cnpj}</div>}
                      {f.cpf && <div>CPF: {f.cpf}</div>}
                    </td>
                    <td className="p-4 text-zinc-600">{f.funcao || "-"}</td>
                    <td className="p-4 text-right text-zinc-600">
                      {formatCurrency(f.totalAberto)}
                    </td>
                    <td className="p-4 text-right">
                      {f.totalAtrasado > 0 ? (
                        <div className="flex items-center justify-end gap-1 text-rose-600 font-medium">
                          <AlertCircle size={14} />
                          {formatCurrency(f.totalAtrasado)}
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => openModal(f)} className="p-1.5 text-zinc-400 hover:text-indigo-600 bg-zinc-100 hover:bg-indigo-50 rounded transition-colors" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50 rounded transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      Nenhum fornecedor encontrado.
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h2 className="text-xl font-bold text-zinc-800">
                {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nome / Razão Social *</label>
                  <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Nome completo" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Função / Serviço</label>
                  <input type="text" value={formData.funcao} onChange={e => setFormData({...formData, funcao: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Pedreiro, Loja Tintas" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">CPF</label>
                  <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">CNPJ</label>
                  <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="00.000.000/0000-00" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Endereço Completo</label>
                  <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Rua, Número, Bairro, Cidade - UF" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Dados Bancários / PIX</label>
                  <textarea rows={3} value={formData.dadosBancarios} onChange={e => setFormData({...formData, dadosBancarios: e.target.value})} className="w-full p-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Banco, Agência, Conta, Chave PIX..." />
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
