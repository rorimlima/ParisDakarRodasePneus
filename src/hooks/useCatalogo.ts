/**
 * Hooks de leitura do catálogo.
 *
 * `useCatalogoPublico` alimenta o site e só enxerga produtos ativos.
 * `useCatalogoAdmin` alimenta o painel e traz o catálogo inteiro; os custos só são
 * buscados quando o papel tem direito a eles — e a falha de permissão é tratada
 * como "sem custo", nunca como erro de tela.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { catalogService } from '../services/catalogService';
import {
  CategoriaCatalogo,
  PAPEIS_COM_ACESSO_A_CUSTO,
  PapelUsuario,
  ProdutoCatalogo,
  ProdutoCusto
} from '../types/catalog';
import { Product } from '../types';
import { listaParaExibicao } from '../utils/produtoAdapter';

interface EstadoCatalogo {
  produtos: ProdutoCatalogo[];
  categorias: CategoriaCatalogo[];
  carregando: boolean;
  erro: string | null;
}

const ESTADO_INICIAL: EstadoCatalogo = {
  produtos: [],
  categorias: [],
  carregando: true,
  erro: null
};

/** Catálogo publicado — o que o site exibe. */
export function useCatalogoPublico() {
  const [estado, setEstado] = useState<EstadoCatalogo>(ESTADO_INICIAL);

  useEffect(() => {
    let produtosCarregados = false;
    let categoriasCarregadas = false;

    const concluir = () => {
      if (produtosCarregados && categoriasCarregadas) {
        setEstado((atual) => ({ ...atual, carregando: false }));
      }
    };

    const cancelarProdutos = catalogService.observarProdutos(
      (produtos) => {
        produtosCarregados = true;
        setEstado((atual) => ({ ...atual, produtos, erro: null }));
        concluir();
      },
      { somenteAtivos: true }
    );

    const cancelarCategorias = catalogService.observarCategorias((categorias) => {
      categoriasCarregadas = true;
      setEstado((atual) => ({ ...atual, categorias }));
      concluir();
    });

    return () => {
      cancelarProdutos();
      cancelarCategorias();
    };
  }, []);

  /** Defesa em profundidade: mesmo que a query devolvesse inativo, ele não é exibido. Limitamos pneus a no máximo 20 com maior estoque e valor. */
  const publicaveis = useMemo(() => {
    const todosAtivos = estado.produtos.filter((p) => p.ativo && p.quantidade > 0);
    const pneusAtivos = todosAtivos.filter((p) => p.categoriaSlug === 'pneus');
    const outrosAtivos = todosAtivos.filter((p) => p.categoriaSlug !== 'pneus');

    // Ordenar pneus por quantidade (desc) e valorVenda (desc)
    const pneusOrdenados = [...pneusAtivos].sort((a, b) => {
      if (b.quantidade !== a.quantidade) {
        return b.quantidade - a.quantidade;
      }
      return b.valorVenda - a.valorVenda;
    });

    // Pegar no máximo 20 pneus
    const top20Pneus = pneusOrdenados.slice(0, 20);

    return [...top20Pneus, ...outrosAtivos];
  }, [estado.produtos]);

  const produtosExibicao: Product[] = useMemo(
    () => listaParaExibicao(publicaveis, estado.categorias),
    [publicaveis, estado.categorias]
  );

  /** Só categorias marcadas como visíveis e que de fato têm produto no ar. */
  const categoriasComProdutos = useMemo(() => {
    const contagem = publicaveis.reduce((acc, p) => {
      acc[p.categoriaSlug] = (acc[p.categoriaSlug] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return estado.categorias
      .filter((c) => c.visivelNoSite && (contagem[c.slug] || 0) > 0)
      .map((c) => ({ ...c, totalProdutos: contagem[c.slug] || 0 }));
  }, [estado.categorias, publicaveis]);

  /** Agrupamento por grupo — usado nas pills de categoria do site. */
  const gruposComProdutos = useMemo(() => {
    const mapa = new Map<string, { grupo: string; label: string; total: number }>();
    for (const produto of publicaveis) {
      const categoria = estado.categorias.find((c) => c.slug === produto.categoriaSlug);
      if (categoria && !categoria.visivelNoSite) continue;
      const atual = mapa.get(produto.grupo);
      mapa.set(produto.grupo, {
        grupo: produto.grupo,
        label: categoria?.nomeExibicao || produto.tipoProduto,
        total: (atual?.total || 0) + 1
      });
    }
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [publicaveis, estado.categorias]);

  return {
    produtos: publicaveis,
    produtosExibicao,
    categorias: estado.categorias,
    categoriasComProdutos,
    gruposComProdutos,
    carregando: estado.carregando,
    erro: estado.erro,
    usandoFirebase: catalogService.usandoFirebase
  };
}

/** Catálogo completo + custos, para o painel administrativo. */
export function useCatalogoAdmin(papel: PapelUsuario) {
  const [estado, setEstado] = useState<EstadoCatalogo>(ESTADO_INICIAL);
  const [custos, setCustos] = useState<Record<string, ProdutoCusto>>({});

  const podeVerCusto = PAPEIS_COM_ACESSO_A_CUSTO.includes(papel);

  useEffect(() => {
    let produtosCarregados = false;
    let categoriasCarregadas = false;
    const concluir = () => {
      if (produtosCarregados && categoriasCarregadas) {
        setEstado((atual) => ({ ...atual, carregando: false }));
      }
    };

    const cancelarProdutos = catalogService.observarProdutos((produtos) => {
      produtosCarregados = true;
      setEstado((atual) => ({ ...atual, produtos, erro: null }));
      concluir();
    });

    const cancelarCategorias = catalogService.observarCategorias((categorias) => {
      categoriasCarregadas = true;
      setEstado((atual) => ({ ...atual, categorias }));
      concluir();
    });

    return () => {
      cancelarProdutos();
      cancelarCategorias();
    };
  }, []);

  const recarregarCustos = useCallback(async () => {
    if (!podeVerCusto) {
      setCustos({});
      return;
    }
    setCustos(await catalogService.listarCustos());
  }, [podeVerCusto]);

  useEffect(() => {
    void recarregarCustos();
  }, [recarregarCustos, estado.produtos.length]);

  const indicadores = useMemo(() => {
    const total = estado.produtos.length;
    const publicados = estado.produtos.filter((p) => p.ativo).length;
    const semEstoque = estado.produtos.filter((p) => p.quantidade <= 0).length;
    const fichaIncompleta = estado.produtos.filter(
      (p) => (p.fichaCompleta ?? 0) < 100 && p.quantidade > 0
    ).length;
    const valorEmEstoque = estado.produtos.reduce(
      (soma, p) => soma + p.valorVenda * Math.max(0, p.quantidade),
      0
    );
    const custoEmEstoque = podeVerCusto
      ? estado.produtos.reduce(
          (soma, p) => soma + (custos[p.codigo]?.valorReposicao || 0) * Math.max(0, p.quantidade),
          0
        )
      : null;

    return { total, publicados, semEstoque, fichaIncompleta, valorEmEstoque, custoEmEstoque };
  }, [estado.produtos, custos, podeVerCusto]);

  return {
    produtos: estado.produtos,
    categorias: estado.categorias,
    custos,
    podeVerCusto,
    indicadores,
    carregando: estado.carregando,
    erro: estado.erro,
    recarregarCustos,
    usandoFirebase: catalogService.usandoFirebase
  };
}
