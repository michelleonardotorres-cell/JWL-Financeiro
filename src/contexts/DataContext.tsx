import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Obra, Fornecedor, Recebedor, Lancamento, Contrato } from "../types";
import { obrasApi, fornecedoresApi, recebedoresApi, lancamentosApi, contratosApi } from "../apiClient";

interface DataContextType {
  obras: Obra[];
  fornecedores: Fornecedor[];
  recebedores: Recebedor[];
  lancamentos: Lancamento[];
  contratos: Contrato[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  
  // Mutations
  addObra: (obra: Omit<Obra, "id">) => Promise<Obra>;
  updateObra: (obra: Obra) => Promise<Obra>;
  deleteObra: (id: string) => Promise<void>;
  
  addFornecedor: (fornecedor: Omit<Fornecedor, "id">) => Promise<Fornecedor>;
  updateFornecedor: (fornecedor: Fornecedor) => Promise<Fornecedor>;
  deleteFornecedor: (id: string) => Promise<void>;
  
  addRecebedor: (recebedor: Omit<Recebedor, "id">) => Promise<Recebedor>;
  updateRecebedor: (recebedor: Recebedor) => Promise<Recebedor>;
  deleteRecebedor: (id: string) => Promise<void>;
  
  addLancamento: (lancamento: Omit<Lancamento, "id">) => Promise<Lancamento>;
  updateLancamento: (lancamento: Lancamento) => Promise<Lancamento>;
  deleteLancamento: (id: string) => Promise<void>;
  
  addContrato: (contrato: Omit<Contrato, "id">) => Promise<Contrato>;
  updateContrato: (contrato: Contrato) => Promise<Contrato>;
  deleteContrato: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [recebedores, setRecebedores] = useState<Recebedor[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [o, f, r, l, c] = await Promise.all([
        obrasApi.getAll(),
        fornecedoresApi.getAll(),
        recebedoresApi.getAll(),
        lancamentosApi.getAll(),
        contratosApi.getAll()
      ]);
      setObras(o);
      setFornecedores(f);
      setRecebedores(r);
      setLancamentos(l);
      setContratos(c);
    } catch (err: any) {
      console.error("Failed to load initial data", err);
      setError("Erro ao carregar dados do servidor. Tente atualizar a página.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Mutation Handlers
  const addObra = async (data: Omit<Obra, "id">) => {
    const created = await obrasApi.create(data);
    setObras(prev => [...prev, created]);
    return created;
  };
  const updateObra = async (data: Obra) => {
    const updated = await obrasApi.update(data);
    setObras(prev => prev.map(o => o.id === updated.id ? updated : o));
    return updated;
  };
  const deleteObra = async (id: string) => {
    await obrasApi.delete(id);
    setObras(prev => prev.filter(o => o.id !== id));
  };

  const addFornecedor = async (data: Omit<Fornecedor, "id">) => {
    const created = await fornecedoresApi.create(data);
    setFornecedores(prev => [...prev, created]);
    return created;
  };
  const updateFornecedor = async (data: Fornecedor) => {
    const updated = await fornecedoresApi.update(data);
    setFornecedores(prev => prev.map(f => f.id === updated.id ? updated : f));
    return updated;
  };
  const deleteFornecedor = async (id: string) => {
    await fornecedoresApi.delete(id);
    setFornecedores(prev => prev.filter(f => f.id !== id));
  };

  const addRecebedor = async (data: Omit<Recebedor, "id">) => {
    const created = await recebedoresApi.create(data);
    setRecebedores(prev => [...prev, created]);
    return created;
  };
  const updateRecebedor = async (data: Recebedor) => {
    const updated = await recebedoresApi.update(data);
    setRecebedores(prev => prev.map(r => r.id === updated.id ? updated : r));
    return updated;
  };
  const deleteRecebedor = async (id: string) => {
    await recebedoresApi.delete(id);
    setRecebedores(prev => prev.filter(r => r.id !== id));
  };

  const addLancamento = async (data: Omit<Lancamento, "id">) => {
    const created = await lancamentosApi.create(data);
    setLancamentos(prev => [created, ...prev]); // Add at the top
    return created;
  };
  const updateLancamento = async (data: Lancamento) => {
    const updated = await lancamentosApi.update(data);
    setLancamentos(prev => prev.map(l => l.id === updated.id ? updated : l));
    return updated;
  };
  const deleteLancamento = async (id: string) => {
    await lancamentosApi.delete(id);
    setLancamentos(prev => prev.filter(l => l.id !== id));
  };

  const addContrato = async (data: Omit<Contrato, "id">) => {
    const created = await contratosApi.create(data);
    setContratos(prev => [...prev, created]);
    return created;
  };
  const updateContrato = async (data: Contrato) => {
    const updated = await contratosApi.update(data);
    setContratos(prev => prev.map(c => c.id === updated.id ? updated : c));
    return updated;
  };
  const deleteContrato = async (id: string) => {
    await contratosApi.delete(id);
    setContratos(prev => prev.filter(c => c.id !== id));
  };

  return (
    <DataContext.Provider value={{
      obras, fornecedores, recebedores, lancamentos, contratos, isLoading, error, refreshData,
      addObra, updateObra, deleteObra,
      addFornecedor, updateFornecedor, deleteFornecedor,
      addRecebedor, updateRecebedor, deleteRecebedor,
      addLancamento, updateLancamento, deleteLancamento,
      addContrato, updateContrato, deleteContrato
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
