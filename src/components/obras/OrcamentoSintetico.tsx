import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Save, ChevronRight, ChevronDown, Trash2, Edit2, FileText, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { orcamentosApi } from "../../apiClient";
import { Orcamento, OrcamentoItem } from "../../types";
import CurrencyInput from "../CurrencyInput";
import ListagemOrcamentosDetalhados from "./ListagemOrcamentosDetalhados";
import OrcamentoDetalhadoView from "./OrcamentoDetalhadoView";

const EditableGlobalField = ({ label, value, onChange, onCommit, formatStr, color, title }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => { setLocalVal(value); }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    onCommit(localVal);
  };

  const bg = color === 'indigo' ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200';
  const text = color === 'indigo' ? 'text-indigo-900' : 'text-amber-900';
  const valText = color === 'indigo' ? 'text-indigo-700' : 'text-amber-700';
  const hoverBg = color === 'indigo' ? 'hover:bg-indigo-100' : 'hover:bg-amber-100';
  const inputBorder = color === 'indigo' ? 'border-indigo-300 focus:ring-indigo-500' : 'border-amber-300 focus:ring-amber-500';

  return (
    <div className={`flex items-center gap-2 mr-2 p-1.5 rounded-lg border ${bg}`} title={title}>
      <label className={`text-sm font-medium ${text}`}>{label}</label>
      {isEditing ? (
        <input 
          type="number" step="0.01" 
          autoFocus
          className={`w-16 p-1 border ${inputBorder} rounded focus:ring-2 font-semibold ${valText} bg-white text-sm`}
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
        />
      ) : (
        <span 
          className={`w-16 p-1 ${valText} font-bold text-sm cursor-pointer ${hoverBg} rounded text-center inline-block transition-colors`}
          onClick={() => setIsEditing(true)}
        >
          {formatStr(value)}
        </span>
      )}
    </div>
  );
};

export default function OrcamentoSintetico({ obraId, onBack }: { obraId: string, onBack: () => void }) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [viewState, setViewState] = useState<'planilha' | 'listagem' | 'detalhado'>('planilha');
  const [selectedOrcamentoDetalhado, setSelectedOrcamentoDetalhado] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'orcamento' | 'custos'>('orcamento');
  const [isDirty, setIsDirty] = useState(false);

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
        const newId = `orc_${Math.random().toString(36).substring(2, 9)}`;
        setOrcamento({ id: newId, obraId, taxaBdi: 0 });
        setItens([]);
      }
      setIsDirty(false);
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
      setIsDirty(false);
      alert("Orçamento salvo com sucesso!");
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar orçamento: ${error.message || error}`);
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
      bdiItem: undefined, // undefined falls back to global BDI
      overrides: {}
    };

    setItens([...itens, novoItem]);
    setIsDirty(true);
  };

  const updateItem = (id: string, updates: Partial<OrcamentoItem>) => {
    setItens(itens.map(i => i.id === id ? { ...i, ...updates } : i));
    setIsDirty(true);
  };

  const updateOverride = (id: string, field: string, val: number | undefined) => {
    setItens(itens.map(i => {
      if (i.id === id) {
        const newOverrides = { ...(i.overrides || {}) };
        if (val === undefined) {
          delete newOverrides[field];
        } else {
          newOverrides[field] = val;
        }
        return { ...i, overrides: newOverrides };
      }
      return i;
    }));
    setIsDirty(true);
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
    setIsDirty(true);
  };

  const totalGeralSemBdiCalc = itens.filter(i => !i.parentId).reduce((sum, c) => sum + (c.overrides?.totGeralBase || ((c.quantidade || 0) * ((c.valorUnitMo || 0) + (c.valorUnitMat || 0)))), 0); // Rough approximation before tree, actual effective will use built tree.

  const handleBdiCommit = (newValStr: string) => {
    const parsed = parseFloat(newValStr);
    if (isNaN(parsed)) return;

    if (window.confirm("Aplicar novo BDI a todos os itens? (Isso resetará o BDI individual de todos os itens)")) {
      setOrcamento(prev => prev ? {...prev, taxaBdi: parsed} : null);
      setItens(prev => prev.map(i => ({...i, bdiItem: undefined})));
      setIsDirty(true);
    }
  };

  const handleDescontoCommit = (newValStr: string) => {
    const parsed = parseFloat(newValStr);
    if (isNaN(parsed)) return;

    if (window.confirm("Aplicar novo desconto a todos os itens? (Isso reescreverá edições manuais de preço de custo e descontos individuais)")) {
      setOrcamento(prev => prev ? {...prev, descontoGlobal: parsed} : null);
      setItens(prev => prev.map(i => {
        const novo = {...i, descontoItem: undefined};
        if (novo.overrides) {
          const newOv = {...novo.overrides};
          delete newOv.unitTotalDesconto;
          delete newOv.totGeralDesconto;
          novo.overrides = newOv;
        }
        return novo;
      }));
      setIsDirty(true);
    }
  };

  const bdiGlobal = orcamento?.taxaBdi || 0;
  const descontoGlobal = orcamento?.descontoGlobal || 0;

  // Build tree and calculate totals handling overrides
  const buildTree = (parentId: string | null = null): (OrcamentoItem & { hasChildren: boolean, totais: any })[] => {
    const children = itens.filter(i => i.parentId === parentId).sort((a, b) => (a.codigo || "").localeCompare(b.codigo || "", undefined, { numeric: true }));
    
    return children.map(child => {
      const subTree = buildTree(child.id);
      const hasChildren = subTree.length > 0;
      
      const ov = child.overrides || {};
      
      let calcTotMO = 0, calcTotMat = 0, calcTotMOComBdi = 0, calcTotMatComBdi = 0;
      
      const bdi = child.bdiItem !== undefined ? child.bdiItem : bdiGlobal;
      const bdiMult = 1 + (bdi / 100);
      
      const descItem = child.descontoItem !== undefined ? child.descontoItem : descontoGlobal;
      const descMult = 1 - (descItem / 100);

      if (hasChildren) {
        calcTotMO = subTree.reduce((sum, c) => sum + c.totais.totMO, 0);
        calcTotMat = subTree.reduce((sum, c) => sum + c.totais.totMat, 0);
        calcTotMOComBdi = subTree.reduce((sum, c) => sum + c.totais.totMOComBdi, 0);
        calcTotMatComBdi = subTree.reduce((sum, c) => sum + c.totais.totMatComBdi, 0);
      } else {
        const qtd = child.quantidade || 0;
        calcTotMO = qtd * (child.valorUnitMo || 0);
        calcTotMat = qtd * (child.valorUnitMat || 0);
        calcTotMOComBdi = calcTotMO * bdiMult;
        calcTotMatComBdi = calcTotMat * bdiMult;
      }

      const totMO = ov.totMO !== undefined ? ov.totMO : calcTotMO;
      const totMat = ov.totMat !== undefined ? ov.totMat : calcTotMat;
      const totGeralBase = ov.totGeralBase !== undefined ? ov.totGeralBase : (totMO + totMat);

      const calcUnitTotal = (child.valorUnitMo || 0) + (child.valorUnitMat || 0);
      const unitTotal = ov.unitTotal !== undefined ? ov.unitTotal : calcUnitTotal;

      const unitTotalComBdi = ov.unitTotalComBdi !== undefined ? ov.unitTotalComBdi : (unitTotal * bdiMult);
      const unitTotalDesconto = ov.unitTotalDesconto !== undefined ? ov.unitTotalDesconto : (unitTotalComBdi * descMult);

      const totMOComBdi = ov.totMOComBdi !== undefined ? totMO * bdiMult : calcTotMOComBdi;
      const totMatComBdi = ov.totMatComBdi !== undefined ? totMat * bdiMult : calcTotMatComBdi;
      const totGeralComBdi = ov.totGeralComBdi !== undefined ? ov.totGeralComBdi : (totMOComBdi + totMatComBdi);
      const totGeralDesconto = ov.totGeralDesconto !== undefined ? ov.totGeralDesconto : (totGeralComBdi * descMult);

      return {
        ...child,
        hasChildren,
        totais: {
          totMO,
          totMat,
          totGeralBase,
          totMOComBdi,
          totMatComBdi,
          totGeralComBdi,
          totGeralDesconto,
          unitTotal,
          unitTotalComBdi,
          unitTotalDesconto
        }
      };
    });
  };

  const tree = buildTree(null);
  
  const totalGeralSemBdi = tree.reduce((sum, c) => sum + c.totais.totGeralBase, 0);
  const totalGeralComBdi = tree.reduce((sum, c) => sum + c.totais.totGeralComBdi, 0);
  const totalFinalComDesconto = tree.reduce((sum, c) => sum + c.totais.totGeralDesconto, 0);

  const calculatedEffectiveBdi = totalGeralSemBdi > 0 ? ((totalGeralComBdi - totalGeralSemBdi) / totalGeralSemBdi) * 100 : bdiGlobal;
  const calculatedEffectiveDesconto = totalGeralComBdi > 0 ? ((totalGeralComBdi - totalFinalComDesconto) / totalGeralComBdi) * 100 : descontoGlobal;

  const downloadModelo = () => {
    const ws_data = [
      ["Item", "Descricao", "Unidade", "Quantidade", "Valor_Unitario", "BDI_Individual"],
      ["1", "SERVICOS INICIAIS", "", "", "", ""],
      ["1.1", "PLACA DE OBRA", "M2", "12", "250", "0"],
      ["1.2", "TAPUME", "M", "50", "180", ""]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "Modelo_Orcamento.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Planilha vazia ou formato incorreto.");
          return;
        }

        if(!confirm("A importação substituirá os itens atuais pelo conteúdo da planilha. Deseja continuar?")) return;

        const novosItens: OrcamentoItem[] = [];
        const codeMap: Record<string, string> = {}; // map code to newly generated ids

        const getVal = (r: any, keys: string[]) => {
          for (const k of Object.keys(r)) {
            if (keys.includes(k.toUpperCase()) && r[k] !== undefined && r[k] !== null) {
              return String(r[k]).trim();
            }
          }
          return "";
        };

        // First pass: map all codes to IDs
        data.forEach((row: any) => {
          const itemCode = getVal(row, ["ITEM", "CODIGO", "CÓDIGO", "CÓD"]);
          if (itemCode) {
            const id = `item_${Math.random().toString(36).substring(2, 9)}`;
            codeMap[itemCode] = id;
          }
        });

        // Second pass: build items and link parents
        data.forEach((row: any) => {
          const itemCode = getVal(row, ["ITEM", "CODIGO", "CÓDIGO", "CÓD"]);
          if (!itemCode) return;

          const parts = itemCode.split(".");
          parts.pop(); // remove last part to find parent
          const parentCode = parts.join(".");
          const parentId = parentCode && codeMap[parentCode] ? codeMap[parentCode] : null;

          let bdiItem: number | undefined = undefined;
          const rawBdi = getVal(row, ["BDI_INDIVIDUAL", "BDI", "BDI %", "BDI%"]);
          if (rawBdi) {
            const parsed = parseFloat(rawBdi.replace(',', '.'));
            if (!isNaN(parsed)) {
              bdiItem = parsed <= 1 && parsed > 0 ? parsed * 100 : parsed; 
            }
          }

          novosItens.push({
            id: codeMap[itemCode],
            orcamentoId: orcamento!.id,
            parentId: parentId,
            codigo: itemCode,
            descricao: getVal(row, ["DESCRICAO", "DESCRIÇÃO", "SERVICO", "SERVIÇO", "NOME"]) || "Sem descrição",
            unidade: getVal(row, ["UNIDADE", "UND", "UN"]),
            quantidade: parseFloat(getVal(row, ["QUANTIDADE", "QUANT", "QTD", "QTDE"]).replace(',', '.')) || 0,
            valorUnitMo: parseFloat(getVal(row, ["VALOR_UNITARIO", "VALOR_UNIT", "VALOR", "PRECO", "PREÇO", "VALOR_MO", "MO"]).replace(',', '.')) || 0,
            valorUnitMat: parseFloat(getVal(row, ["VALOR_MAT", "MAT", "MATERIAL"]).replace(',', '.')) || 0,
            bdiItem: bdiItem,
            overrides: {}
          });
        });

        setItens(novosItens);
        setIsDirty(true);
        alert("Importação realizada. Não esqueça de Salvar o Orçamento.");
      } catch (err) {
        console.error(err);
        alert("Erro ao processar o arquivo. Verifique o formato.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) return <div className="p-8">Carregando orçamento...</div>;

  if (viewState === 'listagem') {
    return (
      <ListagemOrcamentosDetalhados 
        obraId={obraId}
        onBack={() => setViewState('planilha')}
        onSelectOrcamento={(orcId) => {
          setSelectedOrcamentoDetalhado(orcId);
          setViewState('detalhado');
        }}
      />
    );
  }

  if (viewState === 'detalhado') {
    return (
      <OrcamentoDetalhadoView
        orcamentoId={selectedOrcamentoDetalhado}
        obraId={obraId}
        todosItens={itens}
        onBack={() => setViewState('listagem')}
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
            {viewMode === 'orcamento' && (
              <EditableGlobalField 
                label="BDI Global (%):" 
                value={calculatedEffectiveBdi.toFixed(2)} 
                onCommit={handleBdiCommit} 
                formatStr={(v: string) => `${v}%`} 
                color="indigo" 
                title="BDI efetivo médio. Clique para editar o BDI Global."
              />
            )}
            {isDirty && (
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <Save size={18} /> Salvar Orçamento
              </button>
            )}
          </div>
        </div>

        {/* Totais Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500 font-medium mb-1">Total Sem BDI</p>
            <p className="text-xl lg:text-2xl font-bold text-zinc-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeralSemBdi)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500 font-medium mb-1">Total do BDI</p>
            <p className="text-xl lg:text-2xl font-bold text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeralComBdi - totalGeralSemBdi)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500 font-medium mb-1">Total Geral (Com BDI)</p>
            <p className="text-xl lg:text-2xl font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeralComBdi)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm bg-amber-50/50">
            <p className="text-sm text-amber-700 font-medium mb-1">Total c/ Desconto</p>
            <p className="text-xl lg:text-2xl font-bold text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFinalComDesconto)}</p>
          </div>
        </div>

        {/* Header e Abas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mt-4 gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('orcamento')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === 'orcamento' ? "bg-zinc-900 text-white" : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50"}`}
            >
              Orçamento
            </button>
            <button 
              onClick={() => setViewMode('custos')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === 'custos' ? "bg-zinc-900 text-white" : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50"}`}
            >
              Preço de Custos
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'custos' && (
              <EditableGlobalField 
                label="Desconto Global (%):" 
                value={calculatedEffectiveDesconto.toFixed(2)} 
                onCommit={handleDescontoCommit} 
                formatStr={(v: string) => `${v}%`} 
                color="amber" 
                title="Desconto efetivo médio. Clique para editar o Desconto Global."
              />
            )}
            <button onClick={() => setViewState('listagem')} className="px-4 py-2 bg-blue-50 text-blue-700 rounded font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm">
              <FileText size={16} /> Acessar Detalhamento
            </button>
            <button onClick={downloadModelo} className="px-4 py-2 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 text-sm hidden sm:flex">
              <Download size={16} /> Baixar Modelo
            </button>
            <label className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm cursor-pointer hidden sm:flex">
              <Upload size={16} /> Importar XLSX
              <input type="file" className="hidden" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} />
            </label>
          </div>
        </div>

        {/* Tabela Principal */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-700">
                  <th className="p-2 border-r font-semibold w-[80px]" rowSpan={2}>Item</th>
                  <th className="p-2 border-r font-semibold w-full min-w-[200px]" rowSpan={2}>Descrição</th>
                  <th className="p-2 border-r font-semibold text-center w-[60px]" rowSpan={2}>Und</th>
                  <th className="p-2 border-r font-semibold text-center w-[80px]" rowSpan={2}>Quant.</th>
                  {viewMode === 'orcamento' ? (
                    <>
                      <th className="p-2 border-r font-semibold text-center w-[80px]" rowSpan={2} title="Porcentagem de BDI Individual">BDI %</th>
                      <th className="p-2 border-r font-semibold text-center" colSpan={2}>Valor Unit. s/ BDI</th>
                      <th className="p-2 border-r font-semibold text-center bg-indigo-50" colSpan={2}>Valor Unit. e Total Geral c/ BDI</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2 border-r font-semibold text-center w-[100px]" rowSpan={2} title="Porcentagem de Desconto Individual">Desconto %</th>
                      <th className="p-2 border-r font-semibold text-center bg-amber-50 text-amber-900" colSpan={2}>Valores com Desconto</th>
                    </>
                  )}
                  <th className="p-2 font-semibold text-center w-[120px]" rowSpan={2}>Ações</th>
                </tr>
                <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-600">
                  {viewMode === 'orcamento' ? (
                    <>
                      <th className="p-2 border-r text-right font-medium">Valor Unit.</th>
                      <th className="p-2 border-r text-right font-medium">Total</th>
                      <th className="p-2 border-r text-right font-medium bg-indigo-50">Valor Unit.</th>
                      <th className="p-2 border-r text-right font-medium bg-indigo-50">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2 border-r text-right font-medium bg-amber-50 text-amber-900">Valor Unit.</th>
                      <th className="p-2 border-r text-right font-medium bg-amber-50 text-amber-900">Total</th>
                    </>
                  )}
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
                    updateOverride={updateOverride}
                    allItens={itens}
                    bdiGlobal={bdiGlobal}
                    viewMode={viewMode}
                    descontoGlobal={orcamento?.descontoGlobal || 0}
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

function ItemRow({ node, level, onAddSub, onUpdate, onRemove, updateOverride, allItens, bdiGlobal, viewMode, descontoGlobal }: any) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Re-build child tree for this node locally to render recursive rows
  const children = allItens.filter((i:any) => i.parentId === node.id).sort((a:any, b:any) => (a.codigo || "").localeCompare(b.codigo || "", undefined, { numeric: true }));
  
  const buildTree = (childList: any[]): any[] => {
    return childList.map(child => {
      const subTree = buildTree(allItens.filter((i:any) => i.parentId === child.id));
      const hasChildren = subTree.length > 0;
      
      const ov = child.overrides || {};

      let calcTotMO = 0, calcTotMat = 0, calcTotMOComBdi = 0, calcTotMatComBdi = 0, calcTotGeralDesconto = 0, calcUnitTotalDesconto = 0;
      
      const bdi = child.bdiItem !== undefined ? child.bdiItem : bdiGlobal;
      const bdiMult = 1 + (bdi / 100);

      const descItem = child.descontoItem !== undefined ? child.descontoItem : descontoGlobal;
      const descMult = 1 - (descItem / 100);

      if (hasChildren) {
        calcTotMO = subTree.reduce((sum, c) => sum + c.totais.totMO, 0);
        calcTotMat = subTree.reduce((sum, c) => sum + c.totais.totMat, 0);
        calcTotMOComBdi = subTree.reduce((sum, c) => sum + c.totais.totMOComBdi, 0);
        calcTotMatComBdi = subTree.reduce((sum, c) => sum + c.totais.totMatComBdi, 0);
        calcTotGeralDesconto = subTree.reduce((sum, c) => sum + c.totais.totGeralDesconto, 0);
      } else {
        const qtd = child.quantidade || 0;
        calcTotMO = qtd * (child.valorUnitMo || 0);
        calcTotMat = qtd * (child.valorUnitMat || 0);
        calcTotMOComBdi = calcTotMO * bdiMult;
        calcTotMatComBdi = calcTotMat * bdiMult;
        calcTotGeralDesconto = (calcTotMOComBdi + calcTotMatComBdi) * descMult;
        calcUnitTotalDesconto = ((child.valorUnitMo || 0) + (child.valorUnitMat || 0)) * bdiMult * descMult;
      }
      
      const totMO = ov.totMO !== undefined ? ov.totMO : calcTotMO;
      const totMat = ov.totMat !== undefined ? ov.totMat : calcTotMat;
      const totGeralBase = ov.totGeralBase !== undefined ? ov.totGeralBase : (totMO + totMat);

      const calcUnitTotal = (child.valorUnitMo || 0) + (child.valorUnitMat || 0);
      const unitTotal = ov.unitTotal !== undefined ? ov.unitTotal : calcUnitTotal;

      const unitTotalComBdi = ov.unitTotalComBdi !== undefined ? ov.unitTotalComBdi : (unitTotal * bdiMult);

      const totMOComBdi = ov.totMOComBdi !== undefined ? ov.totMOComBdi : calcTotMOComBdi;
      const totMatComBdi = ov.totMatComBdi !== undefined ? ov.totMatComBdi : calcTotMatComBdi;
      const totGeralComBdi = ov.totGeralComBdi !== undefined ? ov.totGeralComBdi : (totMOComBdi + totMatComBdi);

      // Desconto Final (override)
      const unitTotalDesconto = ov.unitTotalDesconto !== undefined ? ov.unitTotalDesconto : calcUnitTotalDesconto;
      const totGeralDesconto = ov.totGeralDesconto !== undefined ? ov.totGeralDesconto : calcTotGeralDesconto;

      return {
        ...child,
        hasChildren,
        totais: {
          totMO, totMat, totGeralBase, totMOComBdi, totMatComBdi, totGeralComBdi, unitTotal, unitTotalComBdi,
          unitTotalDesconto, totGeralDesconto
        }
      };
    });
  };

  const childNodes = buildTree(children);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  const formatNum = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const isFolder = node.hasChildren;
  const maxLevel = 3; 

  const ov = node.overrides || {};
  const hasOverride = Object.keys(ov).length > 0;

  const bdiMult = 1 + ((node.bdiItem !== undefined ? node.bdiItem : bdiGlobal) / 100);

  // Cores de destaque para diferenciar hierarquia
  let rowBg = 'bg-white hover:bg-zinc-50';
  let fontClasses = 'text-zinc-600';
  let codigoClasses = 'text-slate-700';
  let fontWeight = node.codigo?.includes('.') ? 'font-normal' : 'font-bold';
  
  if (level === 0) {
    rowBg = 'bg-slate-200/60 hover:bg-slate-300/60';
    fontClasses = 'text-slate-900';
    codigoClasses = 'text-slate-900';
  } else if (level === 1) {
    rowBg = 'bg-slate-100/80 hover:bg-slate-200/80';
    fontClasses = 'text-slate-800';
    codigoClasses = 'text-slate-800';
  } else if (isFolder) {
    rowBg = 'bg-slate-50 hover:bg-slate-100';
    fontClasses = 'text-slate-700';
    codigoClasses = 'text-slate-700';
  }

  if (hasOverride && !editing) {
    rowBg = 'bg-amber-50/50 hover:bg-amber-100/50';
  }

  return (
    <>
      <tr className={`${rowBg}`}>
        <td className="p-2 border-r">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${level * 16}px` }}>
            {isFolder ? (
              <button onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-black/10 rounded transition-colors">
                {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
              </button>
            ) : <span className="w-4 inline-block"></span>}
            {editing ? (
              <input type="text" value={node.codigo} onChange={e => onUpdate(node.id, { codigo: e.target.value })} className={`w-16 p-1 border rounded text-xs ${fontWeight}`} />
            ) : (
              <span className={`${codigoClasses} ${fontWeight}`}>{node.codigo}</span>
            )}
          </div>
        </td>
        <td className="p-2 border-r max-w-xs truncate" title={node.descricao}>
          {editing ? (
            <input type="text" value={node.descricao} onChange={e => onUpdate(node.id, { descricao: e.target.value })} className={`w-full p-1 border rounded text-xs ${fontWeight}`} />
          ) : (
            <span className={`${isFolder ? 'uppercase' : ''} ${fontClasses} ${fontWeight}`}>{node.descricao}</span>
          )}
        </td>
        <td className="p-2 border-r text-center">
          {editing ? (
             <input type="text" value={node.unidade} onChange={e => onUpdate(node.id, { unidade: e.target.value })} className={`w-10 p-1 border rounded text-xs text-center ${fontWeight}`} />
          ) : (
            <span className={`text-zinc-500 ${fontWeight}`}>{isFolder ? '' : node.unidade}</span>
          )}
        </td>
        <td className="p-2 border-r text-center">
          {editing ? (
             <input type="number" step="0.01" value={node.quantidade} onChange={e => onUpdate(node.id, { quantidade: parseFloat(e.target.value) })} className={`w-16 p-1 border rounded text-xs text-right ${fontWeight}`} />
          ) : (
             <span className={`text-zinc-700 ${fontWeight}`}>{isFolder ? '' : formatNum(node.quantidade)}</span>
          )}
        </td>

        {viewMode === 'orcamento' ? (
          <>
            {/* BDI Individual */}
            <td className="p-2 border-r text-center">
              {editing ? (
                 <input type="number" step="0.01" value={node.bdiItem !== undefined ? node.bdiItem : ''} placeholder="Global" onChange={e => onUpdate(node.id, { bdiItem: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`w-16 p-1 border rounded text-xs text-right ${fontWeight}`} />
              ) : (
                 <span className={`text-indigo-600 ${fontWeight}`}>{node.bdiItem !== undefined ? `${formatNum(node.bdiItem)}%` : '-'}</span>
              )}
            </td>

            {/* --- Grupo 1: Valor Unit. s/ BDI --- */}
            <td className={`p-2 border-r text-right ${fontWeight}`}>
              {/* Valor Unit. */}
              {!isFolder && editing ? (
                <CurrencyInput value={node.valorUnitMo} onChangeValue={val => onUpdate(node.id, { valorUnitMo: val })} className={`w-24 p-1 border rounded text-xs text-right ${fontWeight}`} />
              ) : (
                <span className={fontClasses}>{!isFolder ? formatCurrency(node.totais.unitTotal) : ''}</span>
              )}
            </td>
            <td className={`p-2 border-r text-right ${fontWeight} ${ov.totGeralBase !== undefined ? 'text-amber-700' : fontClasses}`}>
              {/* Total */}
              {editing ? (
                <CurrencyInput value={node.totais.totGeralBase || 0} onChangeValue={val => updateOverride(node.id, 'totGeralBase', val)} className={`w-24 p-1 border border-amber-300 rounded text-xs text-right bg-amber-50 ${fontWeight}`} />
              ) : (
                formatCurrency(node.totais.totGeralBase)
              )}
            </td>

            {/* --- Grupo 2: Valor Unit. e Total Geral c/ BDI --- */}
            <td className={`p-2 border-r text-right bg-indigo-50/30 text-indigo-900 ${fontWeight}`}>
              {/* Valor Unit. */}
              {!isFolder && editing ? (
                <CurrencyInput value={node.totais.unitTotalComBdi || 0} onChangeValue={val => updateOverride(node.id, 'unitTotalComBdi', val)} className={`w-24 p-1 border border-amber-300 rounded text-xs text-right bg-amber-50 ${fontWeight}`} />
              ) : (
                !isFolder ? formatCurrency(node.totais.unitTotalComBdi) : ''
              )}
            </td>
            <td className={`p-2 border-r text-right bg-indigo-50/30 ${fontWeight} ${ov.totGeralComBdi !== undefined ? 'text-amber-700' : 'text-indigo-900'}`}>
              {/* Total */}
              {editing ? (
                 <CurrencyInput value={node.totais.totGeralComBdi || 0} onChangeValue={val => updateOverride(node.id, 'totGeralComBdi', val)} className={`w-24 p-1 border border-amber-300 rounded text-xs text-right bg-amber-50 ${fontWeight}`} />
              ) : (
                formatCurrency(node.totais.totGeralComBdi)
              )}
            </td>
          </>
        ) : (
          <>
            {/* Desconto Individual */}
            <td className="p-2 border-r text-center">
              {editing ? (
                 <input type="number" step="0.01" value={node.descontoItem !== undefined ? node.descontoItem : ''} placeholder="Global" onChange={e => onUpdate(node.id, { descontoItem: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`w-16 p-1 border rounded text-xs text-right ${fontWeight}`} />
              ) : (
                 <span className={`text-amber-600 ${fontWeight}`}>{node.descontoItem !== undefined ? `${formatNum(node.descontoItem)}%` : '-'}</span>
              )}
            </td>

            {/* --- Valores com Desconto (Aba Custos) --- */}
            <td className={`p-2 border-r text-right bg-amber-50/30 text-amber-900 ${fontWeight}`}>
              {/* Valor Unit. (Com Desconto) */}
              {!isFolder && editing ? (
                <CurrencyInput value={node.totais.unitTotalDesconto || 0} onChangeValue={val => updateOverride(node.id, 'unitTotalDesconto', val)} className={`w-24 p-1 border border-amber-300 rounded text-xs text-right bg-amber-100 ${fontWeight}`} />
              ) : (
                !isFolder ? formatCurrency(node.totais.unitTotalDesconto) : ''
              )}
            </td>
            <td className={`p-2 border-r text-right bg-amber-50/30 ${fontWeight} ${ov.totGeralDesconto !== undefined ? 'text-rose-600' : 'text-amber-900'}`}>
              {/* Total (Com Desconto) */}
              {editing ? (
                 <CurrencyInput value={node.totais.totGeralDesconto || 0} onChangeValue={val => updateOverride(node.id, 'totGeralDesconto', val)} className={`w-28 p-1 border border-amber-300 rounded text-xs text-right bg-amber-100 ${fontWeight}`} />
              ) : (
                formatCurrency(node.totais.totGeralDesconto)
              )}
            </td>
          </>
        )}

        {/* Ações */}
        <td className="p-2 text-center space-x-1">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="p-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200" title="Concluir edição da linha"><Save size={14}/></button>
              {hasOverride && (
                 <button onClick={() => updateItem(node.id, { overrides: {} })} className="p-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200" title="Restaurar Cálculos"><Trash2 size={14}/></button>
              )}
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="p-1 text-zinc-400 hover:text-indigo-600 rounded hover:bg-zinc-100" title="Editar Valores (Permite Sobrescrita)"><Edit2 size={14}/></button>
          )}
          {level < maxLevel && (
            <button onClick={() => onAddSub(node.id, node.codigo)} title="Adicionar Subitem" className="p-1 text-zinc-400 hover:text-emerald-600 rounded hover:bg-zinc-100"><Plus size={14}/></button>
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
          updateOverride={updateOverride}
          allItens={allItens}
          bdiGlobal={bdiGlobal}
          viewMode={viewMode}
          descontoGlobal={descontoGlobal}
        />
      ))}
    </>
  );
}
