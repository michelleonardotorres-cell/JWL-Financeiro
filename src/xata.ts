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
      { name: "nomeFantasia", type: "string" },
      { name: "cnpj", type: "string" },
      { name: "cpf", type: "string" },
      { name: "tipoPessoa", type: "string" },
      { name: "isCliente", type: "bool" },
      { name: "ativo", type: "bool" },
      { name: "inscricaoEstadual", type: "string" },
      { name: "inscricaoMunicipal", type: "string" },
      { name: "telefone1", type: "string" },
      { name: "telefone2", type: "string" },
      { name: "email", type: "string" },
      { name: "qualificacao", type: "int" },
      { name: "cep", type: "string" },
      { name: "endereco", type: "string" },
      { name: "numero", type: "string" },
      { name: "complemento", type: "string" },
      { name: "bairro", type: "string" },
      { name: "estado", type: "string" },
      { name: "cidade", type: "string" },
      { name: "comentario", type: "text" },
      { name: "segmento", type: "string" },
      { name: "contaBancaria", type: "string" },
      { name: "contato1Nome", type: "string" },
      { name: "contato1Email", type: "string" },
      { name: "contato1Cargo", type: "string" },
      { name: "contato1Telefone", type: "string" },
      { name: "contato1Aniversario", type: "string" },
      { name: "contato2Nome", type: "string" },
      { name: "contato2Email", type: "string" },
      { name: "contato2Cargo", type: "string" },
      { name: "contato2Telefone", type: "string" },
      { name: "contato2Aniversario", type: "string" },
      { name: "dadosBancarios", type: "string" },
      { name: "funcao", type: "string" },
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
