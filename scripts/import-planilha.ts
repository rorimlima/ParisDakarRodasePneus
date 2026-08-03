/**
 * Importação da planilha do ERP direto para o Firestore, via Admin SDK.
 *
 * Alternativa ao upload pelo painel — pensada para automatizar: o ERP exporta o
 * RPR053 numa pasta e um cron roda este script. Usa exatamente as mesmas funções
 * de leitura, classificação e publicação da versão do navegador, então o resultado
 * é idêntico ao da importação manual.
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   npx tsx scripts/import-planilha.ts ./RPR053_LISTAPRECO.xlsx [--simular] [--manter-ausentes]
 *
 * A service account NUNCA vai para o repositório — mantenha o arquivo fora do git
 * (já coberto pelo .gitignore) e com permissão 600.
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { cert, initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { lerPlanilhaDeBuffer } from '../src/services/planilhaImportService';
import {
  criarProdutoDeErp,
  normalizarEstadoPublicacao,
  prepararParaGravar
} from '../src/services/catalogService';
import { construirCategoria, slugify } from '../src/config/fichaTecnica';
import type {
  CategoriaCatalogo,
  ProdutoCatalogo,
  ResultadoImportacao
} from '../src/types/catalog';

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------

const argumentos = process.argv.slice(2);
const caminho = argumentos.find((a) => !a.startsWith('--'));
const simular = argumentos.includes('--simular');
const desativarAusentes = !argumentos.includes('--manter-ausentes');

if (!caminho) {
  console.error(
    'Informe o caminho da planilha.\n' +
      'Uso: npx tsx scripts/import-planilha.ts ./RPR053.xlsx [--simular] [--manter-ausentes]'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Firebase Admin
// ---------------------------------------------------------------------------

const caminhoCredencial = process.env.GOOGLE_APPLICATION_CREDENTIALS;
initializeApp({
  credential: caminhoCredencial
    ? cert(JSON.parse(readFileSync(caminhoCredencial, 'utf-8')))
    : applicationDefault()
});

const db = getFirestore();

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

async function principal(): Promise<void> {
  const nomeArquivo = basename(caminho!);
  console.log(`\n▸ Lendo ${nomeArquivo}...`);

  const planilha = await lerPlanilhaDeBuffer(readFileSync(caminho!), nomeArquivo);
  console.log(`  ${planilha.linhas.length} linhas válidas de ${planilha.totalLinhasBrutas} lidas.`);
  planilha.erros.slice(0, 10).forEach((e) => console.warn(`  ! ${e}`));

  const id = `imp-${Date.now()}-cli`;
  const iniciadoEm = new Date().toISOString();

  // --- categorias ---------------------------------------------------------
  console.log('▸ Sincronizando categorias...');
  const snapCategorias = await db.collection('categories').get();
  const categorias = new Map<string, CategoriaCatalogo>(
    snapCategorias.docs.map((d) => [d.id, d.data() as CategoriaCatalogo])
  );

  const criadas: string[] = [];
  for (const tipo of new Set(planilha.linhas.map((l) => l.tipoProduto))) {
    const slug = slugify(tipo);
    if (categorias.has(slug)) continue;
    const nova = construirCategoria(tipo);
    categorias.set(slug, nova);
    criadas.push(tipo);
    if (!simular) await db.doc(`categories/${slug}`).set(nova, { merge: true });
  }
  console.log(`  ${criadas.length} categoria(s) nova(s): ${criadas.join(', ') || '—'}`);

  // --- comparação ---------------------------------------------------------
  console.log('▸ Comparando com o catálogo atual...');
  const snapProdutos = await db.collection('products').get();
  const atuais = new Map<string, ProdutoCatalogo>(
    snapProdutos.docs.map((d) => [d.id, d.data() as ProdutoCatalogo])
  );

  const resultado: ResultadoImportacao = {
    id,
    arquivo: nomeArquivo,
    iniciadoEm,
    executadoPor: `cli:${process.env.USER || 'automacao'}`,
    totalLinhas: planilha.linhas.length,
    criados: 0,
    atualizados: 0,
    inalterados: 0,
    desativados: 0,
    reativados: 0,
    rejeitados: planilha.totalLinhasBrutas - planilha.linhas.length,
    ausentesNaPlanilha: [],
    categoriasCriadas: criadas,
    erros: planilha.erros,
    linhas: []
  };

  const pendentes: Array<{ produto: ProdutoCatalogo; custo: Record<string, unknown> }> = [];

  for (const linha of planilha.linhas) {
    const existente = atuais.get(linha.codigo);
    const categoria = categorias.get(slugify(linha.tipoProduto)) || null;

    let produto: ProdutoCatalogo;
    if (!existente) {
      produto = criarProdutoDeErp(linha);
      resultado.criados++;
    } else {
      const base: ProdutoCatalogo = {
        ...existente,
        descricao: linha.descricao,
        descricaoDetalhada: linha.descricaoDetalhada,
        referencia: linha.referencia,
        tipoProduto: linha.tipoProduto,
        categoriaSlug: slugify(linha.tipoProduto),
        unidade: linha.unidade,
        quantidade: linha.quantidade,
        valorVenda: linha.valorVenda,
        localizacao: linha.localizacao,
        grupoProdutoCodigo: linha.grupoProdutoCodigo,
        estoqueDescricao: linha.estoqueDescricao,
        empresa: linha.empresa
      };
      produto = normalizarEstadoPublicacao(base) as ProdutoCatalogo;

      if (existente.ativo && !produto.ativo) resultado.desativados++;
      else if (!existente.ativo && produto.ativo) resultado.reativados++;
      else if (existente.quantidade !== produto.quantidade || existente.valorVenda !== produto.valorVenda)
        resultado.atualizados++;
      else resultado.inalterados++;
    }

    const pronto = prepararParaGravar(produto, categoria);
    pronto.importadoEm = iniciadoEm;
    pronto.ultimaImportacaoId = id;

    pendentes.push({
      produto: pronto,
      custo: {
        codigo: pronto.codigo,
        valorReposicao: linha.valorReposicao,
        valorPublicoSugerido: linha.valorPublicoSugerido,
        valorGarantia: linha.valorGarantia,
        atualizadoEm: iniciadoEm,
        ultimaImportacaoId: id
      }
    });
  }

  const codigosNaPlanilha = new Set(planilha.linhas.map((l) => l.codigo));
  resultado.ausentesNaPlanilha = [...atuais.values()]
    .filter((p) => !codigosNaPlanilha.has(p.codigo) && (p.ativo || p.quantidade > 0))
    .map((p) => p.codigo);

  if (simular) {
    console.log('\n▸ SIMULAÇÃO — nada foi gravado.');
    imprimirResumo(resultado);
    return;
  }

  // --- gravação -----------------------------------------------------------
  console.log(`▸ Gravando ${pendentes.length} produtos...`);
  for (let i = 0; i < pendentes.length; i += 200) {
    const lote = db.batch();
    for (const { produto, custo } of pendentes.slice(i, i + 200)) {
      lote.set(db.doc(`products/${produto.codigo}`), produto, { merge: true });
      lote.set(db.doc(`productCosts/${produto.codigo}`), custo, { merge: true });
    }
    await lote.commit();
    process.stdout.write(`\r  ${Math.min(i + 200, pendentes.length)}/${pendentes.length}`);
  }
  console.log('');

  // --- ausentes -----------------------------------------------------------
  if (desativarAusentes && resultado.ausentesNaPlanilha.length > 0) {
    console.log(`▸ Desativando ${resultado.ausentesNaPlanilha.length} produtos ausentes...`);
    for (let i = 0; i < resultado.ausentesNaPlanilha.length; i += 400) {
      const lote = db.batch();
      for (const codigo of resultado.ausentesNaPlanilha.slice(i, i + 400)) {
        lote.update(db.doc(`products/${codigo}`), {
          ativo: false,
          ativoManual: false,
          quantidade: 0,
          motivoInativacao: 'estoque-zerado',
          atualizadoEm: new Date().toISOString()
        });
      }
      await lote.commit();
    }
    resultado.desativados += resultado.ausentesNaPlanilha.length;
  }

  resultado.concluidoEm = new Date().toISOString();
  await db.doc(`imports/${id}`).set({ ...resultado, linhas: [], gravadoEm: FieldValue.serverTimestamp() });

  imprimirResumo(resultado);
}

function imprimirResumo(r: ResultadoImportacao): void {
  console.log('\n────────────────────────────────────────');
  console.log(`  Linhas lidas .......... ${r.totalLinhas}`);
  console.log(`  Criados ............... ${r.criados}`);
  console.log(`  Atualizados ........... ${r.atualizados}`);
  console.log(`  Reativados ............ ${r.reativados}`);
  console.log(`  Desativados ........... ${r.desativados}`);
  console.log(`  Sem alteração ......... ${r.inalterados}`);
  console.log(`  Ausentes na planilha .. ${r.ausentesNaPlanilha.length}`);
  console.log(`  Categorias criadas .... ${r.categoriasCriadas.length}`);
  console.log('────────────────────────────────────────');
  console.log(
    '\nProdutos novos entram DESATIVADOS. Preencha a ficha técnica no painel\n' +
      'e clique em "Ativar produto no site" para publicá-los.\n'
  );
}

principal().catch((erro) => {
  console.error('\n✖ Importação falhou:', erro);
  process.exit(1);
});
