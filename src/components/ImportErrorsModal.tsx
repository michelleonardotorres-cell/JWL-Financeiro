import React, { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";

export interface ImportError {
  rowIndex: number;
  data: any;
  errors: string[];
}

interface Props {
  errors: ImportError[];
  onRetry: (correctedData: any[]) => void;
  onClose: () => void;
}

export default function ImportErrorsModal({ errors, onRetry, onClose }: Props) {
  // Inicializamos o estado com os dados que falharam
  const [correctedData, setCorrectedData] = useState<any[]>(errors.map(e => e.data));

  const handleChange = (index: number, field: string, value: string) => {
    const newData = [...correctedData];
    newData[index] = { ...newData[index], [field]: value };
    setCorrectedData(newData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] rounded border border-zinc-300">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-red-50">
          <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertCircle size={24} />
            Inconsistências na Importação ({errors.length} linhas)
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
            As linhas abaixo apresentaram dados inválidos ou ausentes (como CNPJ/CPF incorreto ou Nome vazio). 
            Você pode corrigir os valores abaixo e tentar importar novamente.
          </p>

          <div className="bg-white border border-zinc-200 shadow-sm rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700">
                  <th className="p-2 font-medium w-12 text-center">Linha</th>
                  <th className="p-2 font-medium">Nome / Razão Social</th>
                  <th className="p-2 font-medium w-40">Tipo</th>
                  <th className="p-2 font-medium w-48">CNPJ / CPF</th>
                  <th className="p-2 font-medium">Erros Encontrados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {errors.map((err, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2 text-center font-bold text-zinc-500">{err.rowIndex}</td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={correctedData[idx]['Nome / Razão Social'] || ''} 
                        onChange={e => handleChange(idx, 'Nome / Razão Social', e.target.value)}
                        className="w-full p-1 border border-zinc-300 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <select 
                        value={correctedData[idx]['Tipo'] || ''}
                        onChange={e => handleChange(idx, 'Tipo', e.target.value)}
                        className="w-full p-1 border border-zinc-300 rounded focus:border-blue-500 focus:outline-none bg-white"
                      >
                        <option value="">Selecione</option>
                        <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                        <option value="Pessoa Física">Pessoa Física</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={correctedData[idx]['CNPJ/CPF'] || ''} 
                        onChange={e => handleChange(idx, 'CNPJ/CPF', e.target.value)}
                        placeholder="Apenas números..."
                        className="w-full p-1 border border-zinc-300 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2 text-red-600 text-xs font-medium">
                      <ul className="list-disc pl-4">
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
