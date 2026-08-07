/**
 * Modelo de domínio do catálogo Paris Dakar — espelha 1:1 o banco Firestore.
 *
 * Regra de ouro da separação de dados:
 *   - `products/{codigo}`  → dados públicos (leitura liberada). NUNCA contém custo.
 *   - `productCosts/{codigo}` → ValorReposicao e derivados. Leitura restrita a gerência/admin.
 * Firestore não faz filtro de campo na leitura: se o custo morasse no mesmo documento,
 * qualquer visitante leria a margem da empresa via SDK. Por isso a coleção é separada.
 */

// ---------------------------------------------------------------------------
// Unidades (Unidade_Sigla vindo do ERP)
// ---------------------------------------------------------------------------

export type UnidadeSigla = 'UN' | 'PR' | 'KT' | 'JG' | 'PC' | 'LT' | 'SR' | 'PT' | 'CX' | 'MT' | 'CJ';

export interface UnidadeInfo {
  sigla: string;
  singular: string;
  plural: string;
  descricao: string;
}

// ---------------------------------------------------------------------------
// Ficha técnica dinâmica — campos que o site exige por categoria
// ---------------------------------------------------------------------------

export type CampoTipo =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean';

export interface CampoFichaTecnica {
  /** chave persistida dentro de produto.fichaTecnica */
  key: string;
  label: string;
  tipo: CampoTipo;
  /** opções para select/multiselect */
  opcoes?: string[];
  /** permite ao admin digitar valor fora da lista de opções */
  permiteValorLivre?: boolean;
  obrigatorio?: boolean;
  placeholder?: string;
  ajuda?: string;
  sufixo?: string;
  ordem: number;
  /** aparece no card resumido do site */
  destaqueNoCard?: boolean;
  /** entra nos filtros de busca do site */
  filtravel?: boolean;
}

export type GrupoCategoria =
  | 'rodas'
  | 'pneus'
  | 'kits-lift'
  | 'acessorios'
  | 'pecas'
  | 'iluminacao'
  | 'engate'
  | 'capota'
  | 'fixacao'
  | 'lubrificantes'
  | 'consumo'
  | 'usados'
  | 'outros';

export interface CategoriaCatalogo {
  /** slug normalizado — id do documento */
  slug: string;
  /** valor bruto de TipoProduto_Descricao vindo da planilha */
  nomeOriginal: string;
  /** rótulo humanizado exibido no site */
  nomeExibicao: string;
  grupo: GrupoCategoria;
  descricao?: string;
  ordem: number;
  visivelNoSite: boolean;
  /** schema de ficha técnica exigido para produtos desta categoria */
  campos: CampoFichaTecnica[];
  totalProdutos?: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

// ---------------------------------------------------------------------------
// Produto público
// ---------------------------------------------------------------------------

export type ValorFichaTecnica = string | number | boolean | string[] | null;

export interface ProdutoCatalogo {
  // --- identidade ---
  /** Produto_Codigo — id do documento e código exibido no painel e no site */
  codigo: string;
  /** Produto_Descricao */
  descricao: string;
  /** Produto_DescricaoDetalhada */
  descricaoDetalhada?: string;
  /** ProdutoMarca_Referencia */
  referencia?: string;

  // --- classificação (vem da planilha) ---
  /** TipoProduto_Descricao bruto */
  tipoProduto: string;
  /** slug derivado — aponta para categories/{slug} */
  categoriaSlug: string;
  grupo: GrupoCategoria;
  grupoProdutoCodigo?: string;

  // --- estoque e unidade ---
  /** Unidade_Sigla */
  unidade: string;
  unidadeLabel: string;
  /** ProdutoEstoque_QtdeDisponivel */
  quantidade: number;
  localizacao?: string;
  estoqueDescricao?: string;
  empresa?: string;

  // --- preço público ---
  /** ValorVenda — preço exibido no site */
  valorVenda: number;

  // --- controle de publicação ---
  /** intenção do administrador (botão "Ativar produto no site") */
  ativoManual: boolean;
  /** estado efetivo: ativoManual && quantidade > 0. Único campo lido pelo site. */
  ativo: boolean;
  /** motivo da última mudança de estado — auditoria */
  motivoInativacao?: 'estoque-zerado' | 'desativado-manualmente' | null;

  // --- conteúdo manual (nunca sobrescrito pela importação) ---
  fichaTecnica: Record<string, ValorFichaTecnica>;
  /** marcas de veículo atendidas — um produto pode atender várias */
  marcasAtendidas: string[];
  modelosAtendidos: string[];
  imagens: string[];
  badge?: string;
  /** aparece na aba "Promoção" do site */
  promocao?: boolean;
  /** rótulo livre da campanha, ex: "Dia dos Pais" */
  promoTipo?: string;
  /** entra no carrossel da aba "Destaque" */
  destaque?: boolean;
  /** percentual de completude da ficha técnica (0-100) */
  fichaCompleta?: number;

  // --- auditoria ---
  criadoEm: string;
  atualizadoEm: string;
  importadoEm?: string;
  ultimaImportacaoId?: string;
  atualizadoPor?: string;
}

/** Documento restrito — apenas gerência/admin lê. */
export interface ProdutoCusto {
  codigo: string;
  /** ValorReposicao */
  valorReposicao: number;
  valorPublicoSugerido?: number;
  valorGarantia?: number;
  atualizadoEm: string;
  ultimaImportacaoId?: string;
}

// ---------------------------------------------------------------------------
// Importação da planilha
// ---------------------------------------------------------------------------

/** Colunas exigidas no arquivo do ERP (RPR053 — Lista de Preço). */
export const COLUNAS_PLANILHA = {
  empresa: 'Empresa_Nome',
  estoque: 'Estoque_Descricao',
  tipoProduto: 'TipoProduto_Descricao',
  codigo: 'Produto_Codigo',
  descricao: 'Produto_Descricao',
  referencia: 'ProdutoMarca_Referencia',
  descricaoDetalhada: 'Produto_DescricaoDetalhada',
  localizacao: 'LocalizacaoProduto_Identificad',
  unidade: 'Unidade_Sigla',
  grupoProduto: 'GrupoProduto_Codigo',
  quantidade: 'ProdutoEstoque_QtdeDisponivel',
  valorPublicoSugerido: 'ValorPublicoSugerido',
  valorGarantia: 'ValorGarantia',
  valorReposicao: 'ValorReposicao',
  valorVenda: 'ValorVenda'
} as const;

/** Colunas sem as quais a importação é abortada. */
export const COLUNAS_OBRIGATORIAS: string[] = [
  COLUNAS_PLANILHA.codigo,
  COLUNAS_PLANILHA.descricao,
  COLUNAS_PLANILHA.tipoProduto,
  COLUNAS_PLANILHA.unidade,
  COLUNAS_PLANILHA.quantidade,
  COLUNAS_PLANILHA.valorReposicao,
  COLUNAS_PLANILHA.valorVenda
];

export interface LinhaPlanilha {
  codigo: string;
  descricao: string;
  descricaoDetalhada: string;
  referencia: string;
  tipoProduto: string;
  unidade: string;
  quantidade: number;
  valorReposicao: number;
  valorVenda: number;
  valorPublicoSugerido: number;
  valorGarantia: number;
  localizacao: string;
  grupoProdutoCodigo: string;
  estoqueDescricao: string;
  empresa: string;
  /** número da linha no arquivo, para relatório de erro */
  linha: number;
}

export type AcaoImportacao = 'criado' | 'atualizado' | 'inalterado' | 'desativado' | 'reativado' | 'rejeitado';

export interface ResultadoLinha {
  codigo: string;
  descricao: string;
  acao: AcaoImportacao;
  detalhe?: string;
  quantidadeAnterior?: number;
  quantidadeNova?: number;
  valorVendaAnterior?: number;
  valorVendaNovo?: number;
}

export interface ResultadoImportacao {
  id: string;
  arquivo: string;
  iniciadoEm: string;
  concluidoEm?: string;
  executadoPor: string;
  totalLinhas: number;
  criados: number;
  atualizados: number;
  inalterados: number;
  desativados: number;
  reativados: number;
  rejeitados: number;
  /** produtos que existiam no banco e não vieram na planilha */
  ausentesNaPlanilha: string[];
  categoriasCriadas: string[];
  erros: string[];
  linhas: ResultadoLinha[];
}

export interface OpcoesImportacao {
  /** desativa no site produtos que existem no banco mas sumiram da planilha */
  desativarAusentes: boolean;
  /** sobrescreve a descrição manual pela descrição do ERP */
  sobrescreverDescricao: boolean;
  /** simula sem gravar nada */
  simulacao: boolean;
}

export const OPCOES_IMPORTACAO_PADRAO: OpcoesImportacao = {
  desativarAusentes: true,
  sobrescreverDescricao: true,
  simulacao: false
};

// ---------------------------------------------------------------------------
// Precificação
// ---------------------------------------------------------------------------

/** Teto de desconto à vista permitido pela diretoria. */
export const DESCONTO_MAXIMO_AVISTA = 8;

export interface SimulacaoDesconto {
  valorVenda: number;
  percentualSolicitado: number;
  /** percentual efetivamente aplicado após o teto de 8% */
  percentualAplicado: number;
  /** true quando o percentual solicitado foi cortado pelo teto */
  limitadoPeloTeto: boolean;
  valorDesconto: number;
  valorFinal: number;
  /** campos abaixo só são preenchidos para gerência/admin */
  valorReposicao?: number;
  margemBruta?: number;
  margemPercentual?: number;
  abaixoDoCusto?: boolean;
}

// ---------------------------------------------------------------------------
// Papéis
// ---------------------------------------------------------------------------

/** `gerencia` e `senior` enxergam ValorReposicao; `admin` opera o catálogo sem ver custo. */
export type PapelUsuario = 'senior' | 'gerencia' | 'admin' | 'b2b' | 'b2c' | 'visitante';

export const PAPEIS_COM_ACESSO_A_CUSTO: PapelUsuario[] = ['senior', 'gerencia'];
export const PAPEIS_ADMINISTRATIVOS: PapelUsuario[] = ['senior', 'gerencia', 'admin'];
