import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2, Search } from "lucide-react";
import { OrcamentoItem } from "../../types";

type OrcamentoDetalhadoViewProps = {
  orcamentoId: string | null;
  obraId: string;
  todosItens: OrcamentoItem[];
  onBack: () => void;
};

export default function OrcamentoDetalhadoView({ orcamentoId, obraId, todosItens, onBack }: OrcamentoDetalhadoViewProps) {
  const [nomeEtapa, setNomeEtapa] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<any[]>([]);
  const [cotacoesMat, setCotacoesMat] = useState<any[]>([]);
  const [cotacoesMo, setCotacoesMo] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (orcamentoId) {
      loadOrcamento();
    }
  }, [orcamentoId]);

  const loadOrcamento = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orcamentos_detalhados?obra_id=${obraId}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const list = await res.json();
      const orc = list.find((o: any) => o.id === orcamentoId);
      if (orc) {
        setNomeEtapa(orc.nome_etapa || "");
        setItensSelecionados(orc.itens ? JSON.parse(orc.itens) : []);
        setCotacoesMat(orc.cotacoes_mat ? JSON.parse(orc.cotacoes_mat) : []);
        setCotacoesMo(orc.cotacoes_mo ? JSON.parse(orc.cotacoes_mo) : []);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar o orçamento detalhado.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nomeEtapa.trim()) {
      alert("Por favor, insira o nome da etapa.");
      return;
    }
    
    try {
      const payload = {
        nome_etapa: nomeEtapa,
        obra_id: obraId,
        itens: itensSelecionados,
        cotacoes_mat: cotacoesMat,
        cotacoes_mo: cotacoesMo,
        total_planilha: totalPlanilha,
        total_real_mat: totalMat,
        total_real_mo: totalMo,
      };

      let res;
      if (orcamentoId) {
        res = await fetch("/api/orcamentos_detalhados", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: orcamentoId })
        });
      } else {
        res = await fetch("/api/orcamentos_detalhados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error("Erro ao salvar");
      alert("Orçamento Detalhado salvo com sucesso!");
      onBack();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o orçamento detalhado.");
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalMat = cotacoesMat.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
  const totalMo = cotacoesMo.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
  
  // Total da planilha usa valorFinal se existir, senão usa (valorUnitMat + valorUnitMo) * quantidade
  const calcularTotalItem = (i: any) => {
    if (i.valorFinal !== undefined) return i.valorFinal;
    return ((i.valorUnitMo || 0) + (i.valorUnitMat || 0)) * (i.quantidade || 0);
  };
  
  const totalPlanilha = itensSelecionados.reduce((sum, i) => sum + calcularTotalItem(i), 0);
  const totalGeralCota = totalMat + totalMo;

  const filteredItems = todosItens.filter(i => 
    !i.hasChildren && 
    (i.codigo?.includes(searchTerm) || i.descricao.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !itensSelecionados.find(sel => sel.id === i.id)
  );

  const handleAddItem = (item: OrcamentoItem) => {
    setItensSelecionados([...itensSelecionados, item]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  if (loading) return <div className="p-8">Carregando...</div>;

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
              <h1 className="text-xl font-bold text-zinc-900">
                {orcamentoId ? "Editar Orçamento Detalhado" : "Novo Orçamento Detalhado"}
              </h1>
              <p className="text-sm text-zinc-500">Etapa de Serviço</p>
            </div>
          </div>
          <div>
            <button 
              onClick={handleSave} 
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} /> Salvar Etapa
            </button>
          </div>
        </div>

        {/* Nome da Etapa */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <label className="block text-sm font-semibold text-zinc-800 mb-2">Nome da Etapa</label>
          <input
            type="text"
            placeholder="Ex: Fundação, Pintura Externa..."
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={nomeEtapa}
            onChange={(e) => setNomeEtapa(e.target.value)}
          />
        </div>

        {/* Seleção e Tabela de Itens da Planilha */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <label className="block text-sm font-semibold text-zinc-800">Itens da Planilha Orçamentária</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar item para puxar (código ou descrição)..."
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            
            {showDropdown && searchTerm && filteredItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-xl z-50">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    className="w-full text-left p-3 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 transition-colors flex justify-between items-center"
                    onClick={() => handleAddItem(item)}
                  >
                    <div>
                      <div className="font-medium text-sm text-zinc-800">{item.codigo} - {item.descricao}</div>
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">
                      + Adicionar
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="p-3 font-semibold text-zinc-600">Item</th>
                  <th className="p-3 font-semibold text-zinc-600 w-full min-w-[200px]">Descrição</th>
                  <th className="p-3 font-semibold text-zinc-600 text-center">Und</th>
                  <th className="p-3 font-semibold text-zinc-600 text-center">Quant.</th>
                  <th className="p-3 font-semibold text-zinc-600 text-right">Valor Total Previsto</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {itensSelecionados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-zinc-500">Nenhum item adicionado.</td>
                  </tr>
                ) : (
                  itensSelecionados.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-3 text-zinc-800">{item.codigo}</td>
                      <td className="p-3 text-zinc-800 truncate max-w-xs">{item.descricao}</td>
                      <td className="p-3 text-zinc-600 text-center">{item.unidade}</td>
                      <td className="p-3 text-zinc-600 text-center">{item.quantidade}</td>
                      <td className="p-3 font-medium text-indigo-600 text-right">{formatCurrency(calcularTotalItem(item))}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setItensSelecionados(itensSelecionados.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-indigo-50/50 border-t border-zinc-200 font-bold">
                <tr>
                  <td colSpan={4} className="p-3 text-right text-indigo-900">Custo Total Previsto (Planilha)</td>
                  <td className="p-3 text-right text-indigo-700">{formatCurrency(totalPlanilha)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Tabelas de Cotação */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Materiais */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-blue-100/50 p-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-blue-900">COTAÇÃO MATERIAIS</h3>
              <button 
                onClick={() => setCotacoesMat([...cotacoesMat, { id: Date.now(), descricao: "", valor: 0 }])}
                className="p-1 bg-white text-blue-600 rounded shadow-sm hover:bg-blue-50"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-3 font-semibold text-zinc-600">Descrição do Material</th>
                    <th className="p-3 font-semibold text-zinc-600 text-right w-32">Valor (R$)</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {cotacoesMat.map((c, i) => (
                    <tr key={c.id}>
                      <td className="p-2">
                        <input type="text" value={c.descricao} onChange={e => {
                          const newArr = [...cotacoesMat]; newArr[i].descricao = e.target.value; setCotacoesMat(newArr);
                        }} className="w-full p-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Ex: Tinta Premium 18L" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={c.valor || ''} onChange={e => {
                          const newArr = [...cotacoesMat]; newArr[i].valor = parseFloat(e.target.value); setCotacoesMat(newArr);
                        }} className="w-full p-2 border border-zinc-300 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none" />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => setCotacoesMat(cotacoesMat.filter(x => x.id !== c.id))} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {cotacoesMat.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-zinc-400">Nenhum material adicionado.</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-zinc-50 border-t border-zinc-200 font-bold">
                  <tr>
                    <td className="p-3 text-right">TOTAL MATERIAIS</td>
                    <td className="p-3 text-right text-blue-700">{formatCurrency(totalMat)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Mão de Obra */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-amber-100/50 p-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-amber-900">COTAÇÃO MÃO DE OBRA</h3>
              <button 
                onClick={() => setCotacoesMo([...cotacoesMo, { id: Date.now(), descricao: "", valor: 0 }])}
                className="p-1 bg-white text-amber-600 rounded shadow-sm hover:bg-amber-50"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-3 font-semibold text-zinc-600">Descrição / Serviço</th>
                    <th className="p-3 font-semibold text-zinc-600 text-right w-32">Valor (R$)</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {cotacoesMo.map((c, i) => (
                    <tr key={c.id}>
                      <td className="p-2">
                        <input type="text" value={c.descricao} onChange={e => {
                          const newArr = [...cotacoesMo]; newArr[i].descricao = e.target.value; setCotacoesMo(newArr);
                        }} className="w-full p-2 border border-zinc-300 rounded focus:ring-1 focus:ring-amber-500 outline-none" placeholder="Ex: Empreitada Pintura" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={c.valor || ''} onChange={e => {
                          const newArr = [...cotacoesMo]; newArr[i].valor = parseFloat(e.target.value); setCotacoesMo(newArr);
                        }} className="w-full p-2 border border-zinc-300 rounded text-right focus:ring-1 focus:ring-amber-500 outline-none" />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => setCotacoesMo(cotacoesMo.filter(x => x.id !== c.id))} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {cotacoesMo.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-zinc-400">Nenhuma mão de obra adicionada.</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-zinc-50 border-t border-zinc-200 font-bold">
                  <tr>
                    <td className="p-3 text-right">TOTAL MÃO DE OBRA</td>
                    <td className="p-3 text-right text-amber-700">{formatCurrency(totalMo)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
        </div>

        {/* Resumo Final */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-zinc-500 font-medium">Custo Total Previsto (Planilha)</p>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(totalPlanilha)}</p>
          </div>
          <div className="hidden md:block h-12 w-px bg-zinc-200"></div>
          <div className="text-right">
            <p className="text-sm text-zinc-500 font-medium">Custo Total Cotações (Mat + MO)</p>
            <p className={`text-2xl font-bold ${totalGeralCota > totalPlanilha ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(totalGeralCota)}
            </p>
          </div>
        </div>
        
        {totalGeralCota > 0 && totalPlanilha > 0 && (
          <div className={`p-4 rounded-xl font-medium flex items-center justify-between ${totalPlanilha - totalGeralCota >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            <span>Resultado da Etapa:</span>
            <span className="font-bold text-lg">
              {totalPlanilha - totalGeralCota >= 0 ? '+' : ''}{formatCurrency(totalPlanilha - totalGeralCota)}
            </span>
          </div>
        )}
        
      </div>
    </div>
  );
}
