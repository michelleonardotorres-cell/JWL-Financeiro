export type Obra = {
  id: string;
  nome: string;
  status: "Em Andamento" | "Concluída" | "Planejamento";
};

export type Categoria =
  | "Materiais"
  | "Mão de Obra"
  | "Equipamentos"
  | "Impostos"
  | "Despesas Administrativas"
  | "Receitas de Vendas"
  | "Outras Receitas";

export type Fornecedor = {
  id: string;
  nome: string;
  cnpj: string;
};

export type Lancamento = {
  id: string;
  dataCompetencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: string;
  nf?: string;
  descricao: string;
  valor: number;
  tipo: "Receita" | "Despesa";
  categoria: Categoria | string;
  tipoLancamento?: string;
  subtipo?: string;
  obraId?: string;
  fornecedorId?: string;
  recebedorFornecedor?: string;
  contratoId?: string;
  status: "Aberto" | "Pago" | "Atrasado";
};

export type Contrato = {
  id: string;
  descricao: string;
  valorPrevisto: number;
  tipo: "Receita" | "Despesa";
  categoria: Categoria | string;
  tipoLancamento?: string;
  subtipo?: string;
  obraId?: string;
  fornecedorId?: string;
  recebedorFornecedor?: string;
  diaVencimento: number;
  ativo: boolean;
};
