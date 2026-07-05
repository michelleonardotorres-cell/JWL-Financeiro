import { Obra, Fornecedor, Lancamento, Contrato } from "./types";

// Polyfill for randomUUID if not available in older browsers
function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
}

// Helper to handle API requests
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // In development, Vite will use relative paths correctly, or in production Vercel handles it
  const url = `/api/${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API Client] Error on ${url}:`, error);
    throw error;
  }
}

// Obras
export const obrasApi = {
  getAll: () => apiFetch<Obra[]>("obras"),
  create: (obra: Omit<Obra, "id">) => {
    const id = generateId("o");
    return apiFetch<Obra>("obras", { method: "POST", body: JSON.stringify({ ...obra, id }) });
  },
  update: (obra: Obra) => apiFetch<Obra>("obras", { method: "PUT", body: JSON.stringify(obra) }),
  delete: (id: string) => apiFetch<{ok: boolean}>(`obras?id=${id}`, { method: "DELETE" })
};

// Fornecedores
export const fornecedoresApi = {
  getAll: () => apiFetch<Fornecedor[]>("fornecedores"),
  create: (fornecedor: Omit<Fornecedor, "id">) => {
    const id = generateId("f");
    return apiFetch<Fornecedor>("fornecedores", { method: "POST", body: JSON.stringify({ ...fornecedor, id }) });
  },
  update: (fornecedor: Fornecedor) => apiFetch<Fornecedor>("fornecedores", { method: "PUT", body: JSON.stringify(fornecedor) }),
  delete: (id: string) => apiFetch<{ok: boolean}>(`fornecedores?id=${id}`, { method: "DELETE" })
};

// Recebedores
export const recebedoresApi = {
  getAll: () => apiFetch<Fornecedor[]>("recebedores"),
  create: (recebedor: Omit<Fornecedor, "id">) => {
    const id = generateId("r");
    return apiFetch<Fornecedor>("recebedores", { method: "POST", body: JSON.stringify({ ...recebedor, id }) });
  },
  update: (recebedor: Fornecedor) => apiFetch<Fornecedor>("recebedores", { method: "PUT", body: JSON.stringify(recebedor) }),
  delete: (id: string) => apiFetch<{ok: boolean}>(`recebedores?id=${id}`, { method: "DELETE" })
};

// Lancamentos
export const lancamentosApi = {
  getAll: async () => {
    const res = await apiFetch<any>("lancamentos");
    if (Array.isArray(res)) return res;
    return res?.data || [];
  },
  getPaginated: async (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const res = await apiFetch<any>(`lancamentos?${searchParams.toString()}`);
    if (Array.isArray(res)) {
      return { data: res, totalItems: res.length, totais: { entradas: 0, saidas: 0 } };
    }
    return {
      data: res?.data || [],
      totalItems: res?.totalItems || 0,
      totais: res?.totais || { entradas: 0, saidas: 0 }
    };
  },
  create: (lancamento: Omit<Lancamento, "id">) => {
    const id = generateId("l");
    return apiFetch<Lancamento>("lancamentos", { method: "POST", body: JSON.stringify({ ...lancamento, id }) });
  },
  update: (lancamento: Lancamento) => apiFetch<Lancamento>("lancamentos", { method: "PUT", body: JSON.stringify(lancamento) }),
  batchPay: (ids: string[]) => apiFetch<{success: boolean, count: number}>("lancamentos", { method: "PATCH", body: JSON.stringify({ ids }) }),
  delete: (id: string) => apiFetch<{ok: boolean}>(`lancamentos?id=${id}`, { method: "DELETE" })
};

// Contratos
export const contratosApi = {
  getAll: () => apiFetch<Contrato[]>("contratos"),
  create: (contrato: Omit<Contrato, "id">) => {
    const id = generateId("c");
    return apiFetch<Contrato>("contratos", { method: "POST", body: JSON.stringify({ ...contrato, id }) });
  },
  update: (contrato: Contrato) => apiFetch<Contrato>("contratos", { method: "PUT", body: JSON.stringify(contrato) }),
  delete: (id: string) => apiFetch<{ok: boolean}>(`contratos?id=${id}`, { method: "DELETE" })
};
