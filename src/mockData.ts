import { Obra, Fornecedor, Lancamento, Contrato } from "./types";

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";
let isSyncingFromXata = false;

// Debounce helper to group multiple rapid mutations
function debounce(fn: Function, delay: number) {
  let timeoutId: any;
  return function (...args: any[]) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Map of debounced sync functions per table
const syncDebouncers: Record<string, () => void> = {
  obras: debounce(() => syncTableToXata("obras", obras), 1000),
  fornecedores: debounce(() => syncTableToXata("fornecedores", fornecedores), 1000),
  lancamentos: debounce(() => syncTableToXata("lancamentos", lancamentos), 1000),
  contratos: debounce(() => syncTableToXata("contratos", contratos), 1000),
};

function triggerXataSync(key: string) {
  if (isSyncingFromXata) return; // Prevent loops when pulling data
  if (syncDebouncers[key]) {
    syncDebouncers[key]();
  }
}

function createLocalStorageArrayProxy<T>(key: string, defaultValue: T[]): T[] {
  if (!isBrowser) {
    return defaultValue;
  }

  let rawArray: T[] = [];
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      rawArray = JSON.parse(saved);
    } else {
      rawArray = JSON.parse(JSON.stringify(defaultValue));
      localStorage.setItem(key, JSON.stringify(rawArray));
    }
  } catch (e) {
    console.error("Failed to read/write localStorage for", key, e);
    rawArray = JSON.parse(JSON.stringify(defaultValue));
  }

  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(rawArray));
      triggerXataSync(key);
    } catch (e) {
      console.error("Failed to save to localStorage for", key, e);
    }
  };

  return new Proxy(rawArray, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        const mutatingMethods = ["push", "pop", "shift", "unshift", "splice", "reverse", "sort"];
        if (mutatingMethods.includes(prop as string)) {
          return function (...args: any[]) {
            const result = value.apply(target, args);
            save();
            return result;
          };
        }
      }
      return value;
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      if (result) {
        save();
      }
      return result;
    },
    deleteProperty(target, prop) {
      const result = Reflect.deleteProperty(target, prop);
      if (result) {
        save();
      }
      return result;
    }
  });
}

const initialObras: Obra[] = [
  { id: "o1", nome: "Residencial Alpha", status: "Em Andamento" },
  { id: "o2", nome: "Edifício Beta", status: "Em Andamento" },
  { id: "o3", nome: "Condomínio Ômega", status: "Planejamento" },
];

const initialFornecedores: Fornecedor[] = [
  { id: "f1", nome: "Cimento & Cia", cnpj: "11.222.333/0001-44" },
  { id: "f2", nome: "Aço Forte S.A.", cnpj: "55.666.777/0001-88" },
  { id: "f3", nome: "Locadora de Máquinas", cnpj: "99.000.111/0001-22" },
  { id: "f4", nome: "Empreiteira Silva", cnpj: "33.444.555/0001-66" },
];

const initialLancamentos: Lancamento[] = [
  {
    id: "l18",
    dataCompetencia: "2024-11-13",
    dataVencimento: "2024-11-13",
    formaPagamento: "A VISTA",
    nf: "SN",
    recebedorFornecedor: "VALCIMAR COSTA BELTRAO",
    descricao: "50% SERVIÇO DIVISORIAIS",
    tipoLancamento: "CUSTO VARIÁVEL",
    subtipo: "MAO DE OBRA",
    valor: 550.00,
    tipo: "Despesa",
    categoria: "Mão de Obra",
    obraId: "o1",
    status: "Pago",
  },
  {
    id: "l19",
    dataCompetencia: "2024-11-13",
    dataVencimento: "2024-11-13",
    formaPagamento: "A VISTA",
    nf: "SN",
    recebedorFornecedor: "CREA - AM",
    descricao: "ART SERVIÇO TRE GALPÃO",
    tipoLancamento: "DESPESAS ADMINISTRATIVAS",
    subtipo: "TAXAS",
    valor: 99.64,
    tipo: "Despesa",
    categoria: "Despesas Administrativas",
    obraId: "o1",
    status: "Pago",
  },
  {
    id: "l20",
    dataCompetencia: "2024-11-14",
    dataVencimento: "2024-11-14",
    formaPagamento: "A VISTA",
    nf: "12345",
    recebedorFornecedor: "JOHN WELLISSON MENCONÇA TORRES",
    descricao: "COPIAS DA CHAVES",
    tipoLancamento: "DESPESAS ADMINISTRATIVAS",
    subtipo: "DESPESAS",
    valor: 30.00,
    tipo: "Despesa",
    categoria: "Despesas Administrativas",
    obraId: "o2",
    status: "Pago",
  },
  {
    id: "l1",
    dataCompetencia: "2023-10-01",
    dataVencimento: "2023-10-05",
    dataPagamento: "2023-10-05",
    descricao: "Venda Apto 101",
    valor: 350000,
    tipo: "Receita",
    categoria: "Receitas de Vendas",
    obraId: "o1",
    status: "Pago",
  },
  {
    id: "l2",
    dataCompetencia: "2023-11-01",
    dataVencimento: "2023-11-05",
    dataPagamento: "2023-11-05",
    descricao: "Venda Apto 202",
    valor: 420000,
    tipo: "Receita",
    categoria: "Receitas de Vendas",
    obraId: "o2",
    status: "Pago",
  },
  {
    id: "l3",
    dataCompetencia: "2023-12-01",
    dataVencimento: "2023-12-05",
    dataPagamento: "2023-12-05",
    descricao: "Venda Apto 303",
    valor: 380000,
    tipo: "Receita",
    categoria: "Receitas de Vendas",
    obraId: "o1",
    status: "Pago",
  },
  {
    id: "l4",
    dataCompetencia: "2024-01-01",
    dataVencimento: "2024-01-05",
    dataPagamento: "2024-01-05",
    descricao: "Venda Apto 404",
    valor: 450000,
    tipo: "Receita",
    categoria: "Receitas de Vendas",
    obraId: "o2",
    status: "Pago",
  },
  {
    id: "l5",
    dataCompetencia: "2024-02-01",
    dataVencimento: "2024-02-05",
    dataPagamento: "2024-02-05",
    descricao: "Venda Apto 505",
    valor: 360000,
    tipo: "Receita",
    categoria: "Receitas de Vendas",
    obraId: "o1",
    status: "Pago",
  },
  {
    id: "l6",
    dataCompetencia: "2024-03-01",
    dataVencimento: "2024-03-05",
    dataPagamento: "2024-03-05",
    descricao: "Venda Apto 606",
    valor: 480000,
    tipo: "Receita",
    categoria: "Receitas de Vendas",
    obraId: "o2",
    status: "Pago",
  },
  {
    id: "l7",
    dataCompetencia: "2024-03-10",
    dataVencimento: "2024-03-25",
    dataPagamento: "2024-03-25",
    descricao: "Cimento CP II",
    valor: 15000,
    tipo: "Despesa",
    categoria: "Materiais",
    obraId: "o1",
    fornecedorId: "f1",
    status: "Pago",
  },
  {
    id: "l8",
    dataCompetencia: "2024-03-15",
    dataVencimento: "2024-04-05",
    descricao: "Vergalhões 10mm",
    valor: 28000,
    tipo: "Despesa",
    categoria: "Materiais",
    obraId: "o2",
    fornecedorId: "f2",
    status: "Aberto",
  },
  {
    id: "l9",
    dataCompetencia: "2024-03-20",
    dataVencimento: "2024-04-10",
    descricao: "Areia e Brita",
    valor: 8500,
    tipo: "Despesa",
    categoria: "Materiais",
    obraId: "o1",
    fornecedorId: "f1",
    status: "Aberto",
  },
  {
    id: "l10",
    dataCompetencia: "2024-03-01",
    dataVencimento: "2024-03-05",
    dataPagamento: "2024-03-05",
    descricao: "Folha de Pagamento - Março",
    valor: 45000,
    tipo: "Despesa",
    categoria: "Mão de Obra",
    obraId: "o1",
    status: "Pago",
  },
  {
    id: "l11",
    dataCompetencia: "2024-03-01",
    dataVencimento: "2024-03-05",
    dataPagamento: "2024-03-05",
    descricao: "Folha de Pagamento - Março",
    valor: 62000,
    tipo: "Despesa",
    categoria: "Mão de Obra",
    obraId: "o2",
    status: "Pago",
  },
  {
    id: "l12",
    dataCompetencia: "2024-03-15",
    dataVencimento: "2024-03-20",
    dataPagamento: "2024-03-20",
    descricao: "Empreiteira - Fundação",
    valor: 120000,
    tipo: "Despesa",
    categoria: "Mão de Obra",
    obraId: "o2",
    fornecedorId: "f4",
    status: "Pago",
  },
  {
    id: "l13",
    dataCompetencia: "2024-03-05",
    dataVencimento: "2024-03-15",
    dataPagamento: "2024-03-15",
    descricao: "Locação de Grua",
    valor: 18000,
    tipo: "Despesa",
    categoria: "Equipamentos",
    obraId: "o2",
    fornecedorId: "f3",
    status: "Pago",
  },
  {
    id: "l14",
    dataCompetencia: "2024-03-25",
    dataVencimento: "2024-04-05",
    descricao: "Locação de Betoneiras",
    valor: 5400,
    tipo: "Despesa",
    categoria: "Equipamentos",
    obraId: "o1",
    fornecedorId: "f3",
    status: "Aberto",
  },
  {
    id: "l15",
    dataCompetencia: "2024-02-28",
    dataVencimento: "2024-03-20",
    dataPagamento: "2024-03-20",
    descricao: "ISS",
    valor: 12500,
    tipo: "Despesa",
    categoria: "Impostos",
    obraId: "o1",
    status: "Pago",
  },
  {
    id: "l16",
    dataCompetencia: "2024-03-31",
    dataVencimento: "2024-04-20",
    descricao: "ISS",
    valor: 15800,
    tipo: "Despesa",
    categoria: "Impostos",
    obraId: "o2",
    status: "Aberto",
  },
  {
    id: "l17",
    dataCompetencia: "2024-02-15",
    dataVencimento: "2024-03-01",
    descricao: "Aço Estrutural",
    valor: 32000,
    tipo: "Despesa",
    categoria: "Materiais",
    obraId: "o2",
    fornecedorId: "f2",
    status: "Atrasado",
  },
];

const initialContratos: Contrato[] = [
  {
    id: "c1",
    descricao: "Aluguel Trator",
    valorPrevisto: 15000,
    tipo: "Despesa",
    categoria: "Equipamentos",
    tipoLancamento: "CUSTO FIXO",
    subtipo: "ALUGUEL",
    obraId: "o1",
    recebedorFornecedor: "Locadora de Máquinas",
    diaVencimento: 10,
    ativo: true,
  },
  {
    id: "c2",
    descricao: "Conta de Água",
    valorPrevisto: 350,
    tipo: "Despesa",
    categoria: "Despesas Administrativas",
    tipoLancamento: "CUSTO VARIÁVEL",
    subtipo: "CONSUMO",
    obraId: "o2",
    recebedorFornecedor: "Manaus Ambiental",
    diaVencimento: 15,
    ativo: true,
  }
];

export const obras: Obra[] = createLocalStorageArrayProxy("obras", initialObras);
export const fornecedores: Fornecedor[] = createLocalStorageArrayProxy("fornecedores", initialFornecedores);
export const lancamentos: Lancamento[] = createLocalStorageArrayProxy("lancamentos", initialLancamentos);
export const contratos: Contrato[] = createLocalStorageArrayProxy("contratos", initialContratos);

// Seed empty database tables via API routes
async function seedXata() {
  try {
    console.log("[Xata Seed] Seeding empty database tables...");
    for (const item of initialObras) {
      await fetch('/api/obras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    }
    for (const item of initialFornecedores) {
      await fetch('/api/fornecedores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    }
    for (const item of initialLancamentos) {
      await fetch('/api/lancamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    }
    for (const item of initialContratos) {
      await fetch('/api/contratos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    }
    console.log("[Xata Seed] Database successfully seeded via API!");
  } catch (err) {
    console.error("[Xata Seed] Failed to seed database:", err);
  }
}

// Perform a table diff and synchronize it to the API route
async function syncTableToXata(tableName: string, currentItems: any[]) {
  try {
    console.log(`[Xata Sync] Syncing table "${tableName}" to backend...`);
    const res = await fetch(`/api/${tableName}`);
    if (!res.ok) throw new Error("Failed to fetch current DB items");
    const dbItems = await res.json();

    // 1. Insert or Update records
    for (const item of currentItems) {
      const dbItem = dbItems.find((x: any) => x.id === item.id);
      if (!dbItem) {
        console.log(`[Xata Sync] Creating new record in ${tableName}:`, item.id);
        await fetch(`/api/${tableName}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
      } else {
        let hasChanges = false;
        for (const key of Object.keys(item)) {
          if (item[key] !== (dbItem as any)[key]) {
            hasChanges = true;
            break;
          }
        }
        if (hasChanges) {
          console.log(`[Xata Sync] Updating changed record in ${tableName}:`, item.id);
          await fetch(`/api/${tableName}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
        }
      }
    }

    // 2. Delete missing records
    for (const dbItem of dbItems) {
      if (!currentItems.some((x) => x.id === dbItem.id)) {
        console.log(`[Xata Sync] Deleting removed record from ${tableName}:`, dbItem.id);
        await fetch(`/api/${tableName}?id=${dbItem.id}`, { method: 'DELETE' });
      }
    }
    console.log(`[Xata Sync] Table "${tableName}" successfully synced!`);
  } catch (err) {
    console.error(`[Xata Sync] Error syncing table "${tableName}":`, err);
  }
}

// Pull latest records from backend and sync them down to local arrays
export async function initializeXataSync() {
  if (!isBrowser) return;

  try {
    console.log("[Xata Sync] Synchronizing schemas and tables from backend...");
    const [resObras, resFornecedores, resLancamentos, resContratos] = await Promise.all([
      fetch('/api/obras'),
      fetch('/api/fornecedores'),
      fetch('/api/lancamentos'),
      fetch('/api/contratos')
    ]);

    if (!resObras.ok) {
       console.warn("[Xata Sync] Backend not reachable. Running locally.");
       return;
    }

    const dbObras = await resObras.json();
    const dbFornecedores = await resFornecedores.json();
    const dbLancamentos = await resLancamentos.json();
    const dbContratos = await resContratos.json();

    // Check if the database has zero records (blank slate)
    if (dbObras.length === 0 && dbFornecedores.length === 0 && dbLancamentos.length === 0 && dbContratos.length === 0) {
      await seedXata();
    } else {
      isSyncingFromXata = true;

      // Overwrite local arrays in-place to preserve reactive references
      obras.length = 0;
      obras.push(...dbObras.map((x: any) => ({ id: x.id, nome: x.nome || "", status: (x.status || "Em Andamento") as Obra["status"] })));

      fornecedores.length = 0;
      fornecedores.push(...dbFornecedores.map((x: any) => ({ id: x.id, nome: x.nome || "", cnpj: x.cnpj || "" })));

      lancamentos.length = 0;
      lancamentos.push(...dbLancamentos.map((x: any) => ({
        id: x.id,
        dataCompetencia: x.dataCompetencia || "",
        dataVencimento: x.dataVencimento || "",
        dataPagamento: x.dataPagamento,
        formaPagamento: x.formaPagamento,
        nf: x.nf,
        descricao: x.descricao || "",
        valor: x.valor || 0,
        tipo: (x.tipo === "Receita" || x.tipo === "Despesa") ? x.tipo : "Despesa",
        categoria: x.categoria || "",
        tipoLancamento: x.tipoLancamento,
        subtipo: x.subtipo,
        obraId: x.obraId,
        fornecedorId: x.fornecedorId,
        recebedorFornecedor: x.recebedorFornecedor,
        contratoId: x.contratoId,
        status: (x.status === "Pago" || x.status === "Aberto" || x.status === "Atrasado") ? x.status : "Aberto"
      })));

      contratos.length = 0;
      contratos.push(...dbContratos.map((x: any) => ({
        id: x.id,
        descricao: x.descricao || "",
        valorPrevisto: x.valorPrevisto || 0,
        tipo: (x.tipo === "Receita" || x.tipo === "Despesa") ? x.tipo : "Despesa",
        categoria: x.categoria || "",
        tipoLancamento: x.tipoLancamento,
        subtipo: x.subtipo,
        obraId: x.obraId,
        fornecedorId: x.fornecedorId,
        recebedorFornecedor: x.recebedorFornecedor,
        diaVencimento: x.diaVencimento || 1,
        ativo: x.ativo !== undefined ? x.ativo : true
      })));

      // Update localStorage values
      localStorage.setItem("obras", JSON.stringify(obras));
      localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
      localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
      localStorage.setItem("contratos", JSON.stringify(contratos));

      isSyncingFromXata = false;
      console.log("[Xata Sync] Local data synchronized with cloud state.");
    }
  } catch (err) {
    console.error("[Xata Sync] Failed to initialize synchronization:", err);
  }
}
