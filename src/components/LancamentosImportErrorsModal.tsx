import React, { useState } from "react";
import { AlertCircle, Check, X, CheckCircle2 } from "lucide-react";
import { Obra, Fornecedor, Recebedor } from "../types";

export interface ImportError {
  rowIndex: number;
  data: any;
  errors: string[];
}

interface Props {
  validCount: number;
  errors: ImportError[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  recebedores: Recebedor[];
  isImporting: boolean;
  onConfirm: (correctedData: any[], importValidOnly?: boolean) => void;
  onClose: () => void;
}

export default function LancamentosImportErrorsModal({ validCount, errors, obras, fornecedores, recebedores, isImporting, onConfirm, onClose }: Props) {
  const [correctedData, setCorrectedData] = useState<any[]>(errors.map(e => e.data));

  React.useEffect(() => {
    setCorrectedData(errors.map(e => e.data));
  }, [errors]);

  const handleChange = (index: number, field: string, value: string) => {
    const newData = [...correctedData];
    newData[index] = { ...newData[index], [field]: value };
    setCorrectedData(newData);
  };

  // Combine fornecedores and recebedores for the dropdown
  const pessoas = [...fornecedores, ...recebedores];
  // Deduplicate by name
  const uniquePessoas = Array.from(new Map(pessoas.map(p => [p.nome, p])).values());

  const totalToImport = validCount + correctedData.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] rounded border border-zinc-300">
        <div className={`p-4 border-b border-zinc-200 flex justify-between items-center ${errors.length > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${errors.length > 0 ? 'text-orange-700' : 'text-green-700'}`}>
            {errors.length > 0 ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
            Resumo da Importação
          </h2>
          <div className="flex gap-2">
            {errors.length > 0 && validCount > 0 && (
              <button disabled={isImporting} onClick={() => onConfirm([], true)} className="px-4 py-1.5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded shadow-sm text-sm font-semibold transition-colors">
                <Check size={16} /> Importar Apenas Válidos ({validCount})
              </button>
            )}
            <button disabled={isImporting} onClick={() => onConfirm(correctedData)} className="px-4 py-1.5 flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] disabled:opacity-50 text-white rounded shadow-sm text-sm font-semibold transition-colors">
              <Check size={16} /> {isImporting ? 'Salvando...' : `Confirmar Importação (${errors.length > 0 ? 'Corrigidos + Válidos' : 'Tudo'})`}
            </button>
            <button disabled={isImporting} onClick={onClose} className="px-4 py-1.5 flex items-center gap-2 bg-zinc-500 hover:bg-zinc-600 disabled:opacity-50 text-white rounded shadow-sm text-sm font-semibold transition-colors">
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-zinc-50">
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-700 bg-green-100/50 p-3 rounded-lg border border-green-200">
              <CheckCircle2 size={20} />
              <span className="font-medium">{validCount} linhas prontas para importação.</span>
            </div>
            {errors.length > 0 && (
              <div className="flex items-center gap-2 text-orange-700 bg-orange-100/50 p-3 rounded-lg border border-orange-200">
                <AlertCircle size={20} />
                <span className="font-medium">{errors.length} linhas apresentam inconsistências e precisam ser corrigidas abaixo:</span>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-white border border-zinc-200 shadow-sm rounded overflow-hidden mt-4">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700">
                    <th className="p-2 font-medium w-12 text-center">Linha</th>
                    <th className="p-2 font-medium w-48">Centro de Custo</th>
                    <th className="p-2 font-medium w-48">Recebedor/Fornecedor</th>
                    <th className="p-2 font-medium">Descrição</th>
                    <th className="p-2 font-medium w-24">Valor</th>
                    <th className="p-2 font-medium w-48">Erros Encontrados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {errors.map((err, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 text-center font-bold text-zinc-500">{err.rowIndex}</td>
                      <td className="p-2">
                        <select 
                          value={correctedData[idx]['Centro de Custo'] || ''}
                          onChange={e => handleChange(idx, 'Centro de Custo', e.target.value)}
                          className="w-full p-1 border border-zinc-300 rounded focus:border-blue-500 focus:outline-none bg-white text-xs"
                        >
                          <option value="">Selecione a Obra...</option>
                          {obras.map(obra => (
                            <option key={obra.id} value={obra.nome}>{obra.nome}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select 
                          value={correctedData[idx]['Recebedor/Fornecedor'] || ''}
                          onChange={e => handleChange(idx, 'Recebedor/Fornecedor', e.target.value)}
                          className="w-full p-1 border border-zinc-300 rounded focus:border-blue-500 focus:outline-none bg-white text-xs"
                        >
                          <option value="">Selecione o Fornecedor...</option>
                          {uniquePessoas.map(pessoa => (
                            <option key={pessoa.id} value={pessoa.nome}>{pessoa.nome}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={correctedData[idx]['Descrição'] || ''} 
                          onChange={e => handleChange(idx, 'Descrição', e.target.value)}
                          className="w-full p-1 border border-zinc-300 rounded focus:border-blue-500 focus:outline-none text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={correctedData[idx]['Valor'] || ''} 
                          onChange={e => handleChange(idx, 'Valor', e.target.value)}
                          className="w-full p-1 border border-zinc-300 rounded focus:border-blue-500 focus:outline-none text-xs"
                        />
                      </td>
                      <td className="p-2 text-red-600 text-xs font-medium">
                        <ul className="list-disc pl-4 max-w-[200px] break-words">
                          {err.errors.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
