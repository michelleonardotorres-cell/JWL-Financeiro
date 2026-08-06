export type Obra = {
  id: string;
  nome: string;
  cliente?: string;
  endereco?: string;
  valorContrato?: number;
  aditivo?: number;
  reajusteContrato?: number;
  status: "Em Andamento" | "Concluída" | "Planejamento";
};

export type ObraAditivo = {
  id: string;
  obraId: string;
  descricao?: string;
  valor: number;
  data?: string;
};

export type ObraReajuste = {
  id: string;
  obraId: string;
  descricao?: string;
  valor: number;
  data?: string;
};

export type ObraMedicao = {
  id: string;
  obraId: string;
  numeroMedicao: number;
  valor: number;
  valorRetencao: number;
  dataVencimento: string;
  statusAprovacao: "Pendente" | "Aprovado" | "Rejeitado";
  lancamentoReceitaId?: string;
  lancamentoImpostoId?: string;
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
  tipoPessoa?: "Pessoa Jurídica" | "Pessoa Física";
  isCliente?: boolean;
  ativo?: boolean;
  nome: string; // Used as Razão Social / Nome completo
  nomeFantasia?: string;
  cnpj?: string; // Serves as CPF if Pessoa Física, but kept distinct in form
  cpf?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  telefone1?: string;
  telefone2?: string;
  email?: string;
  qualificacao?: number; // 1 to 5
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  estado?: string;
  cidade?: string;
  comentario?: string;
  segmento?: string;
  contaBancaria?: string;
  // Contato 1
  contato1Nome?: string;
  contato1Email?: string;
  contato1Cargo?: string;
  contato1Telefone?: string;
  contato1Aniversario?: string;
  // Contato 2
  contato2Nome?: string;
  contato2Email?: string;
  contato2Cargo?: string;
  contato2Telefone?: string;
  contato2Aniversario?: string;
  
  // Kept for backward compatibility
  dadosBancarios?: string;
  funcao?: string;
};

export type Recebedor = Fornecedor;

export type Lancamento = {
  id: string;
  dataCompetencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: string;
  nf?: string;
  descricao: string;
  valor: number;
  valorPago?: number;
  jurosMulta?: number;
  tipo: "Receita" | "Despesa";
  categoria: Categoria | string;
  tipoLancamento?: string;
  obraId?: string;
  fornecedorId?: string;
  recebedorFornecedor?: string;
  contratoId?: string;
  status: "Aberto" | "Pago" | "Atrasado";
  lancamentoPaiId?: string | null;
  parcelas?: { id: string; status: string; dataVencimento: string }[];
  anexos?: any[];
  anexosCount?: number;
};

export type Contrato = {
  id: string;
  descricao: string;
  valorPrevisto: number; // mantido por compatibilidade
  valorTotal?: number;
  dataInicio?: string;
  dataTermino?: string;
  tipo: "Receita" | "Despesa";
  categoria: Categoria | string;
  tipoLancamento?: string;
  obraId?: string;
  fornecedorId?: string;
  recebedorFornecedor?: string;
  diaVencimento: number;
  ativo: boolean; // mantido por compatibilidade
  status?: string; // "Ativo", "Finalizado", "Cancelado"
  anexosCount?: number;
};

export type ContratoParcela = {
  id: string;
  contratoId: string;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  lancamentoId?: string;
};

export type Orcamento = {
  id: string;
  obraId: string;
  taxaBdi?: number;
  dataCriacao?: string;
  itens?: OrcamentoItem[];
};

export type OrcamentoItem = {
  id: string;
  orcamentoId: string;
  parentId?: string | null;
  codigo?: string;
  descricao: string;
  unidade?: string;
  quantidade?: number;
  valorUnitMo?: number;
  valorUnitMat?: number;
  bdiItem?: number;
  // Transients for UI calculation
  subItens?: OrcamentoItem[];
};

export type OrcamentoDetalhamento = {
  id: string;
  orcamentoItemId: string;
  tipo: "MATERIAL" | "MAO_DE_OBRA";
  descricao: string;
  fornecedor?: string;
  valor: number;
};
