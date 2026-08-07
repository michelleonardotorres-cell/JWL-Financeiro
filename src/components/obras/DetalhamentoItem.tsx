import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2, Search } from "lucide-react";
import { OrcamentoItem, OrcamentoDetalhamento } from "../../types";

type DetalhamentoItemProps = {
  itemSelecionado: OrcamentoItem | null;
  todosItens: OrcamentoItem[]; // For the search dropdown
  onBack: () => void;
  onSave: (itemId: string, novosValores: { valorUnitMat: number; valorUnitMo: number }) => void;
};

export default function DetalhamentoItem({ itemSelecionado, todosItens, onBack, onSave }: DetalhamentoItemProps) {
  const [item, setItem] = useState<OrcamentoItem | null>(itemSelecionado);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Mocking the data for now since we didn't add Detalhamento API fully, 
  // but we can add the API route easily.
  const [cotacoesMat, setCotacoesMat] = useState<any[]>([]);
  const [cotacoesMo, setCotacoesMo] = useState<any[]>([]);

  // Carregar cotações quando o item mudar (simulação)
  useEffect(() => {
    if (item) {
      // In a real app, we'd fetch: api/detalhamentos?itemId=item.id
      setCotacoesMat([]);
      setCotacoesMo([]);
    }
  }, [item]);

  const filteredItems = todosItens.filter(i => 
    !i.hasChildren && // Only allow detailing leaf items
    (i.codigo?.includes(searchTerm) || i.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalMat = cotacoesMat.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
  const totalMo = cotacoesMo.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
  const totalGeral = totalMat + totalMo;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-50 overflow-auto flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="px-4 py-2 flex items-center gap-2 bg-zinc-100 text-zinc-700 rounded-lg font-medium hover:bg-zinc-200 transition-colors">
            <ArrowLeft size={18} /> Voltar para Orçamento
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Detalhamento e Cotações</h1>
            <p className="text-sm text-zinc-500">Etapa de Serviço</p>
          </div>
        </div>
        <div>
          <button 
            onClick={() => {
              if (item) {
                onSave(item.id, { valorUnitMat: totalMat, valorUnitMo: totalMo });
                alert("Detalhamento salvo! Os valores foram atualizados na planilha principal.");
                onBack();
              } else {
                alert("Selecione um item primeiro.");
              }
            }} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Save size={18} /> Salvar Detalhamento
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Seleção de Item (Autocomplete) */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <label className="block text-sm font-semibold text-zinc-800 mb-2">Vincular a um Item do Orçamento (Pesquisa)</label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Digite o código (ex: 4.1.6.1) ou a descrição..."
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={item ? `${item.codigo} - ${item.descricao}` : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setItem(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {item && (
                <button 
                  onClick={() => { setItem(null); setSearchTerm(""); setShowDropdown(true); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  X
                </button>
              )}
            </div>
            
            {showDropdown && !item && searchTerm && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                {filteredItems.length > 0 ? (
                  filteredItems.map(opt => (
                    <div 
                      key={opt.id} 
                      className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-zinc-100 flex justify-between"
                      onClick={() => {
                        setItem(opt);
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-medium text-indigo-900">{opt.codigo}</span>
                      <span className="text-zinc-700 text-sm flex-1 ml-4 truncate">{opt.descricao}</span>
                      <span className="text-zinc-500 text-sm">{opt.quantidade} {opt.unidade}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-zinc-500 text-sm">Nenhum item encontrado.</div>
                )}
              </div>
            )}
          </div>

          {/* Dados base do item */}
          {item && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <div>
                <p className="text-xs text-indigo-600 font-semibold uppercase">Item</p>
                <p className="font-medium text-zinc-900">{item.codigo}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-xs text-indigo-600 font-semibold uppercase">Descrição</p>
                <p className="font-medium text-zinc-900">{item.descricao}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-semibold uppercase">Unidade</p>
                <p className="font-medium text-zinc-900">{item.unidade}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-semibold uppercase">Quantidade</p>
                <p className="font-medium text-zinc-900">{item.quantidade}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-semibold uppercase">Valor Unitário (Planilha)</p>
                <p className="font-medium text-zinc-900">{formatCurrency((item.valorUnitMo || 0) + (item.valorUnitMat || 0))}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-semibold uppercase">Total Previsto</p>
                <p className="font-medium text-zinc-900">{formatCurrency(((item.valorUnitMo || 0) + (item.valorUnitMat || 0)) * (item.quantidade || 0))}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabelas de Cotação */}
        {item && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
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
                          }} className="w-full p-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500" placeholder="Ex: Tinta Premium 18L" />
                        </td>
                        <td className="p-2">
                          <input type="number" value={c.valor || ''} onChange={e => {
                            const newArr = [...cotacoesMat]; newArr[i].valor = parseFloat(e.target.value); setCotacoesMat(newArr);
                          }} className="w-full p-2 border border-zinc-300 rounded text-right focus:ring-1 focus:ring-blue-500" />
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
                          }} className="w-full p-2 border border-zinc-300 rounded focus:ring-1 focus:ring-amber-500" placeholder="Ex: Empreitada Pintura" />
                        </td>
                        <td className="p-2">
                          <input type="number" value={c.valor || ''} onChange={e => {
                            const newArr = [...cotacoesMo]; newArr[i].valor = parseFloat(e.target.value); setCotacoesMo(newArr);
                          }} className="w-full p-2 border border-zinc-300 rounded text-right focus:ring-1 focus:ring-amber-500" />
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
        )}
        
        {/* Totalizador Detalhamento vs Previsto */}
        {item && (
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">Custo Total Previsto (Planilha)</p>
              <p className="text-xl font-bold text-zinc-800">{formatCurrency(((item.valorUnitMo || 0) + (item.valorUnitMat || 0)) * (item.quantidade || 0))}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-500">Custo Total Cotações</p>
              <p className={`text-2xl font-bold ${totalGeral > (((item.valorUnitMo || 0) + (item.valorUnitMat || 0)) * (item.quantidade || 0)) ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(totalGeral)}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
