/**
 * Importação da planilha do ERP (RPR053 — Lista de Preço).
 *
 * Fluxo executado a cada importação, sempre lendo o arquivo inteiro:
 *   1. valida cabeçalho e aborta se faltar coluna obrigatória;
 *   2. lê e sanitiza todas as linhas;
 *   3. cria as categorias novas a partir de TipoProduto_Descricao;
 *   4. para cada código: cria, atualiza ou reativa — a ficha técnica manual nunca é tocada;
 *   5. zera estoque ⇒ produto sai do site automaticamente;
 *   6. produtos ausentes da planilha são desativados (opcional);
 *   7. grava o relatório em `imports/{id}`.
 *
 * Superfície de ataque: um .xlsx é um zip com XML dentro; arquivo grande ou malformado
 * derruba a aba do navegador e fórmulas em células viram execução no Excel de quem
 * exportar depois. Por isso: teto de tamanho, teto de linhas, leitura sem fórmulas
 * (`cellFormula: false`) e sanitização de toda string antes de persistir.
 */

import type * as XLSXTipos from 'xlsx';

import {
  AcaoImportacao,
  COLUNAS_OBRIGATORIAS,
  COLUNAS_PLANILHA,
  CategoriaCatalogo,
  LinhaPlanilha,
  OPCOES_IMPORTACAO_PADRAO,
  OpcoesImportacao,
  ProdutoCatalogo,
  ProdutoCusto,
  ResultadoImportacao,
  ResultadoLinha
} from '../types/catalog';
import {
  catalogService,
  criarProdutoDeErp,
  normalizarEstadoPublicacao,
  prepararParaGravar,
  sanitizarTexto
} from './catalogService';
import { classificarTipoProduto, rotularUnidade, slugify } from '../config/fichaTecnica';
import { paraNumero } from '../utils/pricing';

// ---------------------------------------------------------------------------
// Limites de segurança
// ---------------------------------------------------------------------------

/** 25 MB — a planilha real tem ~200 KB; acima disso é abuso ou arquivo errado. */
export const TAMANHO_MAXIMO_ARQUIVO = 25 * 1024 * 1024;
/** Teto de linhas processadas por importação. */
export const MAXIMO_LINHAS = 20_000;

const EXTENSOES_ACEITAS = ['.xlsx', '.xlsm', '.xls', '.csv'];

export class ErroImportacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroImportacao';
  }
}

function validarArquivo(arquivo: File): void {
  if (arquivo.size === 0) {
    throw new ErroImportacao('Arquivo vazio.');
  }
  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
    throw new ErroImportacao(
      `Arquivo de ${(arquivo.size / 1024 / 1024).toFixed(1)} MB excede o limite de ${
        TAMANHO_MAXIMO_ARQUIVO / 1024 / 1024
      } MB.`
    );
  }
  const nome = arquivo.name.toLowerCase();
  if (!EXTENSOES_ACEITAS.some((ext) => nome.endsWith(ext))) {
    throw new ErroImportacao(
      `Formato não aceito. Envie a planilha do ERP em ${EXTENSOES_ACEITAS.join(', ')}.`
    );
  }
}

// ---------------------------------------------------------------------------
// Leitura da planilha
// ---------------------------------------------------------------------------

export interface PlanilhaLida {
  arquivo: string;
  aba: string;
  colunas: string[];
  linhas: LinhaPlanilha[];
  erros: string[];
  totalLinhasBrutas: number;
}

/**
 * Lê o arquivo e devolve as linhas normalizadas.
 * Não grava nada — permite pré-visualizar a importação antes de confirmar.
 */
export async function lerPlanilha(arquivo: File): Promise<PlanilhaLida> {
  validarArquivo(arquivo);
  return lerPlanilhaDeBuffer(await arquivo.arrayBuffer(), arquivo.name);
}

// ---------------------------------------------------------------------------
// Mapeamento tolerante de colunas do ERP (RPR053 Lista de Preço)
// ---------------------------------------------------------------------------

const MAPEAMENTO_SINONIMOS: Record<string, string[]> = {
  codigo: ['Produto_Codigo', 'PRODUTO_CODIGO', 'Codigo', 'Código', 'Cod', 'SKU', 'ProdutoCodigo', 'ID'],
  descricao: ['Produto_Descricao', 'PRODUTO_DESCRICAO', 'Descricao', 'Descrição', 'ProdutoDescricao', 'Nome', 'Produto'],
  tipoProduto: ['TipoProduto_Descricao', 'TIPOPRODUTO_DESCRICAO', 'TipoProduto', 'Tipo_Produto', 'Categoria', 'GrupoProduto_Descricao'],
  unidade: ['Unidade_Sigla', 'UNIDADE_SIGLA', 'Unidade', 'Sigla', 'UN'],
  quantidade: ['ProdutoEstoque_QtdeDisponivel', 'PRODUTOESTOQUE_QTDEDISPONIVEL', 'QtdeDisponivel', 'Qtde_Disponivel', 'Quantidade', 'Estoque', 'Qtde'],
  valorReposicao: ['ValorReposicao', 'VALORREPOSICAO', 'Valor_Reposicao', 'Custo', 'ValorCusto', 'PrecoCusto'],
  valorVenda: ['ValorVenda', 'VALORVENDA', 'Valor_Venda', 'PrecoVenda', 'Preco', 'Preço'],
  referencia: ['ProdutoMarca_Referencia', 'Referencia', 'Referência', 'Ref'],
  descricaoDetalhada: ['Produto_DescricaoDetalhada', 'DescricaoDetalhada', 'DescriçãoDetalhada', 'Detalhes'],
  localizacao: ['LocalizacaoProduto_Identificad', 'LocalizacaoProduto_Identificacao', 'Localizacao', 'Localização'],
  grupoProduto: ['GrupoProduto_Codigo', 'GrupoProduto'],
  valorPublicoSugerido: ['ValorPublicoSugerido', 'ValorSugerido', 'PrecoSugerido'],
  valorGarantia: ['ValorGarantia', 'Garantia'],
  empresa: ['Empresa_Nome', 'Empresa'],
  estoque: ['Estoque_Descricao', 'Estoque']
};

function resolverColuna(colunasPlanilha: string[], chavePropriedade: string): string | undefined {
  const sinonimos = MAPEAMENTO_SINONIMOS[chavePropriedade] || [];
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const disponiveis = colunasPlanilha.map((col) => ({
    original: col,
    normal: normalizar(col)
  }));

  for (const s of sinonimos) {
    const sNorm = normalizar(s);
    const achado = disponiveis.find((c) => c.normal === sNorm);
    if (achado) return achado.original;
  }

  return undefined;
}

/**
 * Núcleo da leitura, sem dependência de `File` — serve tanto ao navegador quanto
 * ao script Node de importação (`scripts/import-planilha.ts`).
 */
export async function lerPlanilhaDeBuffer(
  buffer: ArrayBuffer | Uint8Array,
  nomeArquivo: string
): Promise<PlanilhaLida> {
  // Carregado sob demanda: o parser de XLSX pesa ~1 MB e só interessa a quem
  // opera a importação. Visitante do site nunca baixa este código.
  const XLSX = (await import('xlsx')) as typeof XLSXTipos;

  let workbook: XLSXTipos.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      // Fórmulas não são lidas nem repassadas adiante: célula é dado, não código.
      cellFormula: false,
      cellHTML: false,
      cellDates: false,
      dense: false
    });
  } catch (erro) {
    throw new ErroImportacao(
      `Não foi possível abrir a planilha. Verifique se o arquivo não está corrompido ou protegido por senha. (${
        (erro as Error).message
      })`
    );
  }

  const nomeAba = workbook.SheetNames.find((n) => n.toLowerCase() === 'dados') || workbook.SheetNames[0];
  if (!nomeAba) throw new ErroImportacao('A planilha não contém nenhuma aba.');

  const aba = workbook.Sheets[nomeAba];
  const bruto = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, {
    defval: '',
    raw: true,
    blankrows: false
  });

  if (bruto.length === 0) {
    throw new ErroImportacao(`A aba "${nomeAba}" não contém linhas de dados.`);
  }

  const colunas = Object.keys(bruto[0]).map((c) => c.trim());

  // Resolver mapeamentos flexíveis
  const colCodigo = resolverColuna(colunas, 'codigo');
  const colDescricao = resolverColuna(colunas, 'descricao');
  const colTipoProduto = resolverColuna(colunas, 'tipoProduto');
  const colUnidade = resolverColuna(colunas, 'unidade');
  const colQuantidade = resolverColuna(colunas, 'quantidade');
  const colValorReposicao = resolverColuna(colunas, 'valorReposicao');
  const colValorVenda = resolverColuna(colunas, 'valorVenda');
  const colReferencia = resolverColuna(colunas, 'referencia');
  const colDescricaoDetalhada = resolverColuna(colunas, 'descricaoDetalhada');
  const colLocalizacao = resolverColuna(colunas, 'localizacao');
  const colGrupoProduto = resolverColuna(colunas, 'grupoProduto');
  const colValorPublicoSugerido = resolverColuna(colunas, 'valorPublicoSugerido');
  const colValorGarantia = resolverColuna(colunas, 'valorGarantia');
  const colEmpresa = resolverColuna(colunas, 'empresa');
  const colEstoque = resolverColuna(colunas, 'estoque');

  if (!colCodigo || !colDescricao) {
    const faltantes: string[] = [];
    if (!colCodigo) faltantes.push('Produto_Codigo');
    if (!colDescricao) faltantes.push('Produto_Descricao');
    throw new ErroImportacao(
      `Planilha fora do layout esperado. Colunas obrigatórias ausentes: ${faltantes.join(', ')}. ` +
        `Exporte novamente o relatório RPR053 (Lista de Preço) do ERP.`
    );
  }

  const erros: string[] = [];
  const linhas: LinhaPlanilha[] = [];
  const codigosVistos = new Map<string, number>();

  const limite = Math.min(bruto.length, MAXIMO_LINHAS);
  if (bruto.length > MAXIMO_LINHAS) {
    erros.push(
      `Planilha com ${bruto.length} linhas; apenas as primeiras ${MAXIMO_LINHAS} foram processadas.`
    );
  }

  for (let i = 0; i < limite; i++) {
    const registro = bruto[i];
    const numeroLinha = i + 2; // +1 do índice zero, +1 do cabeçalho

    const codigo = sanitizarTexto(colCodigo ? registro[colCodigo] : '', 40);
    const descricao = sanitizarTexto(colDescricao ? registro[colDescricao] : '', 200);
    const tipoProduto = sanitizarTexto(colTipoProduto ? registro[colTipoProduto] : '', 80) || 'Outros';

    if (!codigo) {
      erros.push(`Linha ${numeroLinha}: Produto_Codigo vazio — linha ignorada.`);
      continue;
    }
    if (!descricao) {
      erros.push(`Linha ${numeroLinha} (código ${codigo}): Produto_Descricao vazia — linha ignorada.`);
      continue;
    }

    const duplicada = codigosVistos.get(codigo);
    if (duplicada) {
      erros.push(
        `Linha ${numeroLinha}: código ${codigo} repetido (já apareceu na linha ${duplicada}). ` +
          `Prevalece a última ocorrência.`
      );
    }
    codigosVistos.set(codigo, numeroLinha);

    const valorVendaNum = colValorVenda ? Math.max(0, paraNumero(registro[colValorVenda])) : 0;
    const valorReposicaoNum = colValorReposicao ? Math.max(0, paraNumero(registro[colValorReposicao])) : 0;

    linhas.push({
      codigo,
      descricao,
      descricaoDetalhada: sanitizarTexto(colDescricaoDetalhada ? registro[colDescricaoDetalhada] : '', 500) || descricao,
      referencia: sanitizarTexto(colReferencia ? registro[colReferencia] : '', 60),
      tipoProduto,
      unidade: sanitizarTexto(colUnidade ? registro[colUnidade] : '', 6).toUpperCase() || 'UN',
      quantidade: colQuantidade ? Math.max(0, paraNumero(registro[colQuantidade])) : 0,
      valorReposicao: valorReposicaoNum,
      valorVenda: valorVendaNum,
      valorPublicoSugerido: colValorPublicoSugerido ? Math.max(0, paraNumero(registro[colValorPublicoSugerido])) : 0,
      valorGarantia: colValorGarantia ? Math.max(0, paraNumero(registro[colValorGarantia])) : 0,
      localizacao: sanitizarTexto(colLocalizacao ? registro[colLocalizacao] : '', 60),
      grupoProdutoCodigo: sanitizarTexto(colGrupoProduto ? registro[colGrupoProduto] : '', 20),
      estoqueDescricao: sanitizarTexto(colEstoque ? registro[colEstoque] : '', 80),
      empresa: sanitizarTexto(colEmpresa ? registro[colEmpresa] : '', 80),
      linha: numeroLinha
    });
  }

  if (linhas.length === 0) {
    throw new ErroImportacao(
      `Nenhuma linha válida encontrada na aba "${nomeAba}". Verifique o conteúdo da planilha.`
    );
  }

  return {
    arquivo: sanitizarTexto(nomeArquivo, 120),
    aba: nomeAba,
    colunas,
    linhas,
    erros,
    totalLinhasBrutas: bruto.length
  };
}

// ---------------------------------------------------------------------------
// Aplicação da importação
// ---------------------------------------------------------------------------

export interface ProgressoImportacao {
  etapa: 'lendo' | 'categorias' | 'comparando' | 'gravando' | 'desativando' | 'finalizando' | 'concluido';
  mensagem: string;
  atual: number;
  total: number;
}

/** Campos que a planilha manda e a importação sobrescreve sem dó. */
function mesclarDadosDoErp(
  existente: ProdutoCatalogo,
  linha: LinhaPlanilha,
  sobrescreverDescricao: boolean
): ProdutoCatalogo {
  const { grupo } = classificarTipoProduto(linha.tipoProduto);

  return {
    ...existente,
    // ERP manda nestes campos
    descricao: sobrescreverDescricao ? linha.descricao : existente.descricao || linha.descricao,
    descricaoDetalhada: sobrescreverDescricao
      ? linha.descricaoDetalhada
      : existente.descricaoDetalhada || linha.descricaoDetalhada,
    referencia: linha.referencia,
    tipoProduto: linha.tipoProduto,
    categoriaSlug: slugify(linha.tipoProduto),
    grupo,
    grupoProdutoCodigo: linha.grupoProdutoCodigo,
    unidade: linha.unidade,
    unidadeLabel: rotularUnidade(linha.unidade, linha.quantidade),
    quantidade: linha.quantidade,
    valorVenda: linha.valorVenda,
    localizacao: linha.localizacao,
    estoqueDescricao: linha.estoqueDescricao,
    empresa: linha.empresa
    // fichaTecnica, marcasAtendidas, modelosAtendidos, imagens, badge, destaque e
    // ativoManual pertencem ao painel — a importação não encosta neles.
  };
}

/** Detecta se algo relevante mudou, para não gravar 1.150 documentos idênticos toda semana. */
function houveMudanca(anterior: ProdutoCatalogo, novo: ProdutoCatalogo): boolean {
  const camposComparados: (keyof ProdutoCatalogo)[] = [
    'descricao',
    'descricaoDetalhada',
    'referencia',
    'tipoProduto',
    'categoriaSlug',
    'unidade',
    'quantidade',
    'valorVenda',
    'localizacao',
    'ativo',
    'ativoManual'
  ];
  return camposComparados.some((campo) => anterior[campo] !== novo[campo]);
}

export interface ContextoImportacao {
  executadoPor: string;
  opcoes?: Partial<OpcoesImportacao>;
  aoProgredir?: (progresso: ProgressoImportacao) => void;
}

/**
 * Executa a importação completa. Idempotente: rodar duas vezes o mesmo arquivo
 * resulta em "inalterado" na segunda passada.
 */
export async function importarPlanilha(
  arquivo: File,
  contexto: ContextoImportacao
): Promise<ResultadoImportacao> {
  const opcoes: OpcoesImportacao = { ...OPCOES_IMPORTACAO_PADRAO, ...contexto.opcoes };
  const progresso = contexto.aoProgredir ?? (() => undefined);

  const id = `imp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const iniciadoEm = new Date().toISOString();

  progresso({ etapa: 'lendo', mensagem: 'Lendo a planilha...', atual: 0, total: 1 });
  const planilha = await lerPlanilha(arquivo);

  const resultado: ResultadoImportacao = {
    id,
    arquivo: planilha.arquivo,
    iniciadoEm,
    executadoPor: sanitizarTexto(contexto.executadoPor, 120) || 'desconhecido',
    totalLinhas: planilha.linhas.length,
    criados: 0,
    atualizados: 0,
    inalterados: 0,
    desativados: 0,
    reativados: 0,
    rejeitados: planilha.totalLinhasBrutas - planilha.linhas.length,
    ausentesNaPlanilha: [],
    categoriasCriadas: [],
    erros: [...planilha.erros],
    linhas: []
  };

  // --- 1. categorias -------------------------------------------------------
  progresso({ etapa: 'categorias', mensagem: 'Sincronizando categorias...', atual: 0, total: 1 });

  const tiposDistintos = Array.from(new Set(planilha.linhas.map((l) => l.tipoProduto)));
  const categoriasExistentes = await catalogService.listarCategorias();
  const mapaCategorias = new Map<string, CategoriaCatalogo>(
    categoriasExistentes.map((c) => [c.slug, c])
  );

  for (const tipo of tiposDistintos) {
    const slug = slugify(tipo);
    if (mapaCategorias.has(slug)) continue;
    if (opcoes.simulacao) {
      resultado.categoriasCriadas.push(tipo);
      continue;
    }
    const { categoria, criada } = await catalogService.garantirCategoria(tipo);
    mapaCategorias.set(categoria.slug, categoria);
    if (criada) resultado.categoriasCriadas.push(tipo);
  }

  // --- 2. comparação -------------------------------------------------------
  progresso({
    etapa: 'comparando',
    mensagem: 'Comparando com o catálogo atual...',
    atual: 0,
    total: planilha.linhas.length
  });

  const produtosAtuais = await catalogService.listarProdutos();
  const mapaAtuais = new Map(produtosAtuais.map((p) => [p.codigo, p]));
  const codigosNaPlanilha = new Set(planilha.linhas.map((l) => l.codigo));

  const paraGravar: Array<{ produto: ProdutoCatalogo; custo: ProdutoCusto }> = [];

  for (const linha of planilha.linhas) {
    const existente = mapaAtuais.get(linha.codigo);
    const categoria = mapaCategorias.get(slugify(linha.tipoProduto)) || null;

    let produto: ProdutoCatalogo;
    let acao: AcaoImportacao;
    let detalhe: string | undefined;

    if (!existente) {
      produto = criarProdutoDeErp(linha);
      acao = 'criado';
      detalhe =
        linha.quantidade > 0
          ? 'Produto novo. Preencha a ficha técnica e ative para exibir no site.'
          : 'Produto novo sem estoque — permanece fora do site.';
    } else {
      const mesclado = normalizarEstadoPublicacao(
        mesclarDadosDoErp(existente, linha, opcoes.sobrescreverDescricao)
      ) as ProdutoCatalogo;

      if (!houveMudanca(existente, mesclado)) {
        produto = mesclado;
        acao = 'inalterado';
      } else if (existente.ativo && !mesclado.ativo && mesclado.quantidade <= 0) {
        produto = mesclado;
        acao = 'desativado';
        detalhe = 'Estoque zerado na planilha — produto removido do site automaticamente.';
      } else if (!existente.ativo && mesclado.ativo) {
        produto = mesclado;
        acao = 'reativado';
        detalhe = 'Estoque reposto — produto voltou a aparecer no site.';
      } else {
        produto = mesclado;
        acao = 'atualizado';
      }
    }

    const preparado = prepararParaGravar(produto, categoria);
    preparado.importadoEm = iniciadoEm;
    preparado.ultimaImportacaoId = id;

    const custo: ProdutoCusto = {
      codigo: preparado.codigo,
      valorReposicao: linha.valorReposicao,
      valorPublicoSugerido: linha.valorPublicoSugerido,
      valorGarantia: linha.valorGarantia,
      atualizadoEm: iniciadoEm,
      ultimaImportacaoId: id
    };

    const registro: ResultadoLinha = {
      codigo: preparado.codigo,
      descricao: preparado.descricao,
      acao,
      detalhe,
      quantidadeAnterior: existente?.quantidade,
      quantidadeNova: preparado.quantidade,
      valorVendaAnterior: existente?.valorVenda,
      valorVendaNovo: preparado.valorVenda
    };
    resultado.linhas.push(registro);

    switch (acao) {
      case 'criado':
        resultado.criados++;
        break;
      case 'atualizado':
        resultado.atualizados++;
        break;
      case 'desativado':
        resultado.desativados++;
        break;
      case 'reativado':
        resultado.reativados++;
        break;
      default:
        resultado.inalterados++;
    }

    // Grava também os inalterados: o custo pode ter mudado sem afetar o público.
    paraGravar.push({ produto: preparado, custo });
  }

  // --- 3. ausentes ---------------------------------------------------------
  const ausentes = produtosAtuais
    .filter((p) => !codigosNaPlanilha.has(p.codigo) && (p.ativo || p.quantidade > 0))
    .map((p) => p.codigo);
  resultado.ausentesNaPlanilha = ausentes;

  if (opcoes.simulacao) {
    resultado.concluidoEm = new Date().toISOString();
    progresso({ etapa: 'concluido', mensagem: 'Simulação concluída.', atual: 1, total: 1 });
    return resultado;
  }

  // --- 4. gravação ---------------------------------------------------------
  progresso({
    etapa: 'gravando',
    mensagem: `Gravando ${paraGravar.length} produtos...`,
    atual: 0,
    total: paraGravar.length
  });

  try {
    await catalogService.gravarLote(paraGravar, (gravados, total) =>
      progresso({
        etapa: 'gravando',
        mensagem: `Gravando produtos... ${gravados}/${total}`,
        atual: gravados,
        total
      })
    );
  } catch (erro) {
    const mensagem = (erro as Error).message;
    resultado.erros.push(`Falha ao gravar o catálogo: ${mensagem}`);
    resultado.concluidoEm = new Date().toISOString();
    await catalogService.registrarImportacao(resultado).catch(() => undefined);
    throw new ErroImportacao(`Importação interrompida durante a gravação: ${mensagem}`);
  }

  // --- 5. desativação dos ausentes ----------------------------------------
  if (opcoes.desativarAusentes && ausentes.length > 0) {
    progresso({
      etapa: 'desativando',
      mensagem: `Desativando ${ausentes.length} produtos ausentes da planilha...`,
      atual: 0,
      total: ausentes.length
    });
    await catalogService.desativarEmLote(ausentes);
    resultado.desativados += ausentes.length;

    for (const codigo of ausentes) {
      resultado.linhas.push({
        codigo,
        descricao: mapaAtuais.get(codigo)?.descricao || codigo,
        acao: 'desativado',
        detalhe: 'Código não consta nesta planilha — desativado do site por precaução.',
        quantidadeAnterior: mapaAtuais.get(codigo)?.quantidade,
        quantidadeNova: 0
      });
    }
  }

  // --- 6. relatório --------------------------------------------------------
  progresso({ etapa: 'finalizando', mensagem: 'Registrando o relatório...', atual: 1, total: 1 });
  resultado.concluidoEm = new Date().toISOString();
  await catalogService.registrarImportacao(resultado).catch((erro) => {
    console.warn('[importacao] relatório não registrado', erro);
  });

  progresso({ etapa: 'concluido', mensagem: 'Importação concluída.', atual: 1, total: 1 });
  return resultado;
}

/** Exporta o relatório em CSV, neutralizando injeção de fórmula. */
export function relatorioParaCsv(resultado: ResultadoImportacao): string {
  const escapar = (valor: unknown): string => {
    const texto = String(valor ?? '');
    const protegido = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
    return `"${protegido.replace(/"/g, '""')}"`;
  };

  const cabecalho = [
    'Codigo',
    'Descricao',
    'Acao',
    'Qtde anterior',
    'Qtde nova',
    'Valor venda anterior',
    'Valor venda novo',
    'Detalhe'
  ];

  const linhas = resultado.linhas.map((l) =>
    [
      l.codigo,
      l.descricao,
      l.acao,
      l.quantidadeAnterior ?? '',
      l.quantidadeNova ?? '',
      l.valorVendaAnterior ?? '',
      l.valorVendaNovo ?? '',
      l.detalhe ?? ''
    ]
      .map(escapar)
      .join(';')
  );

  return [cabecalho.map(escapar).join(';'), ...linhas].join('\r\n');
}
