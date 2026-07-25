import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import { lancamentosApi, contratosApi } from "../apiClient";

interface AnexosModalProps {
  entityId: string;
  entityType?: 'lancamento' | 'contrato';
  onClose: () => void;
}

export function AnexosModal({ entityId, entityType = 'lancamento', onClose }: AnexosModalProps) {
  const [anexos, setAnexos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAnexos();
  }, [entityId]);

  const api = entityType === 'contrato' ? contratosApi : lancamentosApi;

  const fetchAnexos = async () => {
    setLoading(true);
    try {
      const data = await api.getAnexos(entityId);
      setAnexos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;
      
      setUploading(true);
      try {
        const newData = await api.addAnexo(entityId, {
          nome: file.name,
          tipo: file.type,
          base64: base64
        });
        setAnexos(newData);
      } catch (e) {
        console.error(e);
        alert("Erro ao enviar anexo.");
      } finally {
        setUploading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async (anexoId: string) => {
    if (!confirm("Remover este anexo?")) return;
    setUploading(true);
    try {
      const newData = await api.removeAnexo(entityId, anexoId);
      setAnexos(newData);
    } catch (e) {
      console.error(e);
      alert("Erro ao remover anexo.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAnexo = (e: React.MouseEvent, anexo: any) => {
    e.preventDefault();
    if (!anexo.base64) {
      if (anexo.url) window.open(anexo.url, '_blank');
      return;
    }
    
    fetch(anexo.base64)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      })
      .catch(err => {
        console.error(err);
        const a = document.createElement("a");
        a.href = anexo.base64;
        a.download = anexo.name || "anexo";
        a.click();
      });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-3">
          <h3 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
            <Paperclip size={20} className="text-indigo-600" />
            Anexos
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 min-h-[150px]">
          {loading ? (
            <div className="text-center text-sm text-zinc-500 mt-10">Carregando anexos...</div>
          ) : anexos.length === 0 ? (
            <div className="text-center text-sm text-zinc-500 mt-10 flex flex-col items-center gap-2">
              <FileText size={32} className="text-zinc-300" />
              Nenhum anexo encontrado.
            </div>
          ) : (
            <ul className="space-y-2">
              {anexos.map(anexo => (
                <li key={anexo.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <a 
                    href="#" 
                    onClick={(e) => handleOpenAnexo(e, anexo)}
                    className="flex items-center gap-3 overflow-hidden group w-full cursor-pointer"
                  >
                    {anexo.mediaType?.includes('image') ? (
                      <ImageIcon size={20} className="text-emerald-500 shrink-0" />
                    ) : (
                      <FileText size={20} className="text-indigo-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-zinc-700 truncate group-hover:text-indigo-600 transition-colors block">
                      {anexo.name}
                    </span>
                  </a>
                  <button 
                    onClick={() => handleRemove(anexo.id)}
                    disabled={uploading}
                    className="p-1.5 text-rose-500 hover:bg-rose-100 rounded transition-colors disabled:opacity-50 ml-2 shrink-0"
                    title="Excluir anexo"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors text-indigo-700 font-medium text-sm disabled:opacity-50">
            <Upload size={18} />
            {uploading ? "Processando..." : "Selecionar arquivo"}
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              disabled={uploading} 
              accept="image/*,application/pdf"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
