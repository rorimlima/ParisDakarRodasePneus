import crypto from 'crypto';
import { dbClient, ProductRecord } from './dbClient.js';
import { DeltaSyncQuerySchema } from '../schemas/productSchema.js';

export interface CatalogDeltaSyncResponse {
  products: ProductRecord[];
  meta: {
    totalCount: number;
    returnedCount: number;
    updatedSinceFilter?: string;
    serverTimestamp: string;
    eTag: string;
  };
}

export class ServerCatalogService {
  /**
   * Consulta os produtos aplicando filtro delta (Delta Sync) para arquitetura offline-first
   */
  public async getProductsDeltaSync(queryParams: any): Promise<CatalogDeltaSyncResponse> {
    const validatedQuery = DeltaSyncQuerySchema.parse(queryParams);

    const { products, totalCount, maxUpdatedAt } = await dbClient.getProductsUpdatedSince(
      validatedQuery.updatedSince,
      validatedQuery.limit,
      validatedQuery.offset
    );

    // Gerar um ETag único com base nos produtos retornados e na data máxima de atualização
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(products) + maxUpdatedAt + totalCount)
      .digest('hex')
      .substring(0, 16);

    const eTag = `W/"cat-${hash}"`;
    const serverTimestamp = new Date().toISOString();

    return {
      products,
      meta: {
        totalCount,
        returnedCount: products.length,
        updatedSinceFilter: validatedQuery.updatedSince,
        serverTimestamp,
        eTag,
      },
    };
  }
}

export const serverCatalogService = new ServerCatalogService();
export const catalogService = serverCatalogService;
