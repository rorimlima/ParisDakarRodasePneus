/**
 * Ponte entre o documento do Firestore (`ProdutoCatalogo`) e o modelo de
 * apresentação já usado pelos componentes do site (`Product`).
 *
 * Mantém o catálogo novo sem reescrever ProductCard, ProductDetailModal e os filtros.
 * Nada de custo atravessa esta camada: `Product` não tem campo para ValorReposicao,
 * então o preço de reposição não chega nem por acidente ao bundle do site.
 */

import { Product, ProductCategory, ProductSpecs, TireType } from '../types';
import { CategoriaCatalogo, ProdutoCatalogo, ValorFichaTecnica } from '../types/catalog';
import { CAMPOS_POR_GRUPO, descreverUnidade, rotularUnidade } from '../config/fichaTecnica';

export interface LinhaFichaTecnica {
  label: string;
  valor: string;
  destaque?: boolean;
}

const IMAGEM_PADRAO_POR_GRUPO: Record<string, string> = {
  rodas: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=800&q=80',
  pneus: 'https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=800&q=80',
  'kits-lift': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
  acessorios: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  iluminacao: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
  engate: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
  capota: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
  usados: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
};

const IMAGEM_GENERICA =
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80';

/**
 * Só aceita http(s). Bloqueia `javascript:` e `data:text/html`, que viram XSS
 * assim que a URL cai num href — a origem é um campo digitado no painel.
 */
export function urlDeImagemSegura(url: unknown, grupo?: string): string {
  const bruto = typeof url === 'string' ? url.trim() : '';
  if (bruto) {
    try {
      const parsed = new URL(bruto);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
    } catch {
      /* URL inválida — cai no padrão abaixo */
    }
  }
  return (grupo && IMAGEM_PADRAO_POR_GRUPO[grupo]) || IMAGEM_GENERICA;
}

const comoTexto = (valor: ValorFichaTecnica | undefined): string | undefined => {
  if (valor === null || valor === undefined || valor === '') return undefined;
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : undefined;
  if (typeof valor === 'boolean') return valor ? 'Sim' : undefined;
  return String(valor);
};

/** "MT — Mud Terrain (lama)" → "MT", para os filtros herdados. */
function extrairSiglaPneu(valor: ValorFichaTecnica | undefined): TireType | undefined {
  const texto = comoTexto(valor);
  if (!texto) return undefined;
  const sigla = texto.trim().slice(0, 2).toUpperCase();
  return (['MT', 'AT', 'LT', 'HT'] as const).includes(sigla as TireType)
    ? (sigla as TireType)
    : undefined;
}

function montarSpecs(produto: ProdutoCatalogo): ProductSpecs {
  const f = produto.fichaTecnica || {};
  return {
    aro: comoTexto(f.aro),
    furacao: comoTexto(f.furacao),
    offset: comoTexto(f.offset),
    tala: comoTexto(f.tala),
    acabamento: comoTexto(f.acabamento),
    medidaPneu: comoTexto(f.medidaPneu),
    tipoPneu: extrairSiglaPneu(f.tipoPneu),
    indiceCarga: comoTexto(f.indiceCargaVelocidade),
    alturaLift: comoTexto(f.alturaLift),
    garantia: comoTexto(f.garantia),
    peso: comoTexto(f.peso)
  };
}

/**
 * Lista de compatibilidade legível: cruza marcas com modelos quando ambos existem.
 * ["Toyota","Ford"] + ["Hilux","Ranger"] → ["Toyota Hilux", "Toyota Ranger", ...]
 */
function montarCompatibilidade(produto: ProdutoCatalogo): string[] {
  const marcas = produto.marcasAtendidas || [];
  const modelos = produto.modelosAtendidos || [];
  const anos = comoTexto(produto.fichaTecnica?.anosCompativeis);

  if (marcas.length === 0 && modelos.length === 0) return [];
  if (modelos.length === 0) return marcas.map((m) => (anos ? `${m} ${anos}` : m));
  if (marcas.length === 0) return modelos.map((m) => (anos ? `${m} ${anos}` : m));

  const combinacoes: string[] = [];
  for (const marca of marcas) {
    for (const modelo of modelos) {
      combinacoes.push(anos ? `${marca} ${modelo} ${anos}` : `${marca} ${modelo}`);
    }
  }
  // Limite defensivo: 40 marcas × 80 modelos = 3.200 strings por card.
  return combinacoes.slice(0, 120);
}

function montarBadge(produto: ProdutoCatalogo): string | undefined {
  if (produto.badge) return produto.badge;
  if (produto.grupo === 'usados') return 'SEMINOVO';
  if (produto.destaque) return 'DESTAQUE';
  if (produto.quantidade === 1) return 'ÚLTIMA PEÇA';
  return undefined;
}

/**
 * Ficha técnica completa para o site, na ordem definida pela categoria.
 * Campos vazios não viram linha — ninguém quer ler "Offset: —" numa ficha.
 */
function montarFichaCompleta(
  produto: ProdutoCatalogo,
  categoria?: CategoriaCatalogo | null
): LinhaFichaTecnica[] {
  const campos = categoria?.campos?.length
    ? categoria.campos
    : CAMPOS_POR_GRUPO[produto.grupo] || [];

  const valores: Record<string, ValorFichaTecnica> = {
    ...(produto.fichaTecnica || {}),
    marcasAtendidas: produto.marcasAtendidas || [],
    modelosAtendidos: produto.modelosAtendidos || []
  };

  const linhas: LinhaFichaTecnica[] = [...campos]
    .sort((a, b) => a.ordem - b.ordem)
    .map((campo): LinhaFichaTecnica | null => {
      const texto = comoTexto(valores[campo.key]);
      return texto
        ? { label: campo.label, valor: texto, destaque: campo.destaqueNoCard }
        : null;
    })
    .filter((linha): linha is LinhaFichaTecnica => linha !== null);

  // Dados do ERP que o cliente precisa ver e que não estão no schema manual.
  linhas.unshift({
    label: 'Unidade de venda',
    valor: descreverUnidade(produto.unidade),
    destaque: true
  });

  return linhas;
}

export function paraProdutoDeExibicao(
  produto: ProdutoCatalogo,
  categoria?: CategoriaCatalogo | null
): Product {
  const imagens = (produto.imagens || []).map((img) => urlDeImagemSegura(img, produto.grupo));
  const principal = imagens[0] || urlDeImagemSegura(undefined, produto.grupo);

  return {
    id: produto.codigo,
    // Produto_Codigo é o identificador que aparece no painel e no site.
    sku: produto.codigo,
    name: produto.descricao,
    brand: produto.referencia && produto.referencia !== produto.codigo
      ? produto.referencia
      : categoria?.nomeExibicao || 'Paris Dakar',
    category: produto.grupo as ProductCategory,
    subcategory: categoria?.nomeExibicao || produto.tipoProduto,
    price: produto.valorVenda,
    image: principal,
    secondaryImages: imagens.slice(1),
    description:
      produto.descricaoDetalhada ||
      `${produto.descricao} — ${descreverUnidade(produto.unidade)}.`,
    specs: montarSpecs(produto),
    compatibleVehicles: montarCompatibilidade(produto),
    inStock: produto.ativo && produto.quantidade > 0,
    stockQuantity: produto.quantidade,
    badge: montarBadge(produto),
    rating: 5,
    reviewsCount: 0,
    unidadeSigla: produto.unidade,
    unidadeLabel: rotularUnidade(produto.unidade, produto.quantidade),
    categoriaNome: categoria?.nomeExibicao || produto.tipoProduto,
    fichaTecnicaCompleta: montarFichaCompleta(produto, categoria),
    isActive: produto.ativoManual !== false && produto.ativo
  };
}

export function listaParaExibicao(
  produtos: ProdutoCatalogo[],
  categorias: CategoriaCatalogo[] = []
): Product[] {
  const porSlug = new Map(categorias.map((c) => [c.slug, c]));
  return produtos.map((p) => paraProdutoDeExibicao(p, porSlug.get(p.categoriaSlug)));
}
