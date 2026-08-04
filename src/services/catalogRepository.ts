import { Product } from '../types';
import { catalogApi } from './apiClient';
import { authService } from './authService';
import { storageService } from './storageService';

/**
 * Porta de entrada única do catálogo para o painel administrativo.
 *
 * Usa a MESMA chave da vitrine (VITE_USE_API_CATALOG) de propósito: se o
 * painel gravasse na API enquanto a loja lê do localStorage (ou o contrário),
 * o administrador veria um catálogo e o cliente veria outro. Um interruptor
 * só, os dois lados juntos.
 */
const USE_API = import.meta.env?.VITE_USE_API_CATALOG === 'true';

export const isRemoteCatalog = USE_API;

export class NotAuthenticatedError extends Error {
  constructor() {
    super('Sua sessão de administrador expirou. Entre novamente para salvar.');
    this.name = 'NotAuthenticatedError';
  }
}

const requireToken = async (): Promise<string> => {
  const token = await authService.getIdToken();
  if (!token) throw new NotAuthenticatedError();
  return token;
};

export const catalogRepository = {
  async list(): Promise<Product[]> {
    return USE_API ? catalogApi.listProducts() : storageService.getProducts();
  },

  /**
   * Grava um produto e devolve a lista atualizada.
   *
   * No modo remoto a lista é relida do servidor em vez de remendada em
   * memória: assim a tela mostra o que ficou gravado de fato, incluindo o que
   * o servidor normalizou.
   */
  async save(product: Product): Promise<Product[]> {
    if (!USE_API) return storageService.saveProduct(product);

    await catalogApi.saveProduct(product, await requireToken());
    return catalogApi.listProducts();
  },

  async remove(product: Product): Promise<Product[]> {
    if (!USE_API) return storageService.deleteProduct(product.id);

    await catalogApi.deleteProduct(product.sku, await requireToken());
    return catalogApi.listProducts();
  },

  /** Importação de planilha: grava em sequência e recarrega no fim. */
  async saveMany(products: Product[]): Promise<Product[]> {
    if (!USE_API) {
      storageService.saveProducts(products);
      return products;
    }

    const token = await requireToken();
    for (const product of products) {
      await catalogApi.saveProduct(product, token);
    }
    return catalogApi.listProducts();
  }
};
