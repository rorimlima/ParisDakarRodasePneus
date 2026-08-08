/**
 * Serviço de catálogo — única porta de entrada para produtos, categorias e custos.
 *
 * Dois backends com a mesma interface:
 *   - Firestore, quando as variáveis VITE_FIREBASE_* existem (produção);
 *   - localStorage, quando não existem (desenvolvimento sem projeto Firebase).
 *
 * Invariante central, aplicada aqui e replicada na Cloud Function `onProdutoEscrito`:
 *
 *     ativo === ativoManual && quantidade > 0
 *
 * Quantidade zerada derruba o produto do site sem depender de ninguém clicar em nada.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Firestore,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

import { COLECOES, firebaseAtivo, obterDb } from '../firebase/config';
import {
  CategoriaCatalogo,
  ProdutoCatalogo,
  ProdutoCusto,
  ResultadoImportacao,
  ValorFichaTecnica
} from '../types/catalog';
import {
  CAMPOS_POR_GRUPO,
  calcularCompletudeFicha,
  classificarTipoProduto,
  construirCategoria,
  rotularUnidade,
  slugify
} from '../config/fichaTecnica';
import { paraNumero } from '../utils/pricing';

// ---------------------------------------------------------------------------
// Invariantes de estado
// ---------------------------------------------------------------------------

/**
 * Recalcula `ativo` a partir de `ativoManual` + `quantidade`.
 * Chamada em toda escrita: importação, edição manual e toggle do painel.
 */
export function normalizarEstadoPublicacao<T extends Partial<ProdutoCatalogo>>(
  produto: T
): T & { ativo: boolean; ativoManual: boolean; motivoInativacao: ProdutoCatalogo['motivoInativacao'] } {
  const quantidade = Math.max(0, paraNumero(produto.quantidade));
  const ativoManual = produto.ativoManual !== false;
  const ativo = ativoManual && quantidade > 0;

  let motivoInativacao: ProdutoCatalogo['motivoInativacao'] = null;
  if (!ativo) {
    motivoInativacao = quantidade <= 0 ? 'estoque-zerado' : 'desativado-manualmente';
  }

  return { ...produto, quantidade, ativoManual, ativo, motivoInativacao };
}

/** Remove `undefined` — Firestore rejeita o valor e aborta o batch inteiro. */
function limparUndefined<T extends object>(objeto: T): T {
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(objeto)) {
    if (valor !== undefined) saida[chave] = valor;
  }
  return saida as T;
}

/**
 * Sanitiza texto vindo da planilha ou do formulário antes de persistir.
 * O site renderiza via React (que já escapa), mas o painel exporta CSV e monta
 * mensagem de WhatsApp — sanitizar na entrada fecha o vetor na origem.
 */
export function sanitizarTexto(valor: unknown, limite = 500): string {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite);
}

/** Impede que uma célula da planilha vire fórmula ao abrir o CSV exportado no Excel. */
export function protegerContraInjecaoDeFormula(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

const agora = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Construção de produto a partir de dados brutos
// ---------------------------------------------------------------------------

export interface DadosErpProduto {
  codigo: string;
  descricao: string;
  descricaoDetalhada?: string;
  referencia?: string;
  tipoProduto: string;
  unidade: string;
  quantidade: number;
  valorVenda: number;
  valorVendaTotal?: number;
  valorPublicoSugerido?: number;
  valorPublicoSugeridoTotal?: number;
  valorGarantia?: number;
  valorGarantiaTotal?: number;
  localizacao?: string;
  grupoProdutoCodigo?: string;
  grupoLucratividadeLetra?: string;
  clasABCPopularidade?: string;
  clasABCVenda?: string;
  clasABCEstoque?: string;
  estoqueDescricao?: string;
  empresa?: string;
}

/** Cria um produto novo a partir da planilha, com ficha técnica vazia para preenchimento manual. */
export function criarProdutoDeErp(dados: DadosErpProduto): ProdutoCatalogo {
  const { grupo } = classificarTipoProduto(dados.tipoProduto);
  const quantidade = Math.max(0, paraNumero(dados.quantidade));
  const timestamp = agora();

  return normalizarEstadoPublicacao({
    codigo: sanitizarTexto(dados.codigo, 40),
    descricao: sanitizarTexto(dados.descricao, 200),
    descricaoDetalhada: sanitizarTexto(dados.descricaoDetalhada || dados.descricao, 500),
    referencia: sanitizarTexto(dados.referencia, 60),
    tipoProduto: sanitizarTexto(dados.tipoProduto, 80),
    categoriaSlug: slugify(dados.tipoProduto),
    grupo,
    grupoProdutoCodigo: sanitizarTexto(dados.grupoProdutoCodigo, 20),
    grupoLucratividadeLetra: sanitizarTexto(dados.grupoLucratividadeLetra, 10),
    clasABCPopularidade: sanitizarTexto(dados.clasABCPopularidade, 10),
    clasABCVenda: sanitizarTexto(dados.clasABCVenda, 10),
    clasABCEstoque: sanitizarTexto(dados.clasABCEstoque, 10),
    unidade: sanitizarTexto(dados.unidade, 6).toUpperCase(),
    unidadeLabel: rotularUnidade(dados.unidade, quantidade),
    quantidade,
    localizacao: sanitizarTexto(dados.localizacao, 60),
    estoqueDescricao: sanitizarTexto(dados.estoqueDescricao, 80),
    empresa: sanitizarTexto(dados.empresa, 80),
    valorVenda: paraNumero(dados.valorVenda, 0),
    valorVendaTotal: paraNumero(dados.valorVendaTotal, 0),
    valorPublicoSugerido: paraNumero(dados.valorPublicoSugerido, 0),
    valorPublicoSugeridoTotal: paraNumero(dados.valorPublicoSugeridoTotal, 0),
    valorGarantia: paraNumero(dados.valorGarantia, 0),
    valorGarantiaTotal: paraNumero(dados.valorGarantiaTotal, 0),
    // Produto novo entra ativado por padrão se houver estoque positivo.
    ativoManual: quantidade > 0,
    ativo: quantidade > 0,
    fichaTecnica: {},
    marcasAtendidas: [],
    modelosAtendidos: [],
    imagens: [],
    fichaCompleta: 0,
    criadoEm: timestamp,
    atualizadoEm: timestamp
  }) as ProdutoCatalogo;
}

/** Recalcula campos derivados antes de gravar. */
export function prepararParaGravar(
  produto: ProdutoCatalogo,
  categoria?: CategoriaCatalogo | null
): ProdutoCatalogo {
  const normalizado = normalizarEstadoPublicacao(produto) as ProdutoCatalogo;
  const campos = categoria?.campos ?? CAMPOS_POR_GRUPO[normalizado.grupo] ?? [];

  const fichaComListas: Record<string, ValorFichaTecnica> = {
    ...normalizado.fichaTecnica,
    marcasAtendidas: normalizado.marcasAtendidas,
    modelosAtendidos: normalizado.modelosAtendidos
  };

  return {
    ...normalizado,
    unidadeLabel: rotularUnidade(normalizado.unidade, normalizado.quantidade),
    fichaCompleta: calcularCompletudeFicha(campos, fichaComListas),
    atualizadoEm: agora()
  };
}

// ---------------------------------------------------------------------------
// Backend local (fallback de desenvolvimento)
// ---------------------------------------------------------------------------

const CHAVES_LOCAIS = {
  produtos: 'pd_catalogo_produtos',
  custos: 'pd_catalogo_custos',
  categorias: 'pd_catalogo_categorias',
  importacoes: 'pd_catalogo_importacoes'
};

function lerLocal<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravarLocal(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error(`[catalogo] falha ao gravar ${chave} no armazenamento local`, erro);
  }
}

/** Notifica assinantes locais — replica o comportamento reativo do onSnapshot. */
const ouvintesLocais = new Set<() => void>();
function notificarLocais() {
  ouvintesLocais.forEach((fn) => {
    try {
      fn();
    } catch (erro) {
      console.error('[catalogo] ouvinte local falhou', erro);
    }
  });
}

// ---------------------------------------------------------------------------
// Conversores Firestore
// ---------------------------------------------------------------------------

function paraProduto(snap: QueryDocumentSnapshot<DocumentData>): ProdutoCatalogo {
  const dados = snap.data() as Partial<ProdutoCatalogo>;
  return {
    ...(dados as ProdutoCatalogo),
    codigo: dados.codigo || snap.id,
    fichaTecnica: dados.fichaTecnica || {},
    marcasAtendidas: dados.marcasAtendidas || [],
    modelosAtendidos: dados.modelosAtendidos || [],
    imagens: dados.imagens || []
  };
}

function exigirDb(): Firestore {
  const db = obterDb();
  if (!db) throw new Error('Firebase não configurado. Defina as variáveis VITE_FIREBASE_* no .env.');
  return db;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export const catalogService = {
  usandoFirebase: firebaseAtivo,

  // ---- PRODUTOS -----------------------------------------------------------

  /** Catálogo completo — uso administrativo. */
  async listarProdutos(): Promise<ProdutoCatalogo[]> {
    if (!firebaseAtivo) {
      return lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []);
    }
    const snap = await getDocs(query(collection(exigirDb(), COLECOES.produtos), orderBy('descricao')));
    return snap.docs.map(paraProduto);
  },

  /**
   * Somente produtos publicados — é isto que o site consome.
   * O filtro `ativo == true` está também nas Security Rules: o cliente não consegue
   * listar inativos nem trocando a query no console do navegador.
   */
  async listarProdutosAtivos(): Promise<ProdutoCatalogo[]> {
    if (!firebaseAtivo) {
      return lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []).filter(
        (p) => p.ativo && p.quantidade > 0
      );
    }
    const snap = await getDocs(
      query(
        collection(exigirDb(), COLECOES.produtos),
        where('ativo', '==', true),
        orderBy('descricao')
      )
    );
    return snap.docs.map(paraProduto);
  },

  /** Assinatura em tempo real. Devolve a função de cancelamento. */
  observarProdutos(
    callback: (produtos: ProdutoCatalogo[]) => void,
    opcoes: { somenteAtivos?: boolean } = {}
  ): () => void {
    if (!firebaseAtivo) {
      const emitir = () => {
        const todos = lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []);
        callback(opcoes.somenteAtivos ? todos.filter((p) => p.ativo && p.quantidade > 0) : todos);
      };
      ouvintesLocais.add(emitir);
      emitir();
      return () => ouvintesLocais.delete(emitir);
    }

    const restricoes = opcoes.somenteAtivos ? [where('ativo', '==', true)] : [];
    return onSnapshot(
      query(collection(exigirDb(), COLECOES.produtos), ...restricoes, orderBy('descricao')),
      (snap) => callback(snap.docs.map(paraProduto)),
      (erro) => {
        console.error('[catalogo] assinatura de produtos falhou, tentando fallback getDocs', erro);
        getDocs(query(collection(exigirDb(), COLECOES.produtos), ...restricoes))
          .then((snap) => callback(snap.docs.map(paraProduto)))
          .catch((err) => {
            console.error('[catalogo] fallback getDocs também falhou', err);
            callback([]);
          });
      }
    );
  },

  async obterProduto(codigo: string): Promise<ProdutoCatalogo | null> {
    const id = sanitizarTexto(codigo, 40);
    if (!id) return null;

    if (!firebaseAtivo) {
      return lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []).find((p) => p.codigo === id) || null;
    }
    const snap = await getDoc(doc(exigirDb(), COLECOES.produtos, id));
    return snap.exists() ? paraProduto(snap as QueryDocumentSnapshot<DocumentData>) : null;
  },

  /** Cria ou atualiza um produto aplicando as invariantes de publicação. */
  async salvarProduto(
    produto: ProdutoCatalogo,
    categoria?: CategoriaCatalogo | null
  ): Promise<ProdutoCatalogo> {
    const pronto = prepararParaGravar(produto, categoria);

    if (!firebaseAtivo) {
      const lista = lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []);
      const indice = lista.findIndex((p) => p.codigo === pronto.codigo);
      if (indice >= 0) lista[indice] = pronto;
      else lista.unshift(pronto);
      gravarLocal(CHAVES_LOCAIS.produtos, lista);
      notificarLocais();
      return pronto;
    }

    await setDoc(
      doc(exigirDb(), COLECOES.produtos, pronto.codigo),
      limparUndefined({ ...pronto, atualizadoEmServidor: serverTimestamp() }),
      { merge: true }
    );
    return pronto;
  },

  /**
   * Botão "Ativar produto no site".
   * Ligar com estoque zerado é rejeitado — não é um aviso de UI, é regra do serviço.
   */
  async definirAtivacao(codigo: string, ativar: boolean): Promise<ProdutoCatalogo | null> {
    const produto = await this.obterProduto(codigo);
    if (!produto) return null;

    if (ativar && produto.quantidade <= 0) {
      throw new Error(
        `Produto ${produto.codigo} está com estoque zerado e não pode ser publicado no site.`
      );
    }

    return this.salvarProduto({ ...produto, ativoManual: ativar });
  },

  async excluirProduto(codigo: string): Promise<void> {
    const id = sanitizarTexto(codigo, 40);
    if (!id) return;

    if (!firebaseAtivo) {
      gravarLocal(
        CHAVES_LOCAIS.produtos,
        lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []).filter((p) => p.codigo !== id)
      );
      gravarLocal(
        CHAVES_LOCAIS.custos,
        lerLocal<ProdutoCusto[]>(CHAVES_LOCAIS.custos, []).filter((c) => c.codigo !== id)
      );
      notificarLocais();
      return;
    }

    const db = exigirDb();
    const lote = writeBatch(db);
    lote.delete(doc(db, COLECOES.produtos, id));
    lote.delete(doc(db, COLECOES.custos, id));
    await lote.commit();
  },

  // ---- CUSTOS (restrito a gerência) --------------------------------------

  async obterCusto(codigo: string): Promise<ProdutoCusto | null> {
    const id = sanitizarTexto(codigo, 40);
    if (!id) return null;

    if (!firebaseAtivo) {
      return lerLocal<ProdutoCusto[]>(CHAVES_LOCAIS.custos, []).find((c) => c.codigo === id) || null;
    }
    const snap = await getDoc(doc(exigirDb(), COLECOES.custos, id));
    return snap.exists() ? (snap.data() as ProdutoCusto) : null;
  },

  /**
   * Carrega o mapa de custos. Falha silenciosamente para quem não tem permissão —
   * a UI simplesmente não exibe custo nem margem, sem quebrar a tela.
   */
  async listarCustos(): Promise<Record<string, ProdutoCusto>> {
    try {
      if (!firebaseAtivo) {
        return lerLocal<ProdutoCusto[]>(CHAVES_LOCAIS.custos, []).reduce((acc, custo) => {
          acc[custo.codigo] = custo;
          return acc;
        }, {} as Record<string, ProdutoCusto>);
      }
      const snap = await getDocs(collection(exigirDb(), COLECOES.custos));
      return snap.docs.reduce((acc, documento) => {
        const custo = documento.data() as ProdutoCusto;
        acc[custo.codigo || documento.id] = custo;
        return acc;
      }, {} as Record<string, ProdutoCusto>);
    } catch (erro) {
      console.warn('[catalogo] custos indisponíveis para este perfil', erro);
      return {};
    }
  },

  async salvarCusto(custo: ProdutoCusto): Promise<void> {
    const registro: ProdutoCusto = {
      ...custo,
      codigo: sanitizarTexto(custo.codigo, 40),
      valorReposicao: paraNumero(custo.valorReposicao, 0),
      atualizadoEm: agora()
    };

    if (!firebaseAtivo) {
      const lista = lerLocal<ProdutoCusto[]>(CHAVES_LOCAIS.custos, []);
      const indice = lista.findIndex((c) => c.codigo === registro.codigo);
      if (indice >= 0) lista[indice] = registro;
      else lista.push(registro);
      gravarLocal(CHAVES_LOCAIS.custos, lista);
      return;
    }

    await setDoc(doc(exigirDb(), COLECOES.custos, registro.codigo), limparUndefined(registro), {
      merge: true
    });
  },

  // ---- CATEGORIAS --------------------------------------------------------

  async listarCategorias(): Promise<CategoriaCatalogo[]> {
    if (!firebaseAtivo) {
      return lerLocal<CategoriaCatalogo[]>(CHAVES_LOCAIS.categorias, []).sort(
        (a, b) => a.ordem - b.ordem || a.nomeExibicao.localeCompare(b.nomeExibicao)
      );
    }
    const snap = await getDocs(query(collection(exigirDb(), COLECOES.categorias), orderBy('ordem')));
    return snap.docs.map((d) => d.data() as CategoriaCatalogo);
  },

  observarCategorias(callback: (categorias: CategoriaCatalogo[]) => void): () => void {
    if (!firebaseAtivo) {
      const emitir = () =>
        callback(
          lerLocal<CategoriaCatalogo[]>(CHAVES_LOCAIS.categorias, []).sort((a, b) => a.ordem - b.ordem)
        );
      ouvintesLocais.add(emitir);
      emitir();
      return () => ouvintesLocais.delete(emitir);
    }
    return onSnapshot(
      query(collection(exigirDb(), COLECOES.categorias), orderBy('ordem')),
      (snap) => callback(snap.docs.map((d) => d.data() as CategoriaCatalogo)),
      (erro) => console.error('[catalogo] assinatura de categorias falhou', erro)
    );
  },

  async salvarCategoria(categoria: CategoriaCatalogo): Promise<CategoriaCatalogo> {
    const registro: CategoriaCatalogo = {
      ...categoria,
      slug: categoria.slug || slugify(categoria.nomeOriginal),
      atualizadoEm: agora()
    };

    if (!firebaseAtivo) {
      const lista = lerLocal<CategoriaCatalogo[]>(CHAVES_LOCAIS.categorias, []);
      const indice = lista.findIndex((c) => c.slug === registro.slug);
      if (indice >= 0) lista[indice] = registro;
      else lista.push(registro);
      gravarLocal(CHAVES_LOCAIS.categorias, lista);
      notificarLocais();
      return registro;
    }

    await setDoc(doc(exigirDb(), COLECOES.categorias, registro.slug), limparUndefined(registro), {
      merge: true
    });
    return registro;
  },

  /** Garante a existência da categoria de um TipoProduto_Descricao. Idempotente. */
  async garantirCategoria(tipoProduto: string): Promise<{ categoria: CategoriaCatalogo; criada: boolean }> {
    const slug = slugify(tipoProduto);
    const existentes = await this.listarCategorias();
    const existente = existentes.find((c) => c.slug === slug);
    if (existente) return { categoria: existente, criada: false };

    const nova = construirCategoria(tipoProduto);
    await this.salvarCategoria(nova);
    return { categoria: nova, criada: true };
  },

  // ---- IMPORTAÇÕES -------------------------------------------------------

  /** Grava o relatório da importação. O detalhamento por linha fica fora do doc para não estourar 1 MiB. */
  async registrarImportacao(resultado: ResultadoImportacao): Promise<void> {
    const resumo = { ...resultado, linhas: resultado.linhas.slice(0, 200) };

    if (!firebaseAtivo) {
      const historico = lerLocal<ResultadoImportacao[]>(CHAVES_LOCAIS.importacoes, []);
      historico.unshift(resumo);
      gravarLocal(CHAVES_LOCAIS.importacoes, historico.slice(0, 20));
      return;
    }

    await setDoc(doc(exigirDb(), COLECOES.importacoes, resumo.id), limparUndefined(resumo));
  },

  async listarImportacoes(): Promise<ResultadoImportacao[]> {
    if (!firebaseAtivo) {
      return lerLocal<ResultadoImportacao[]>(CHAVES_LOCAIS.importacoes, []);
    }
    const snap = await getDocs(
      query(collection(exigirDb(), COLECOES.importacoes), orderBy('iniciadoEm', 'desc'))
    );
    return snap.docs.slice(0, 20).map((d) => d.data() as ResultadoImportacao);
  },

  // ---- ESCRITA EM LOTE (usada pela importação) ---------------------------

  /**
   * Grava produtos e custos em lotes. O limite do Firestore é 500 operações por batch
   * e cada produto consome 2 (produto + custo), então o lote fecha em 200 produtos.
   */
  async gravarLote(
    itens: Array<{ produto: ProdutoCatalogo; custo?: ProdutoCusto }>,
    aoProgredir?: (gravados: number, total: number) => void
  ): Promise<void> {
    if (itens.length === 0) return;

    if (!firebaseAtivo) {
      const produtos = lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []);
      const custos = lerLocal<ProdutoCusto[]>(CHAVES_LOCAIS.custos, []);
      const indiceProdutos = new Map(produtos.map((p) => [p.codigo, p]));
      const indiceCustos = new Map(custos.map((c) => [c.codigo, c]));

      for (const { produto, custo } of itens) {
        indiceProdutos.set(produto.codigo, produto);
        if (custo) indiceCustos.set(custo.codigo, custo);
      }

      gravarLocal(CHAVES_LOCAIS.produtos, Array.from(indiceProdutos.values()));
      gravarLocal(CHAVES_LOCAIS.custos, Array.from(indiceCustos.values()));
      notificarLocais();
      aoProgredir?.(itens.length, itens.length);
      return;
    }

    const db = exigirDb();
    const TAMANHO_LOTE = 200;

    for (let inicio = 0; inicio < itens.length; inicio += TAMANHO_LOTE) {
      const fatia = itens.slice(inicio, inicio + TAMANHO_LOTE);
      const lote = writeBatch(db);

      for (const { produto, custo } of fatia) {
        lote.set(doc(db, COLECOES.produtos, produto.codigo), limparUndefined(produto), { merge: true });
        if (custo) {
          lote.set(doc(db, COLECOES.custos, custo.codigo), limparUndefined(custo), { merge: true });
        }
      }

      await lote.commit();
      aoProgredir?.(Math.min(inicio + TAMANHO_LOTE, itens.length), itens.length);
    }
  },

  /** Desativa em lote — usado para os produtos que sumiram da planilha. */
  async desativarEmLote(codigos: string[]): Promise<void> {
    if (codigos.length === 0) return;

    const patch = {
      ativoManual: false,
      ativo: false,
      motivoInativacao: 'estoque-zerado' as const,
      quantidade: 0,
      atualizadoEm: agora()
    };

    if (!firebaseAtivo) {
      const produtos = lerLocal<ProdutoCatalogo[]>(CHAVES_LOCAIS.produtos, []);
      const alvo = new Set(codigos);
      gravarLocal(
        CHAVES_LOCAIS.produtos,
        produtos.map((p) => (alvo.has(p.codigo) ? { ...p, ...patch } : p))
      );
      notificarLocais();
      return;
    }

    const db = exigirDb();
    for (let inicio = 0; inicio < codigos.length; inicio += 400) {
      const lote = writeBatch(db);
      for (const codigo of codigos.slice(inicio, inicio + 400)) {
        lote.update(doc(db, COLECOES.produtos, codigo), patch);
      }
      await lote.commit();
    }
  }
};

export type CatalogService = typeof catalogService;
