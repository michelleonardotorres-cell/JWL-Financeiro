import React, { useState } from "react";
import { X, Check } from "lucide-react";
import Combobox from "./Combobox";
import { Fornecedor } from "../types";
import { safeFormatDate } from "../utils";

interface AprovarMedicaoModalProps {
  titulo?: string;
  valorOriginal: number;
  valorRetencao?: number;
  dataOriginal: string; // YYYY-MM-DD
  fornecedorSugeridoId?: string; // Se já tiver no contrato
  fornecedores: Fornecedor[];
  onConfirm: (dados: {
    fornecedorId: string;
    recebedorFornecedor: string;
    dataVencimento: string;
    dataCompetencia: string;
    nf: string;
    fornecedorImpostoId?: string;
    recebedorFornecedorImposto?: string;
    dataVencimentoImposto?: string;
    dataCompetenciaImposto?: string;
    nfImposto?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function AprovarMedicaoModal({
  titulo = "Aprovar Medição",
  valorOriginal,
  valorRetencao = 0,
  dataOriginal,
  fornecedorSugeridoId = "",
  fornecedores,
  onConfirm,
  onClose
}: AprovarMedicaoModalProps) {
  const dataHoje = new Date().toISOString().split('T')[0];

  const [fornecedorId, setFornecedorId] = useState(fornecedorSugeridoId);
  const [dataVencimento, setDataVencimento] = useState(dataOriginal || dataHoje);
  const [dataCompetencia, setDataCompetencia] = useState(dataOriginal || dataHoje);
  const [nf, setNf] = useState("");
  
  // Imposto fields
  const [fornecedorImpostoId, setFornecedorImpostoId] = useState("");
  const [dataVencimentoImposto, setDataVencimentoImposto] = useState(dataOriginal || dataHoje);
  const [dataCompetenciaImposto, setDataCompetenciaImposto] = useState(dataOriginal || dataHoje);
  const [nfImposto, setNfImposto] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedorId) {
      alert("Por favor, selecione um Fornecedor/Recebedor para a Receita.");
      return;
    }
    if (!dataVencimento || !dataCompetencia) {
      alert("Datas de vencimento e competência são obrigatórias para a Receita.");
      return;
    }

    if (valorRetencao > 0) {
      if (!fornecedorImpostoId) {
        alert("Por favor, selecione um Fornecedor/Recebedor para o Imposto.");
        return;
      }
      if (!dataVencimentoImposto || !dataCompetenciaImposto) {
        alert("Datas de vencimento e competência são obrigatórias para o Imposto.");
        return;
      }
    }
    
    const fornecedorObj = fornecedores.find(f => f.id === fornecedorId);
    const recebedorFornecedor = fornecedorObj ? fornecedorObj.nome : "";

    const fornecedorImpostoObj = fornecedores.find(f => f.id === fornecedorImpostoId);
    const recebedorFornecedorImposto = fornecedorImpostoObj ? fornecedorImpostoObj.nome : "";

    try {
      setIsSubmitting(true);
      await onConfirm({
        fornecedorId,
        recebedorFornecedor,
        dataVencimento,
        dataCompetencia,
        nf,
        ...(valorRetencao > 0 && {
          fornecedorImpostoId,
          recebedorFornecedorImposto,
          dataVencimentoImposto,
          dataCompetenciaImposto,
          nfImposto
        })
      });
    } catch (err: any) {
      alert("Erro ao aprovar medição: " + (err.message || err.toString()));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onClose} disabled={isSubmitting} className="hover:bg-white/20 p-1.5 rounded-full transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 max-h-[85vh]">
          <div className="p-6 space-y-6 bg-zinc-50 flex-1 overflow-y-auto">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-2">
              Você está aprovando uma medição no valor de receita de <strong>{formatCurrency(valorOriginal)}</strong>
              {valorRetencao > 0 && <span> e retenção (imposto) de <strong>{formatCurrency(valorRetencao)}</strong></span>}.
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-100 pb-2">Dados para Receita</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Fornecedor / Recebedor (Dono da Obra) *</label>
                <div className="bg-white border border-zinc-300 rounded">
                  <Combobox 
                    options={fornecedores.map(f => ({ id: f.id, label: f.nome }))} 
                    value={fornecedorId} 
                    onChange={setFornecedorId} 
                    placeholder="Selecione..." 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">Data de Vencimento *</label>
                  <input 
                    type="date" 
                    required
                    value={dataVencimento} 
                    onChange={e => setDataVencimento(e.target.value)} 
                    className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">Data de Competência *</label>
                  <input 
                    type="date" 
                    required
                    value={dataCompetencia} 
                    onChange={e => setDataCompetencia(e.target.value)} 
                    className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Nota Fiscal / Observação (Opcional)</label>
                <input 
                  type="text" 
                  value={nf} 
                  onChange={e => setNf(e.target.value)} 
                  className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  placeholder="Ex: NF 12345" 
                />
              </div>
            </div>

            {valorRetencao > 0 && (
              <div className="space-y-4 pt-4 border-t border-zinc-200">
                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider border-b border-rose-100 pb-2">Dados para Imposto (Retenção)</h3>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">Favorecido do Imposto *</label>
                  <div className="bg-white border border-zinc-300 rounded">
                    <Combobox 
                      options={fornecedores.map(f => ({ id: f.id, label: f.nome }))} 
                      value={fornecedorImpostoId} 
                      onChange={setFornecedorImpostoId} 
                      placeholder="Selecione..." 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Data de Vencimento *</label>
                    <input 
                      type="date" 
                      required
                      value={dataVencimentoImposto} 
                      onChange={e => setDataVencimentoImposto(e.target.value)} 
                      className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Data de Competência *</label>
                    <input 
                      type="date" 
                      required
                      value={dataCompetenciaImposto} 
                      onChange={e => setDataCompetenciaImposto(e.target.value)} 
                      className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">Nota Fiscal / Observação (Opcional)</label>
                  <input 
                    type="text" 
                    value={nfImposto} 
                    onChange={e => setNfImposto(e.target.value)} 
                    className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    placeholder="Ex: DARF 123" 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-zinc-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
              <Check size={16} /> 
              {isSubmitting ? "Processando..." : "Confirmar Aprovação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
