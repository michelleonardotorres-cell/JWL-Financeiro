/// <reference types="vite/client" />
import { buildClient } from "@xata.io/client";
import type {
  BaseClientOptions,
  XataRecord,
} from "@xata.io/client";

export interface Obra {
  nome: string;
  status: string;
}
export type ObraRecord = Obra & XataRecord;

export interface Fornecedor {
  nome: string;
  cnpj: string;
}
export type FornecedorRecord = Fornecedor & XataRecord;

export interface Lancamento {
  dataCompetencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: string;
  nf?: string;
  descricao: string;
  valor: number;
  tipo: "Receita" | "Despesa";
  categoria: string;
  tipoLancamento?: string;
  subtipo?: string;
  obraId?: string;
  fornecedorId?: string;
  recebedorFornecedor?: string;
  contratoId?: string;
  status: "Aberto" | "Pago" | "Atrasado";
}
export type LancamentoRecord = Lancamento & XataRecord;

export interface Contrato {
  descricao: string;
  valorPrevisto: number;
  tipo: "Receita" | "Despesa";
  categoria: string;
  tipoLancamento?: string;
  subtipo?: string;
  obraId?: string;
  fornecedorId?: string;
  recebedorFornecedor?: string;
  diaVencimento: number;
  ativo: boolean;
}
export type ContratoRecord = Contrato & XataRecord;

const tables = [
  {
    name: "obras",
    columns: [
      { name: "nome", type: "string" },
      { name: "status", type: "string" },
    ],
  },
  {
    name: "fornecedores",
    columns: [
      { name: "nome", type: "string" },
      { name: "cnpj", type: "string" },
    ],
  },
  {
    name: "lancamentos",
    columns: [
      { name: "dataCompetencia", type: "string" },
      { name: "dataVencimento", type: "string" },
      { name: "dataPagamento", type: "string" },
      { name: "formaPagamento", type: "string" },
      { name: "nf", type: "string" },
      { name: "descricao", type: "text" },
      { name: "valor", type: "float" },
      { name: "tipo", type: "string" },
      { name: "categoria", type: "string" },
      { name: "tipoLancamento", type: "string" },
      { name: "subtipo", type: "string" },
      { name: "obraId", type: "string" },
      { name: "fornecedorId", type: "string" },
      { name: "recebedorFornecedor", type: "string" },
      { name: "contratoId", type: "string" },
      { name: "status", type: "string" },
    ],
  },
  {
    name: "contratos",
    columns: [
      { name: "descricao", type: "string" },
      { name: "valorPrevisto", type: "float" },
      { name: "tipo", type: "string" },
      { name: "categoria", type: "string" },
      { name: "tipoLancamento", type: "string" },
      { name: "subtipo", type: "string" },
      { name: "obraId", type: "string" },
      { name: "fornecedorId", type: "string" },
      { name: "recebedorFornecedor", type: "string" },
      { name: "diaVencimento", type: "int" },
      { name: "ativo", type: "bool" },
    ],
  },
] as const;

export type SchemaTables = {
  obras: ObraRecord;
  fornecedores: FornecedorRecord;
  lancamentos: LancamentoRecord;
  contratos: ContratoRecord;
};

const DatabaseClient = buildClient();

export class XataClient extends DatabaseClient<SchemaTables> {
  constructor(options?: BaseClientOptions) {
    super(
      {
        databaseURL: import.meta.env.VITE_XATA_DATABASE_URL || "",
        apiKey: import.meta.env.VITE_XATA_API_KEY || "",
        branch: import.meta.env.VITE_XATA_BRANCH || "main",
        ...options,
      },
      tables
    );
  }
}

let instance: XataClient | undefined = undefined;

export const getXataClient = () => {
  if (instance) return instance;
  instance = new XataClient();
  return instance;
};
