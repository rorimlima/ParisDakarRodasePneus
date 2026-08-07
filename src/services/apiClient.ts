import { Product } from '../types';

/**
 * Cliente HTTP do catálogo.
 *
 * Em produção o site e a API vivem no mesmo domínio (o Firebase Hosting
 * reescreve /api/** para a Cloud Function), então a base é relativa. Em
 * desenvolvimento, aponte para o servidor local com VITE_API_BASE_URL.
 */
const API_BASE = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const CATALOG_URL = `${API_BASE}/api/v1/products`;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface CatalogResponse {
  status: string;
  data: Product[];
  meta: {
    totalCount: number;
    returnedCount: number;
    serverTimestamp: string;
    eTag: string;
  };
}

/**
 * A API pagina em 50 por padrão; o catálogo da loja é pequeno, mas pedir
 * explicitamente evita truncar em silêncio quando ele crescer.
 */
const CATALOG_PAGE_SIZE = 200;

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers }
    });
  } catch (cause) {
    // fetch só rejeita em falha de rede — a API estar fora entra aqui.
    throw new ApiError('Não foi possível falar com o servidor.', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    let code: string | undefined;
    let message = `Falha na requisição (HTTP ${response.status}).`;
    try {
      const body = await response.json();
      code = body?.code;
      message = body?.message ?? message;
    } catch {
      /* resposta sem corpo JSON: mantém a mensagem genérica */
    }
    throw new ApiError(message, response.status, code);
  }

  return (await response.json()) as T;
};

export const catalogApi = {
  /** Catálogo público. Não exige autenticação. */
  async listProducts(): Promise<Product[]> {
    const body = await request<CatalogResponse>(`${CATALOG_URL}?limit=${CATALOG_PAGE_SIZE}`);
    return body.data ?? [];
  },

  /** Grava um produto. Exige token Firebase de administrador. */
  async saveProduct(product: Product, idToken: string): Promise<Product> {
    const body = await request<{ data: Product }>(`${CATALOG_URL}/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify(product)
    });
    return body.data;
  },

  /** Remove um produto pelo SKU. Exige token Firebase de administrador. */
  async deleteProduct(sku: string, idToken: string): Promise<void> {
    await request(`${CATALOG_URL}/admin/${encodeURIComponent(sku)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` }
    });
  }
};
