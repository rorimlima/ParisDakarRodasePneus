import dotenv from 'dotenv';
import { dbClient } from '../services/dbClient.js';
import { isUsingEmulator } from '../config/firestore.js';
import { MOCK_PRODUCTS } from '../data/mockProducts.js';
import { Product } from '../types/index.js';

dotenv.config();

/**
 * Popula o Firestore com o catálogo de exemplo (MOCK_PRODUCTS).
 *
 *   npm run seed:catalog                    # contra o emulador, sem confirmação
 *   SEED_CONFIRM_PRODUCTION=yes npm run seed:catalog   # contra o projeto real
 *
 * Idempotente: grava por SKU, então rodar de novo atualiza em vez de
 * duplicar. Não apaga nada — produtos que só existem no banco continuam lá.
 *
 * Trava de segurança: com o banco de produção já carregando dados reais de
 * clientes, este script se recusa a rodar fora do emulador sem confirmação
 * explícita. Os SKUs de exemplo (PD-DAKAR-..., PD-MAX-...) não colidem com
 * SKUs reais, então o risco não é sobrescrever nada — é poluir o catálogo
 * real com itens de teste por engano, o que só se percebe depois.
 */
const main = async () => {
  if (!isUsingEmulator && process.env.SEED_CONFIRM_PRODUCTION !== 'yes') {
    console.error(
      '\n❌ Recusando gravar no PROJETO REAL sem confirmação explícita.\n' +
        `   Projeto alvo: "${process.env.FIREBASE_PROJECT_ID ?? 'não definido'}"\n\n` +
        '   Este comando gravaria produtos de EXEMPLO num banco que já tem\n' +
        '   dados reais de catálogo. Se é isso mesmo que você quer, rode:\n\n' +
        '     SEED_CONFIRM_PRODUCTION=yes npm run seed:catalog\n\n' +
        '   Para desenvolvimento local, aponte para o emulador:\n\n' +
        '     npm run emulator\n' +
        '     FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:catalog\n'
    );
    process.exit(1);
  }

  const target = isUsingEmulator
    ? `EMULADOR (${process.env.FIRESTORE_EMULATOR_HOST})`
    : `PROJETO REAL "${process.env.FIREBASE_PROJECT_ID ?? 'não definido'}" (confirmado)`;

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
  console.log(`\n✅ ${created} criado(s), ${updated} atualizado(s). Catálogo agora tem ${total} SKU(s) no total.\n`);
  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Falha ao semear o catálogo:', error);
  process.exit(1);
});
