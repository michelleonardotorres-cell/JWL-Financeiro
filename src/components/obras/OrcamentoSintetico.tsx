import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save, ChevronRight, ChevronDown, Trash2, Edit2, FileText } from "lucide-react";
import { orcamentosApi } from "../../apiClient";
import { Orcamento, OrcamentoItem } from "../../types";
import CurrencyInput from "../CurrencyInput";
import DetalhamentoItem from "./DetalhamentoItem";

export default function OrcamentoSintetico({ obraId, onBack }: { obraId: string, onBack: () => void }) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detalhamento modal state
  const [itemParaDetalhar, setItemParaDetalhar] = useState<OrcamentoItem | null>(null);
  const [showDetalhamento, setShowDetalhamento] = useState(false);

  useEffect(() => {
    loadOrcamento();
  }, [obraId]);

  const loadOrcamento = async () => {
    setLoading(true);
    try {
      const res = await orcamentosApi.getByObraId(obraId);
      if (res) {
        setOrcamento(res);
        setItens(res.itens || []);
      } else {
        // Obra sem orçamento, cria um base na UI
        const newId = `orc_${Math.random().toString(36).substring(2, 9)}`;
        setOrcamento({ id: newId, obraId, taxaBdi: 0 });
        setItens([]);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar orçamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!orcamento) return;
    try {
      await orcamentosApi.save({ ...orcamento, itens });
      alert("Orçamento salvo com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar orçamento.");
    }
  };

  const addItem = (parentId: string | null = null, codigoPrefix = "") => {
    const parentItems = itens.filter(i => i.parentId === parentId);
    const nextNum = parentItems.length + 1;
    const novoCodigo = parentId ? `${codigoPrefix}.${nextNum}` : `${nextNum}`;
    
    const novoItem: OrcamentoItem = {
      id: `item_${Math.random().toString(36).substring(2, 9)}`,
      orcamentoId: orcamento!.id,
      parentId,
      codigo: novoCodigo,
      descricao: "Novo Item",
      unidade: "UN",
      quantidade: 1,
      valorUnitMo: 0,
      valorUnitMat: 0,
      bdiItem: orcamento?.taxaBdi || 0
    };

    setItens([...itens, novoItem]);
  };

  const updateItem = (id: string, updates: Partial<OrcamentoItem>) => {
    setItens(itens.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const removeItem = (id: string) => {
    if(!confirm("Remover este item e todos os seus subitens?")) return;
    
    const idsToRemove = new Set<string>();
    const gatherIds = (parentId: string) => {
      idsToRemove.add(parentId);
      itens.filter(i => i.parentId === parentId).forEach(child => gatherIds(child.id));
    };
    gatherIds(id);
    
    setItens(itens.filter(i => !idsToRemove.has(i.id)));
  };

  const bdiGlobal = orcamento?.taxaBdi || 0;

  // Build tree and calculate totals
  const buildTree = (parentId: string | null = null): (OrcamentoItem & { hasChildren: boolean, totais: any })[] => {
    const children = itens.filter(i => i.parentId === parentId).sort((a, b) => (a.codigo || "").localeCompare(b.codigo || "", undefined, { numeric: true }));
    
    return children.map(child => {
      const subTree = buildTree(child.id);
      const hasChildren = subTree.length > 0;
      
      let totMO = 0, totMat = 0;

      if (hasChildren) {
        totMO = subTree.reduce((sum, c) => sum + c.totais.totMO, 0);
        totMat = subTree.reduce((sum, c) => sum + c.totais.totMat, 0);
      } else {
        const qtd = child.quantidade || 0;
        totMO = qtd * (child.valorUnitMo || 0);
        totMat = qtd * (child.valorUnitMat || 0);
      }

      const bdi = child.bdiItem ?? bdiGlobal;
      const bdiMult = 1 + (bdi / 100);

      const totMOComBdi = totMO * bdiMult;
      const totMatComBdi = totMat * bdiMult;

      return {
        ...child,
        hasChildren,
        totais: {
          totMO,
          totMat,
          totGeral: totMO + totMat,
          totMOComBdi,
          totMatComBdi,
          totGeralComBdi: totMOComBdi + totMatComBdi
        }
      };
    });
  };

  const tree = buildTree(null);
  
  const totalGeralSemBdi = tree.reduce((sum, c) => sum + c.totais.totGeral, 0);
  const totalGeralComBdi = tree.reduce((sum, c) => sum + c.totais.totGeralComBdi, 0);

  if (loading) return <div className="p-8">Carregando orçamento...</div>;

  if (showDetalhamento || itemParaDetalhar) {
    return (
      <DetalhamentoItem 
        itemSelecionado={itemParaDetalhar} 
        todosItens={itens}
        onBack={() => {
          setItemParaDetalhar(null);
          setShowDetalhamento(false);
        }} 
      />
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto bg-zinc-50 relative">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Planilha Orçamentária Sintética</h1>
              <p className="text-sm text-zinc-500">Planejamento da Obra</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-zinc-700">BDI Global (%):</label>
              <input 
                type="number" 
                step="0.01"
                className="w-20 p-2 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500" 
                value={orcamento?.taxaBdi || 0}
                onChange={e => setOrcamento(prev => prev ? {...prev, taxaBdi: parseFloat(e.target.value)} : null)}
              />
            </div>
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Save size={18} /> Salvar Orçamento
            </button>
          </div>
        </div>

        {/* Totais Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500 font-medium mb-1">Total Sem BDI</p>
            <p className="text-2xl font-bold text-zinc-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeralSemBdi)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500 font-medium mb-1">Total do BDI</p>
            <p className="text-2xl font-bold text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeralComBdi - totalGeralSemBdi)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500 font-medium mb-1">Total Geral (Com BDI)</p>
            <p className="text-2xl font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeralComBdi)}</p>
          </div>
        </div>

        {/* Header e Ações Globais */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mt-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowDetalhamento(true)} className="px-4 py-2 bg-blue-50 text-blue-700 rounded font-medium hover:bg-blue-100 transition-colors flex items-center gap-2">
              <FileText size={18} /> Acessar Tela de Detalhamento
            </button>
          </div>
        </div>

        {/* Tabela Principal */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-700">
                  <th className="p-2 border-r font-semibold" rowSpan={2}>Item</th>
                  <th className="p-2 border-r font-semibold w-1/4" rowSpan={2}>Descrição</th>
                  <th className="p-2 border-r font-semibold text-center" rowSpan={2}>Und</th>
                  <th className="p-2 border-r font-semibold text-center" rowSpan={2}>Quant.</th>
                  <th className="p-2 border-r font-semibold text-center" colSpan={3}>Valor Unit. s/ BDI</th>
                  <th className="p-2 border-r font-semibold text-center bg-indigo-50" colSpan={3}>Valor Unit. c/ BDI</th>
                  <th className="p-2 border-r font-semibold text-center bg-emerald-50" colSpan={3}>Total Geral</th>
                  <th className="p-2 font-semibold text-center" rowSpan={2}>Ações</th>
                </tr>
                <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-600">
                  {/* Unit s/ BDI */}
                  <th className="p-2 border-r text-right font-medium">M.O.</th>
                  <th className="p-2 border-r text-right font-medium">MAT.</th>
                  <th className="p-2 border-r text-right font-medium">Total</th>
                  {/* Unit c/ BDI */}
                  <th className="p-2 border-r text-right font-medium bg-indigo-50">M.O.</th>
                  <th className="p-2 border-r text-right font-medium bg-indigo-50">MAT.</th>
                  <th className="p-2 border-r text-right font-medium bg-indigo-50">Total</th>
                  {/* Totais Gerais */}
                  <th className="p-2 border-r text-right font-medium bg-emerald-50">M.O.</th>
                  <th className="p-2 border-r text-right font-medium bg-emerald-50">MAT.</th>
                  <th className="p-2 border-r text-right font-medium bg-emerald-50">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {tree.map(node => (
                  <ItemRow 
                    key={node.id} 
                    node={node} 
                    level={0} 
                    onAddSub={(id, codigo) => addItem(id, codigo)} 
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    onDetalhar={setItemParaDetalhar}
                    allItens={itens}
                    bdiGlobal={bdiGlobal}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <button onClick={() => addItem(null)} className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded font-medium hover:bg-zinc-100 transition-colors flex items-center gap-2 text-sm">
              <Plus size={16} /> Adicionar Etapa Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ node, level, onAddSub, onUpdate, onRemove, onDetalhar, allItens, bdiGlobal }: any) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  
  const bdi = node.bdiItem ?? bdiGlobal;
  const bdiMult = 1 + (bdi / 100);

  // Re-build child tree for this node locally to render recursive rows
  const children = allItens.filter((i:any) => i.parentId === node.id).sort((a:any, b:any) => (a.codigo || "").localeCompare(b.codigo || "", undefined, { numeric: true }));
  
  const buildTree = (childList: any[]): any[] => {
    return childList.map(child => {
      const subTree = buildTree(allItens.filter((i:any) => i.parentId === child.id));
      const hasChildren = subTree.length > 0;
      let totMO = 0, totMat = 0;
      if (hasChildren) {
        totMO = subTree.reduce((sum, c) => sum + c.totais.totMO, 0);
        totMat = subTree.reduce((sum, c) => sum + c.totais.totMat, 0);
      } else {
        const qtd = child.quantidade || 0;
        totMO = qtd * (child.valorUnitMo || 0);
        totMat = qtd * (child.valorUnitMat || 0);
      }
      const bdiMultChild = 1 + ((child.bdiItem ?? bdiGlobal) / 100);
      return {
        ...child,
        hasChildren,
        totais: {
          totMO, totMat, totGeral: totMO + totMat,
          totMOComBdi: totMO * bdiMultChild,
          totMatComBdi: totMat * bdiMultChild,
          totGeralComBdi: (totMO + totMat) * bdiMultChild
        }
      };
    });
  };

  const childNodes = buildTree(children);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const isFolder = node.hasChildren;
  const maxLevel = 3; // 0=1, 1=1.1, 2=1.1.1, 3=1.1.1.1 (4 levels max)

  return (
    <>
      <tr className={`hover:bg-zinc-50 ${isFolder ? 'bg-indigo-50/20 font-medium' : ''}`}>
        <td className="p-2 border-r">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${level * 16}px` }}>
            {isFolder ? (
              <button onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-zinc-200 rounded">
                {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
              </button>
            ) : <span className="w-4 inline-block"></span>}
            {editing ? (
              <input type="text" value={node.codigo} onChange={e => onUpdate(node.id, { codigo: e.target.value })} className="w-16 p-1 border rounded text-xs" />
            ) : (
              <span className="text-indigo-900">{node.codigo}</span>
            )}
          </div>
        </td>
        <td className="p-2 border-r">
          {editing ? (
            <input type="text" value={node.descricao} onChange={e => onUpdate(node.id, { descricao: e.target.value })} className="w-full p-1 border rounded text-xs" />
          ) : (
            <span className={isFolder ? 'uppercase text-zinc-800' : 'text-zinc-600'}>{node.descricao}</span>
          )}
        </td>
        <td className="p-2 border-r text-center">
          {editing ? (
             <input type="text" value={node.unidade} onChange={e => onUpdate(node.id, { unidade: e.target.value })} className="w-10 p-1 border rounded text-xs text-center" />
          ) : (
            <span className="text-zinc-500">{isFolder ? '' : node.unidade}</span>
          )}
        </td>
        <td className="p-2 border-r text-center">
          {editing ? (
             <input type="number" value={node.quantidade} onChange={e => onUpdate(node.id, { quantidade: parseFloat(e.target.value) })} className="w-16 p-1 border rounded text-xs text-right" />
          ) : (
             <span className="text-zinc-700">{isFolder ? '' : node.quantidade}</span>
          )}
        </td>

        {/* Unit s/ BDI */}
        <td className="p-2 border-r text-right text-zinc-600">
          {!isFolder && editing ? (
            <input type="number" step="0.01" value={node.valorUnitMo} onChange={e => onUpdate(node.id, { valorUnitMo: parseFloat(e.target.value) })} className="w-20 p-1 border rounded text-xs text-right" />
          ) : (
            !isFolder ? formatCurrency(node.valorUnitMo) : ''
          )}
        </td>
        <td className="p-2 border-r text-right text-zinc-600">
          {!isFolder && editing ? (
            <input type="number" step="0.01" value={node.valorUnitMat} onChange={e => onUpdate(node.id, { valorUnitMat: parseFloat(e.target.value) })} className="w-20 p-1 border rounded text-xs text-right" />
          ) : (
            !isFolder ? formatCurrency(node.valorUnitMat) : ''
          )}
        </td>
        <td className="p-2 border-r text-right font-semibold text-zinc-700">
          {!isFolder ? formatCurrency((node.valorUnitMo || 0) + (node.valorUnitMat || 0)) : ''}
        </td>

        {/* Unit c/ BDI (Calculated) */}
        <td className="p-2 border-r text-right text-indigo-700 bg-indigo-50/50">
          {!isFolder ? formatCurrency((node.valorUnitMo || 0) * bdiMult) : ''}
        </td>
        <td className="p-2 border-r text-right text-indigo-700 bg-indigo-50/50">
          {!isFolder ? formatCurrency((node.valorUnitMat || 0) * bdiMult) : ''}
        </td>
        <td className="p-2 border-r text-right font-semibold text-indigo-800 bg-indigo-50/50">
          {!isFolder ? formatCurrency(((node.valorUnitMo || 0) + (node.valorUnitMat || 0)) * bdiMult) : ''}
        </td>

        {/* Totais Gerais */}
        <td className="p-2 border-r text-right text-emerald-700 bg-emerald-50/50">
          {formatCurrency(node.totais.totMOComBdi)}
        </td>
        <td className="p-2 border-r text-right text-emerald-700 bg-emerald-50/50">
          {formatCurrency(node.totais.totMatComBdi)}
        </td>
        <td className="p-2 border-r text-right font-bold text-emerald-800 bg-emerald-50/50">
          {formatCurrency(node.totais.totGeralComBdi)}
        </td>

        {/* Ações */}
        <td className="p-2 text-center space-x-1">
          {editing ? (
            <button onClick={() => setEditing(false)} className="p-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"><Save size={14}/></button>
          ) : (
            <button onClick={() => setEditing(true)} className="p-1 text-zinc-400 hover:text-indigo-600 rounded hover:bg-zinc-100"><Edit2 size={14}/></button>
          )}
          {level < maxLevel && (
            <button onClick={() => onAddSub(node.id, node.codigo)} title="Adicionar Subitem" className="p-1 text-zinc-400 hover:text-emerald-600 rounded hover:bg-zinc-100"><Plus size={14}/></button>
          )}
          {!isFolder && (
            <button onClick={() => onDetalhar(node)} title="Detalhar Cotações" className="p-1 text-zinc-400 hover:text-blue-600 rounded hover:bg-zinc-100"><FileText size={14}/></button>
          )}
          <button onClick={() => onRemove(node.id)} title="Excluir" className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100"><Trash2 size={14}/></button>
        </td>
      </tr>
      
      {expanded && childNodes.map(child => (
        <ItemRow 
          key={child.id} 
          node={child} 
          level={level + 1} 
          onAddSub={onAddSub} 
          onUpdate={onUpdate}
          onRemove={onRemove}
          onDetalhar={onDetalhar}
          allItens={allItens}
          bdiGlobal={bdiGlobal}
        />
      ))}
    </>
  );
}
