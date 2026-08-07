import { dbClient } from '../services/dbClient.js';
import { COLLECTIONS, firestore, isUsingEmulator } from '../config/firestore.js';
import { ProductImportRow } from '../schemas/productSchema.js';
import { Product } from '../types/index.js';

/**
 * Testa a persistência real contra o emulador do Firestore.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *   GOOGLE_CLOUD_PROJECT=demo-paris-dakar npm run test:db
 *
 * Recusa rodar fora do emulador: o teste apaga a coleção de produtos.
 */
let failures = 0;

const check = (label: string, condition: boolean, detail = '') => {
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const wipeProducts = async () => {
  const snapshot = await firestore.collection(COLLECTIONS.PRODUCTS).get();
  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
};

const importRow = (over: Partial<ProductImportRow> = {}): ProductImportRow =>
  ({
    sku: 'PD-TEST-0001',
    name: 'Roda Teste Aro 17',
    category: 'RODA',
    brand: 'Paris Dakar',
    price: 2890,
    stockQuantity: 10,
    rimSize: '17',
    width: '9.0',
    aspectRatio: undefined,
    ...over
  }) as ProductImportRow;

const main = async () => {
  if (!isUsingEmulator) {
    console.error('❌ Recusando rodar: FIRESTORE_EMULATOR_HOST não está definido.');
    console.error('   Este teste apaga dados e nunca deve tocar um banco real.');
    process.exit(1);
  }

  console.log(`\n🔌 Emulador: ${process.env.FIRESTORE_EMULATOR_HOST}\n`);
  await wipeProducts();

  console.log('1) Insert e leitura');
  const created = await dbClient.upsertBySku(importRow());
  check('upsert devolve CREATED', created.action === 'CREATED', created.action);
  check('versão inicial é 1', created.record.version === 1);
  check('inStock derivado do estoque', created.record.inStock === true);
  check('categoria mapeada RODA -> rodas', created.record.category === 'rodas', created.record.category);

  const fetched = await dbClient.findBySku('PD-TEST-0001');
  check('produto persiste e é lido de volta', fetched?.name === 'Roda Teste Aro 17');

  console.log('\n2) Upsert atualiza sem duplicar');
  const updated = await dbClient.upsertBySku(importRow({ price: 3100, stockQuantity: 0 }));
  check('segunda gravação é UPDATED', updated.action === 'UPDATED', updated.action);
  check('versão incrementa', updated.record.version === 2, String(updated.record.version));
  check('preço atualizado', updated.record.price === 3100);
  check('estoque zerado marca inStock=false', updated.record.inStock === false);
  const all = await dbClient.listProducts();
  check('não duplicou o SKU', all.length === 1, `${all.length} documentos`);

  console.log('\n3) Importação preserva o cadastro feito no painel');
  const rich: Product = {
    ...(updated.record as Product),
    description: 'Descrição escrita no painel',
    image: 'https://exemplo/foto.jpg',
    compatibleVehicles: ['Toyota Hilux 2020-2026'],
    specs: { ...updated.record.specs, furacao: '6x139.7', offset: 'ET -12' }
  };
  await dbClient.saveProduct(rich);
  const afterReimport = await dbClient.upsertBySku(importRow({ price: 2999, stockQuantity: 7 }));
  check('descrição preservada', afterReimport.record.description === 'Descrição escrita no painel');
  check('imagem preservada', afterReimport.record.image === 'https://exemplo/foto.jpg');
  check('furação preservada', afterReimport.record.specs.furacao === '6x139.7');
  check('veículos preservados', afterReimport.record.compatibleVehicles.length === 1);
  check('preço da planilha aplicado', afterReimport.record.price === 2999);

  console.log('\n4) Delta sync');
  const marker = new Date().toISOString();
  await new Promise((r) => setTimeout(r, 15));
  await dbClient.upsertBySku(importRow({ sku: 'PD-TEST-0002', name: 'Pneu Teste', category: 'PNEU' }));

  const delta = await dbClient.getProductsUpdatedSince(marker);
  check('delta traz só o que mudou depois do marcador', delta.products.length === 1, `${delta.products.length}`);
  check('delta identifica o SKU certo', delta.products[0]?.sku === 'PD-TEST-0002');

  const full = await dbClient.getProductsUpdatedSince(undefined, 50, 0);
  check('sem filtro traz os dois produtos', full.totalCount === 2, `${full.totalCount}`);

  console.log('\n5) Paginação');
  const page = await dbClient.getProductsUpdatedSince(undefined, 1, 0);
  check('limit respeitado', page.products.length === 1);
  check('totalCount reflete o filtro inteiro, não a página', page.totalCount === 2, `${page.totalCount}`);
  const page2 = await dbClient.getProductsUpdatedSince(undefined, 1, 1);
  check('offset avança a página', page2.products[0]?.sku !== page.products[0]?.sku);

  console.log('\n6) Delete');
  check('delete devolve true', (await dbClient.deleteBySku('PD-TEST-0002')) === true);
  check('delete de SKU inexistente devolve false', (await dbClient.deleteBySku('NAO-EXISTE')) === false);
  check('sobrou 1 produto', (await dbClient.listProducts()).length === 1);

  console.log('\n7) SKU com caracteres de caminho');
  const odd = await dbClient.upsertBySku(importRow({ sku: 'PD-A_B-01' }));
  check('SKU preservado no documento', odd.record.sku === 'PD-A_B-01');
  check('lê de volta pelo SKU original', (await dbClient.findBySku('PD-A_B-01'))?.sku === 'PD-A_B-01');

  await wipeProducts();

  console.log(`\n${failures === 0 ? '✅ Todos os testes passaram' : `❌ ${failures} teste(s) falharam`}\n`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
