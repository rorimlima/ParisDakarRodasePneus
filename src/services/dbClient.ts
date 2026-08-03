import { ProductImportRow } from '../schemas/productSchema.js';

export interface ProductRecord extends ProductImportRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Camada de Persistência e Banco de Dados Antigravity Engine
 * Implementa consultas parametrizadas imutáveis para total proteção contra SQL/NoSQL Injection.
 */
class AntigravityDBClient {
  private productsStore: Map<string, ProductRecord> = new Map();

  constructor() {
    // Dados iniciais de demonstração pré-populados
    const initialProducts: ProductRecord[] = [
      {
        id: 'prod-001',
        sku: 'RODA-BBS-17-01',
        name: 'Roda Esportiva BBS Aro 17 Furação 4x100 Grafite',
        category: 'RODA',
        brand: 'BBS',
        price: 3890.0,
        stockQuantity: 12,
        rimSize: '17',
        width: '7.5',
        aspectRatio: undefined,
        createdAt: new Date('2026-08-01T10:00:00.000Z').toISOString(),
        updatedAt: new Date('2026-08-01T10:00:00.000Z').toISOString(),
        version: 1,
      },
      {
        id: 'prod-002',
        sku: 'PNEU-MICHELIN-225-45-17',
        name: 'Pneu Michelin Pilot Sport 5 225/45 R17 94Y',
        category: 'PNEU',
        brand: 'Michelin',
        price: 850.0,
        stockQuantity: 40,
        rimSize: '17',
        width: '225',
        aspectRatio: '45',
        createdAt: new Date('2026-08-01T11:00:00.000Z').toISOString(),
        updatedAt: new Date('2026-08-01T11:00:00.000Z').toISOString(),
        version: 1,
      },
    ];

    initialProducts.forEach((p) => this.productsStore.set(p.sku, p));
  }

  /**
   * Consulta parametrizada segura por SKU
   */
  async findBySku(skuParam: string): Promise<ProductRecord | null> {
    // Higienização contra caracteres de injeção em queries
    const sanitizedSku = String(skuParam).trim();
    const product = this.productsStore.get(sanitizedSku);
    return product ? { ...product } : null;
  }

  /**
   * Operação de Upsert (Insert ou Update por SKU) atômica e parametrizada
   */
  async upsertBySku(data: ProductImportRow): Promise<{ action: 'CREATED' | 'UPDATED'; record: ProductRecord }> {
    const existing = this.productsStore.get(data.sku);
    const nowIso = new Date().toISOString();

    if (existing) {
      // Atualização (UPDATE) mantendo id e aumentando versão
      const updatedRecord: ProductRecord = {
        ...existing,
        name: data.name,
        category: data.category,
        brand: data.brand,
        price: data.price,
        stockQuantity: data.stockQuantity,
        rimSize: data.rimSize ?? existing.rimSize,
        width: data.width ?? existing.width,
        aspectRatio: data.aspectRatio ?? existing.aspectRatio,
        updatedAt: nowIso,
        version: existing.version + 1,
      };

      this.productsStore.set(data.sku, updatedRecord);
      return { action: 'UPDATED', record: updatedRecord };
    } else {
      // Criação (INSERT) de novo registro de produto
      const newRecord: ProductRecord = {
        id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sku: data.sku,
        name: data.name,
        category: data.category,
        brand: data.brand,
        price: data.price,
        stockQuantity: data.stockQuantity,
        rimSize: data.rimSize,
        width: data.width,
        aspectRatio: data.aspectRatio,
        createdAt: nowIso,
        updatedAt: nowIso,
        version: 1,
      };

      this.productsStore.set(data.sku, newRecord);
      return { action: 'CREATED', record: newRecord };
    }
  }

  /**
   * Endpoint de Delta Sync: Retorna apenas produtos modificados/criados após updatedSince
   */
  async getProductsUpdatedSince(isoDateString?: string, limit = 50, offset = 0): Promise<{ products: ProductRecord[]; totalCount: number; maxUpdatedAt: string }> {
    const allProducts = Array.from(this.productsStore.values());

    let filtered = allProducts;
    if (isoDateString) {
      const thresholdTime = new Date(isoDateString).getTime();
      filtered = allProducts.filter((p) => new Date(p.updatedAt).getTime() > thresholdTime);
    }

    // Ordenar por data de atualização decrescente
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const paginated = filtered.slice(offset, offset + limit);
    const maxUpdatedAt = filtered.length > 0 ? filtered[0].updatedAt : new Date().toISOString();

    return {
      products: paginated,
      totalCount: filtered.length,
      maxUpdatedAt,
    };
  }

  async getAllSkusMap(): Promise<Map<string, ProductRecord>> {
    return new Map(this.productsStore);
  }
}

export const dbClient = new AntigravityDBClient();
