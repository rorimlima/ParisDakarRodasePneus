import dotenv from 'dotenv';
import { dbClient } from '../services/dbClient.js';
import { isUsingEmulator } from '../config/firestore.js';
import { MOCK_PRODUCTS } from '../data/mockProducts.js';
import { Product } from '../types/index.js';

dotenv.config();

/**
 * Popula o Firestore com o catálogo inicial.
 *
 *   npm run seed:catalog
 *
 * Idempotente: grava por SKU, então rodar de novo atualiza em vez de
 * duplicar. Não apaga nada — produtos que só existem no banco continuam lá.
 */
const main = async () => {
  const target = isUsingEmulator
    ? `EMULADOR (${process.env.FIRESTORE_EMULATOR_HOST})`
    : `PROJETO REAL "${process.env.FIREBASE_PROJECT_ID ?? 'não definido'}"`;

  console.log(`\n🌱 Semeando ${MOCK_PRODUCTS.length} produtos em: ${target}\n`);

  let created = 0;
  let updated = 0;

  for (const product of MOCK_PRODUCTS as Product[]) {
    const existing = await dbClient.findBySku(product.sku);
    await dbClient.saveProduct(product);

    if (existing) {
      updated++;
      console.log(`  ↻ ${product.sku} — ${product.name}`);
    } else {
      created++;
      console.log(`  + ${product.sku} — ${product.name}`);
    }
  }

  const total = (await dbClient.listProducts()).length;
  console.log(`\n✅ ${created} criado(s), ${updated} atualizado(s). Catálogo agora tem ${total} SKU(s).\n`);
  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Falha ao semear o catálogo:', error);
  process.exit(1);
});
