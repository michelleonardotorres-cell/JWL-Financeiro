import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search, FileText, Calendar } from "lucide-react";

type OrcamentoDetalhadoResumo = {
  id: string;
  nome_etapa: string;
  total_planilha: number;
  total_real_mat: number | string;
  total_real_mo: number | string;
  numero_controle?: number;
  xata_createdat: string;
};

type ListagemProps = {
  obraId: string;
  onBack: () => void;
  onSelectOrcamento: (orcamentoId: string | null) => void;
};

export default function ListagemOrcamentosDetalhados({ obraId, onBack, onSelectOrcamento }: ListagemProps) {
  const [orcamentos, setOrcamentos] = useState<OrcamentoDetalhadoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrcamentos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orcamentos_detalhados?obra_id=${obraId}`);
      if (!res.ok) throw new Error("Erro ao carregar orçamentos");
      const data = await res.json();
      setOrcamentos(data);
    } catch (err) {
      console.error(err);
      alert("Falha ao carregar a lista de orçamentos detalhados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrcamentos();
  }, [obraId]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filtered = orcamentos.filter(o => o.nome_etapa?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-1 p-8 overflow-auto bg-zinc-50 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-zinc-200 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="text-indigo-600" size={24} />
                Orçamentos Detalhados (Etapas)
              </h1>
              <p className="text-sm text-zinc-500">Controle financeiro detalhado por etapas de serviço.</p>
            </div>
          </div>
          <button 
            onClick={() => onSelectOrcamento(null)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Novo Orçamento Detalhado
          </button>
        </div>

        {/* Busca e Lista */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar etapa por nome..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-600">
                <tr>
                  <th className="px-6 py-3 font-medium w-24"># Controle</th>
                  <th className="px-6 py-3 font-medium">Nome da Etapa</th>
                  <th className="px-6 py-3 font-medium">Data de Criação</th>
                  <th className="px-6 py-3 font-medium text-right">Valor Previsto</th>
                  <th className="px-6 py-3 font-medium text-right">Custo Real</th>
                  <th className="px-6 py-3 font-medium text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500">Carregando orçamentos...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500">
                      Nenhum orçamento detalhado encontrado. Crie um novo para começar.
                    </td>
                  </tr>
                ) : (
                  filtered.map((orc) => (
                    <tr 
                      key={orc.id} 
                      className="hover:bg-zinc-50 cursor-pointer transition-colors"
                      onClick={() => onSelectOrcamento(orc.id)}
                    >
                      <td className="px-6 py-4 font-medium text-zinc-500">{orc.numero_controle ? `Etapa ${String(orc.numero_controle).padStart(2, '0')}` : '-'}</td>
                      <td className="px-6 py-4 font-medium text-zinc-900">{orc.nome_etapa || "Etapa sem nome"}</td>
                      <td className="px-6 py-4 text-zinc-500 flex items-center gap-2">
                        <Calendar size={14} /> 
                        {orc.xata_createdat ? new Date(orc.xata_createdat).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-indigo-600">
                        {formatCurrency(Number(orc.total_planilha))}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        {formatCurrency(Number(orc.total_real_mat || 0) + Number(orc.total_real_mo || 0))}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${Number(orc.total_planilha) - (Number(orc.total_real_mat || 0) + Number(orc.total_real_mo || 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(Number(orc.total_planilha) - (Number(orc.total_real_mat || 0) + Number(orc.total_real_mo || 0)))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
