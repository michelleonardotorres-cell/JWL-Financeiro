import { Obra, Fornecedor, Lancamento, Contrato } from "./types";

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

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
  // Novos lançamentos baseados na imagem
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
  // Receitas
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

  // Despesas Materiais
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

  // Despesas Mão de Obra
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

  // Equipamentos
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

  // Impostos
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

  // Atrasados
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

