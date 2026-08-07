import { useCallback, useEffect, useState } from 'react';
import { ApiError, catalogApi } from '../services/apiClient';
import { storageService } from '../services/storageService';
import { Product } from '../types';

export type CatalogStatus = 'loading' | 'ready' | 'error';
export type CatalogSource = 'api' | 'local';

/**
 * Chave de corte da migração.
 *
 * Enquanto estiver desligada, a loja continua lendo do localStorage, como
 * sempre funcionou. Ligue (VITE_USE_API_CATALOG=true) só depois de confirmar,
 * em produção, que GET /health/db responde "ok" e que o catálogo já foi
 * semeado no Firestore (`npm run seed:catalog`) — senão a vitrine liga num
 * backend vazio e o site fica sem produtos.
 *
 * Isto é um interruptor de virada, não um fallback: com a chave ligada, falha
 * de API vira erro na tela. Mostrar preço velho como se fosse o vigente é pior
 * do que admitir a falha, porque o cliente decide uma compra por um valor que
 * não vale mais.
 */
const USE_API = import.meta.env?.VITE_USE_API_CATALOG === 'true';

interface CatalogState {
  products: Product[];
  status: CatalogStatus;
  error: string | null;
}

export const useCatalog = () => {
  const [state, setState] = useState<CatalogState>(() =>
    USE_API
      ? { products: [], status: 'loading', error: null }
      : { products: storageService.getProducts(), status: 'ready', error: null }
  );

  const load = useCallback(async () => {
    if (!USE_API) {
      setState({ products: storageService.getProducts(), status: 'ready', error: null });
      return;
    }

    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    try {
      const products = await catalogApi.listProducts();
      setState({ products, status: 'ready', error: null });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 0
          ? 'Não conseguimos falar com o servidor. Verifique sua conexão.'
          : 'Não foi possível carregar o catálogo agora.';

      setState({ products: [], status: 'error', error: message });
    }
  }, []);

  useEffect(() => {
    if (USE_API) void load();
  }, [load]);

  return {
    products: state.products,
    status: state.status,
    error: state.error,
    reload: load,
    source: (USE_API ? 'api' : 'local') as CatalogSource,
    /** Aplica localmente uma lista já confirmada (usado pelo painel admin). */
    setProducts: (products: Product[]) => setState((prev) => ({ ...prev, products }))
  };
};
