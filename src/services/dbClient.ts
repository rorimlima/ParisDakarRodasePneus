import { ProductImportRow } from '../schemas/productSchema.js';
import { Product, ProductCategory } from '../types/index.js';
import { COLLECTIONS, firestore } from '../config/firestore.js';

/**
 * Produto como fica guardado no Firestore: o mesmo formato que a loja usa,
 * mais os metadados de sincronização.
 *
 * O documento carrega o formato completo (specs, imagens, veículos
 * compatíveis) e não o formato reduzido da planilha, porque é ele que
 * alimenta o site. A importação de planilha preenche o que consegue e
 * preserva o resto do que já estava gravado.
 */
export interface ProductRecord extends Product {
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** A planilha traz RODA/PNEU/ACESSORIO; o catálogo usa as categorias da loja. */
const IMPORT_CATEGORY_MAP: Record<string, ProductCategory> = {
  RODA: 'rodas',
  PNEU: 'pneus',
  ACESSORIO: 'acessorios'
};

/**
 * O SKU é a chave natural do produto e vira o id do documento, o que torna o
 * upsert atômico sem precisar consultar antes. Barra e ponto têm significado
 * em caminhos do Firestore, então são neutralizados.
 */
const skuToDocId = (sku: string): string => sku.trim().replace(/[/.#$[\]]/g, '_');

  constructor() {
    // Zero dados de demonstração: apenas itens reais do banco
  }

  async findBySku(skuParam: string): Promise<ProductRecord | null> {
    const snapshot = await this.collection.doc(skuToDocId(String(skuParam))).get();
    return snapshot.exists ? (snapshot.data() as ProductRecord) : null;
  }

  /**
   * Insere ou atualiza um produto vindo da planilha, por SKU.
   *
   * Numa atualização, só os campos que a planilha realmente traz são
   * sobrescritos: descrição, fotos, specs e compatibilidade cadastradas no
   * painel continuam de pé, senão cada importação de estoque apagaria o
   * trabalho de cadastro.
   */
  async upsertBySku(
    data: ProductImportRow
  ): Promise<{ action: 'CREATED' | 'UPDATED'; record: ProductRecord }> {
    const docRef = this.collection.doc(skuToDocId(data.sku));
    const nowIso = new Date().toISOString();

    return firestore.runTransaction(async (tx) => {
      const snapshot = await tx.get(docRef);
      const existing = snapshot.exists ? (snapshot.data() as ProductRecord) : null;

      if (existing) {
        const updated: ProductRecord = {
          ...existing,
          name: data.name,
          brand: data.brand,
          price: data.price,
          stockQuantity: data.stockQuantity,
          inStock: data.stockQuantity > 0,
          category: IMPORT_CATEGORY_MAP[data.category] ?? existing.category,
          specs: {
            ...existing.specs,
            aro: data.rimSize ?? existing.specs?.aro,
            tala: data.width ?? existing.specs?.tala
          },
          updatedAt: nowIso,
          version: existing.version + 1
        };

        tx.set(docRef, updated);
        return { action: 'UPDATED' as const, record: updated };
      }

      const created: ProductRecord = {
        id: docRef.id,
        sku: data.sku,
        name: data.name,
        brand: data.brand,
        category: IMPORT_CATEGORY_MAP[data.category] ?? 'acessorios',
        price: data.price,
        stockQuantity: data.stockQuantity,
        inStock: data.stockQuantity > 0,
        description: '',
        image: '',
        specs: { aro: data.rimSize, tala: data.width },
        compatibleVehicles: [],
        rating: 0,
        reviewsCount: 0,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        version: 1
      };

      tx.set(docRef, created);
      return { action: 'CREATED' as const, record: created };
    });
  }

  /** Grava um produto completo vindo do painel administrativo. */
  async saveProduct(product: Product): Promise<ProductRecord> {
    const docRef = this.collection.doc(skuToDocId(product.sku));
    const nowIso = new Date().toISOString();
    const snapshot = await docRef.get();
    const existing = snapshot.exists ? (snapshot.data() as ProductRecord) : null;

    const record: ProductRecord = {
      ...product,
      id: docRef.id,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      version: (existing?.version ?? 0) + 1
    };

    await docRef.set(record);
    return record;
  }

  async deleteBySku(sku: string): Promise<boolean> {
    const docRef = this.collection.doc(skuToDocId(sku));
    const snapshot = await docRef.get();
    if (!snapshot.exists) return false;

    await docRef.delete();
    return true;
  }

  async listProducts(): Promise<ProductRecord[]> {
    const snapshot = await this.collection.orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data() as ProductRecord);
  }

  /**
   * Delta Sync: devolve o que mudou depois de `isoDateString`.
   *
   * updatedAt é gravado em ISO 8601 UTC, cuja ordem alfabética coincide com a
   * ordem cronológica — por isso a comparação de string do Firestore funciona
   * aqui e não é preciso converter para Timestamp.
   */
  async getProductsUpdatedSince(
    isoDateString?: string,
    limit = 50,
    offset = 0
  ): Promise<{ products: ProductRecord[]; totalCount: number; maxUpdatedAt: string }> {
    let query = this.collection.orderBy('updatedAt', 'desc');
    if (isoDateString) {
      query = query.where('updatedAt', '>', isoDateString);
    }

    // O total precisa refletir o filtro inteiro, não só a página devolvida.
    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    const pageSnapshot = await query.offset(offset).limit(limit).get();
    const products = pageSnapshot.docs.map((doc) => doc.data() as ProductRecord);

    const newestSnapshot = await this.collection.orderBy('updatedAt', 'desc').limit(1).get();
    const maxUpdatedAt = newestSnapshot.empty
      ? new Date().toISOString()
      : (newestSnapshot.docs[0].data() as ProductRecord).updatedAt;

    return { products, totalCount, maxUpdatedAt };
  }

  async getAllSkusMap(): Promise<Map<string, ProductRecord>> {
    const products = await this.listProducts();
    return new Map(products.map((p) => [p.sku, p]));
  }

  /** Round-trip de leitura usado pelo diagnóstico de saúde. */
  async ping(): Promise<number> {
    const started = Date.now();
    await this.collection.limit(1).get();
    return Date.now() - started;
  }
}

export const dbClient = new FirestoreProductRepository();
