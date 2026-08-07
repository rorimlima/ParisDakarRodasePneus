/**
 * Auditoria read-only da conexão de produção antes de ligar a vitrine na API.
 *
 *   npm run verify:prod -- https://www.parisdakarrodas.com.br
 *
 * Não grava nada. Confere:
 *  1) /health/db está "ok" e persistente.
 *  2) /api/v1/products responde e devolve um lote de amostra.
 *  3) Cada item da amostra tem o formato que o storefront (ProductCard,
 *     ProductDetailModal) espera — sem isso, o card renderiza quebrado ou o
 *     JSON.parse explode na tela do cliente.
 *  4) Sinaliza qualidade de dado (imagem vazia, sem veículos compatíveis) —
 *     não bloqueia o deploy, mas avisa o que vai aparecer incompleto na loja.
 *
 * Saída não-zero se algo estrutural falhar, para travar CI se for usado lá.
 */

interface ProductSample {
  sku?: unknown;
  name?: unknown;
  price?: unknown;
  category?: unknown;
  image?: unknown;
  specs?: unknown;
  compatibleVehicles?: unknown;
  isActive?: unknown;
}

const REQUIRED_FIELDS: Array<keyof ProductSample> = ['sku', 'name', 'price', 'category'];

let structuralFailures = 0;
let dataQualityWarnings = 0;

const ok = (msg: string) => console.log(`  ✅ ${msg}`);
const fail = (msg: string) => {
  structuralFailures++;
  console.log(`  ❌ ${msg}`);
};
const warn = (msg: string) => {
  dataQualityWarnings++;
  console.log(`  ⚠️  ${msg}`);
};

const main = async () => {
  const baseUrl = process.argv[2]?.replace(/\/$/, '');
  if (!baseUrl) {
    console.error('\nUso: npm run verify:prod -- https://seu-dominio.com.br\n');
    process.exit(1);
  }

  console.log(`\n🔎 Auditando: ${baseUrl}\n`);

  // 1) Saúde do banco
  console.log('1) GET /health/db');
  try {
    const res = await fetch(`${baseUrl}/health/db`);
    const body = await res.json();
    ok(`HTTP ${res.status}`);
    if (body.status === 'ok') ok(`status: ok`);
    else fail(`status: ${body.status} (esperado "ok")`);
    if (body.persistent === true) ok('persistent: true');
    else fail(`persistent: ${body.persistent} (esperado true)`);
    console.log(`     armazenamento: ${body.activeStore}`);
    for (const w of body.warnings ?? []) console.log(`     aviso do backend: ${w}`);
  } catch (error) {
    fail(`falha de rede: ${(error as Error).message}`);
  }

  // 2) Catálogo público
  console.log('\n2) GET /api/v1/products (amostra)');
  let sample: ProductSample[] = [];
  let totalCount = 0;
  try {
    const res = await fetch(`${baseUrl}/api/v1/products?limit=25`);
    const body = await res.json();
    if (res.status === 200 && body.status === 'success') {
      ok(`HTTP 200, status success`);
    } else {
      fail(`HTTP ${res.status}, body.status=${body.status}`);
    }
    sample = body.data ?? [];
    totalCount = body.meta?.totalCount ?? 0;
    console.log(`     total no banco: ${totalCount} | amostra recebida: ${sample.length}`);

    if (totalCount < 900) {
      warn(`totalCount=${totalCount} — menor do que os "1000+" esperados. Confira se é o projeto certo.`);
    } else {
      ok(`totalCount compatível com "1000+ registros"`);
    }
  } catch (error) {
    fail(`falha de rede: ${(error as Error).message}`);
  }

  // 3) Formato de cada item da amostra
  console.log('\n3) Formato dos produtos (compatibilidade com o storefront)');
  let missingImage = 0;
  let missingVehicles = 0;
  let missingSpecs = 0;

  for (const [i, p] of sample.entries()) {
    for (const field of REQUIRED_FIELDS) {
      if (p[field] === undefined || p[field] === null || p[field] === '') {
        fail(`item #${i} (sku=${String(p.sku)}) sem campo obrigatório "${field}"`);
      }
    }
    if (typeof p.price === 'number' && p.price <= 0) {
      fail(`item #${i} (sku=${String(p.sku)}) com preço inválido: ${p.price}`);
    }
    if (!p.image || typeof p.image !== 'string') missingImage++;
    if (!Array.isArray(p.compatibleVehicles) || p.compatibleVehicles.length === 0) missingVehicles++;
    if (!p.specs || Object.keys(p.specs as object).length === 0) missingSpecs++;
  }

  if (sample.length > 0 && structuralFailures === 0) {
    ok(`todos os ${sample.length} itens da amostra têm o formato esperado`);
  }
  if (missingImage > 0) {
    warn(`${missingImage}/${sample.length} item(ns) sem imagem — card vai renderizar com foto quebrada`);
  }
  if (missingVehicles > 0) {
    warn(`${missingVehicles}/${sample.length} item(ns) sem veículos compatíveis cadastrados`);
  }
  if (missingSpecs > 0) {
    warn(`${missingSpecs}/${sample.length} item(ns) sem especificações técnicas`);
  }

  // 4) ETag / cache
  console.log('\n4) Suporte a ETag (economia de banda)');
  try {
    const first = await fetch(`${baseUrl}/api/v1/products?limit=1`);
    const etag = first.headers.get('etag');
    if (etag) {
      const revalidate = await fetch(`${baseUrl}/api/v1/products?limit=1`, {
        headers: { 'If-None-Match': etag }
      });
      if (revalidate.status === 304) ok('ETag + HTTP 304 funcionando');
      else warn(`ETag presente mas revalidação devolveu HTTP ${revalidate.status} (esperado 304)`);
    } else {
      warn('resposta sem cabeçalho ETag');
    }
  } catch (error) {
    warn(`não verificado: ${(error as Error).message}`);
  }

  console.log('\n──────────────────────────────────────────────');
  console.log(`Falhas estruturais : ${structuralFailures}`);
  console.log(`Avisos de qualidade: ${dataQualityWarnings}`);
  console.log('──────────────────────────────────────────────\n');

  if (structuralFailures > 0) {
    console.log('❌ NÃO ligue VITE_USE_API_CATALOG ainda — corrija as falhas estruturais acima primeiro.\n');
    process.exit(1);
  }

  console.log('✅ Estrutura compatível. Seguro ligar a vitrine na API.\n');
  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Erro ao auditar:', error);
  process.exit(1);
});
