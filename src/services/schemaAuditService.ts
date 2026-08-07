import { firestore } from '../config/firestore.js';

/**
 * Introspecção read-only do Firestore de produção.
 *
 * Existe porque o banco real tem uma coleção `products` escrita por um
 * sistema externo (importador de planilha fora deste repositório), com um
 * schema que `dbClient.ts` não conhecia até este ponto. Em vez de adivinhar
 * os nomes de campo a partir de capturas de tela parciais, esta rota lê uma
 * amostra real, dentro da própria função — que já tem credencial de
 * produção — e devolve nomes de campo, tipos e um exemplo truncado de cada
 * um. Nenhum dado sensível de valor completo é necessário para desenhar o
 * adaptador, só a forma.
 *
 * Só é chamada manualmente por um administrador autenticado (ver
 * catalogRoutes.ts) — não faz parte do caminho normal de leitura do site.
 */

const MAX_EXAMPLE_LENGTH = 80;
const MAX_CATEGORY_SAMPLES = 40;

interface FieldSummary {
  types: string[];
  presentIn: number;
  example: string;
}

interface CollectionAudit {
  totalCount: number;
  sampleSize: number;
  fields: Record<string, FieldSummary>;
}

const describeValue = (value: unknown): { type: string; example: string } => {
  if (value === null) return { type: 'null', example: 'null' };
  if (Array.isArray(value)) {
    return { type: 'array', example: `[${value.length} item(ns)]` };
  }
  if (value && typeof value === 'object') {
    // Timestamps do Firestore chegam como objeto com toDate(); trata à parte.
    if (typeof (value as { toDate?: unknown }).toDate === 'function') {
      return { type: 'timestamp', example: String((value as { toDate: () => Date }).toDate().toISOString()) };
    }
    return { type: 'map', example: `{${Object.keys(value as object).join(', ')}}` };
  }

  const type = typeof value;
  const raw = String(value);
  const example = raw.length > MAX_EXAMPLE_LENGTH ? `${raw.slice(0, MAX_EXAMPLE_LENGTH)}…` : raw;
  return { type, example };
};

const auditCollection = async (name: string, sampleSize: number): Promise<CollectionAudit> => {
  const collectionRef = firestore.collection(name);

  const [countSnapshot, sampleSnapshot] = await Promise.all([
    collectionRef.count().get(),
    collectionRef.limit(sampleSize).get()
  ]);

  const fields: Record<string, FieldSummary> = {};

  for (const doc of sampleSnapshot.docs) {
    const data = doc.data();
    for (const [key, value] of Object.entries(data)) {
      const { type, example } = describeValue(value);
      const existing = fields[key];

      if (!existing) {
        fields[key] = { types: [type], presentIn: 1, example };
      } else {
        existing.presentIn += 1;
        if (!existing.types.includes(type)) existing.types.push(type);
      }
    }
  }

  return {
    totalCount: countSnapshot.data().count,
    sampleSize: sampleSnapshot.size,
    fields
  };
};

export const schemaAuditService = {
  /**
   * Audita `products`, `categories` e `productCosts` — as três coleções
   * visíveis no console de produção. Uma coleção ausente não derruba a
   * auditoria das outras.
   */
  async auditKnownCollections() {
    const targets = ['products', 'categories', 'productCosts'];
    const result: Record<string, CollectionAudit | { error: string }> = {};

    await Promise.all(
      targets.map(async (name) => {
        try {
          result[name] = await auditCollection(name, name === 'products' ? 60 : 20);
        } catch (error) {
          result[name] = { error: (error as Error).message };
        }
      })
    );

    // Slugs de categoria distintos ajudam a mapear o filtro de categoria do
    // site (rodas/pneus/kits-lift/...) para o que o sistema real usa.
    let categoriaSlugsSeen: string[] = [];
    try {
      const snapshot = await firestore.collection('products').limit(500).get();
      const slugs = new Set<string>();
      for (const doc of snapshot.docs) {
        const slug = doc.data().categoriaSlug;
        if (typeof slug === 'string') slugs.add(slug);
        if (slugs.size >= MAX_CATEGORY_SAMPLES) break;
      }
      categoriaSlugsSeen = [...slugs].sort();
    } catch {
      // Best-effort — a ausência do campo já aparece no relatório de fields.
    }

    return { collections: result, categoriaSlugsSeen };
  }
};
