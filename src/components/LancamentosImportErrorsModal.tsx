import React, { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { Obra, Fornecedor, Recebedor } from "../types";

export interface ImportError {
  rowIndex: number;
  data: any;
  errors: string[];
}

interface Props {
  errors: ImportError[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  recebedores: Recebedor[];
  onRetry: (correctedData: any[]) => void;
  onClose: () => void;
}

export default function LancamentosImportErrorsModal({ errors, obras, fornecedores, recebedores, onRetry, onClose }: Props) {
  const [correctedData, setCorrectedData] = useState<any[]>(errors.map(e => e.data));

  const handleChange = (index: number, field: string, value: string) => {
    const newData = [...correctedData];
    newData[index] = { ...newData[index], [field]: value };
    setCorrectedData(newData);
  };

  // Combine fornecedores and recebedores for the dropdown
  const pessoas = [...fornecedores, ...recebedores];
  // Deduplicate by name
  const uniquePessoas = Array.from(new Map(pessoas.map(p => [p.nome, p])).values());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] rounded border border-zinc-300">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-red-50">
          <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertCircle size={24} />
            Inconsistências na Importação de Lançamentos ({errors.length} linhas)
          </h2>
          <div className="flex gap-2">
            <button onClick={() => onRetry(correctedData)} className="px-4 py-1.5 flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white rounded shadow-sm text-sm font-semibold transition-colors">
              <Check size={16} /> Importar Corrigidos
            </button>
            <button onClick={onClose} className="px-4 py-1.5 flex items-center gap-2 bg-zinc-500 hover:bg-zinc-600 text-white rounded shadow-sm text-sm font-semibold transition-colors">
              <X size={16} /> Cancelar Linhas
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-zinc-50">
          <p className="text-zinc-600 mb-4 text-sm">
            As linhas abaixo apresentaram dados inválidos, como "Centro de Custo" ou "Recebedor/Fornecedor" que não existem no banco de dados. 
            Você pode corrigir os valores abaixo selecionando as opções corretas e tentar importar novamente.
          </p>

          <div className="bg-white border border-zinc-200 shadow-sm rounded overflow-hidden">
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
        </div>
      </div>
    </div>
  );
}
