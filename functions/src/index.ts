/**
 * Cloud Functions — Paris Dakar Rodas e Pneus.
 *
 * O que roda aqui é o que não pode depender do cliente:
 *  - `onProdutoEscrito`  reimpõe "estoque zerado ⇒ fora do site" mesmo que alguém
 *                        grave direto no Firestore burlando o app;
 *  - `definirPapel`      única via de concessão de papel (custom claim);
 *  - `simularDesconto`   recalcula o desconto à vista no servidor com o teto de 8%;
 *  - `registrarCotacao`  cria lead com rate limit e preço recalculado do catálogo.
 *
 * Região: southamerica-east1 (São Paulo) — menor latência para o público brasileiro.
 */

import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall, CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp();
const db = getFirestore();

setGlobalOptions({
  region: 'southamerica-east1',
  maxInstances: 10,
  memory: '256MiB',
  timeoutSeconds: 60
});

// ---------------------------------------------------------------------------
// Constantes de negócio (espelham src/types/catalog.ts)
// ---------------------------------------------------------------------------

const DESCONTO_MAXIMO_AVISTA = 8;
const PAPEIS_VALIDOS = ['senior', 'gerencia', 'admin', 'b2b', 'b2c'] as const;
const PAPEIS_ADMINISTRATIVOS = ['senior', 'gerencia', 'admin'];
const PAPEIS_COM_CUSTO = ['senior', 'gerencia'];

type Papel = (typeof PAPEIS_VALIDOS)[number];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const arredondar = (valor: number, casas = 2): number => {
  if (!Number.isFinite(valor)) return 0;
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
};

const numero = (valor: unknown, minimo = 0): number => {
  const n = typeof valor === 'number' ? valor : Number.parseFloat(String(valor ?? ''));
  return Number.isFinite(n) ? Math.max(n, minimo) : minimo;
};

const texto = (valor: unknown, limite: number): string =>
  String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite);

function papelDe(req: CallableRequest): Papel | 'visitante' {
  const bruto = req.auth?.token?.role;
  return typeof bruto === 'string' && (PAPEIS_VALIDOS as readonly string[]).includes(bruto)
    ? (bruto as Papel)
    : 'visitante';
}

function exigirPapel(req: CallableRequest, permitidos: string[]): Papel {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Faça login para executar esta operação.');
  }
  if (req.auth.token.email_verified !== true) {
    throw new HttpsError('permission-denied', 'Confirme seu e-mail antes de acessar o painel.');
  }
  const papel = papelDe(req);
  if (!permitidos.includes(papel)) {
    logger.warn('acesso negado', { uid: req.auth.uid, papel, permitidos });
    throw new HttpsError('permission-denied', 'Seu perfil não tem permissão para esta operação.');
  }
  return papel as Papel;
}

async function registrarAuditoria(evento: {
  acao: string;
  uid?: string;
  email?: string;
  alvo?: string;
  detalhes?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.collection('auditLog').add({
      ...evento,
      criadoEm: FieldValue.serverTimestamp()
    });
  } catch (erro) {
    logger.error('falha ao gravar auditoria', erro);
  }
}

// ---------------------------------------------------------------------------
// 1. Guardião da publicação
// ---------------------------------------------------------------------------

/**
 * Reimpõe `ativo === ativoManual && quantidade > 0` a cada escrita em products/{codigo}.
 *
 * As Security Rules já recusam a escrita incoerente vinda do cliente, mas escrita
 * via Admin SDK (script de importação, console do Firebase, integração futura do ERP)
 * ignora rules por completo. Este gatilho é a rede que pega esse caso — e é ele que
 * garante que zerar estoque tira o produto do site, venha a mudança de onde vier.
 */
export const onProdutoEscrito = onDocumentWritten('products/{codigo}', async (evento) => {
  const depois = evento.data?.after;
  if (!depois?.exists) return;

  const dados = depois.data() as Record<string, unknown>;
  const quantidade = numero(dados.quantidade);
  const ativoManual = dados.ativoManual !== false;
  const ativoEsperado = ativoManual && quantidade > 0;
  const motivoEsperado = ativoEsperado ? null : quantidade <= 0 ? 'estoque-zerado' : 'desativado-manualmente';

  const coerente = dados.ativo === ativoEsperado && (dados.motivoInativacao ?? null) === motivoEsperado;
  if (coerente) return;

  logger.info('corrigindo estado de publicação', {
    codigo: evento.params.codigo,
    ativoGravado: dados.ativo,
    ativoEsperado,
    quantidade
  });

  await depois.ref.update({
    ativo: ativoEsperado,
    ativoManual,
    quantidade,
    motivoInativacao: motivoEsperado,
    corrigidoPorGatilhoEm: FieldValue.serverTimestamp()
  });
});

// ---------------------------------------------------------------------------
// 2. Concessão de papel
// ---------------------------------------------------------------------------

/**
 * Única via de atribuição de papel. Escrever `role` num documento não concede nada:
 * as rules leem exclusivamente o custom claim, que só o Admin SDK assina.
 */
export const definirPapel = onCall(async (req) => {
  exigirPapel(req, ['senior']);

  const email = texto(req.data?.email, 160).toLowerCase();
  const papel = texto(req.data?.papel, 20) as Papel;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'E-mail inválido.');
  }
  if (!(PAPEIS_VALIDOS as readonly string[]).includes(papel)) {
    throw new HttpsError('invalid-argument', `Papel inválido. Use: ${PAPEIS_VALIDOS.join(', ')}.`);
  }

  const auth = getAuth();
  let usuario;
  try {
    usuario = await auth.getUserByEmail(email);
  } catch {
    throw new HttpsError('not-found', `Nenhuma conta encontrada para ${email}.`);
  }

  // Sênior não pode rebaixar a si mesmo — evita deixar o projeto sem dono.
  if (usuario.uid === req.auth?.uid && papel !== 'senior') {
    throw new HttpsError(
      'failed-precondition',
      'Você não pode remover o próprio papel de sênior. Peça a outro sênior.'
    );
  }

  await auth.setCustomUserClaims(usuario.uid, { role: papel });

  await db.doc(`users/${usuario.uid}`).set(
    {
      uid: usuario.uid,
      email,
      nome: texto(req.data?.nome, 120) || usuario.displayName || email,
      // Espelho para exibição. As rules NÃO leem este campo.
      papelExibicao: papel,
      atualizadoEm: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await registrarAuditoria({
    acao: 'papel.definido',
    uid: req.auth?.uid,
    email: req.auth?.token?.email as string | undefined,
    alvo: usuario.uid,
    detalhes: { emailAlvo: email, papel }
  });

  // O claim só entra em vigor no próximo refresh do ID token.
  return { ok: true, uid: usuario.uid, papel, aviso: 'O usuário precisa sair e entrar novamente.' };
});

// ---------------------------------------------------------------------------
// 3. Desconto à vista — teto de 8% recalculado no servidor
// ---------------------------------------------------------------------------

/**
 * Recalcula o desconto lendo preço e custo direto do Firestore.
 *
 * O front simula para dar resposta instantânea, mas quem vale é este retorno: o
 * cliente não envia preço nem custo, só o código e o percentual pretendido.
 */
export const simularDesconto = onCall(async (req) => {
  const papel = exigirPapel(req, PAPEIS_ADMINISTRATIVOS);

  const codigo = texto(req.data?.codigo, 40);
  if (!codigo) throw new HttpsError('invalid-argument', 'Informe o código do produto.');

  const produtoSnap = await db.doc(`products/${codigo}`).get();
  if (!produtoSnap.exists) {
    throw new HttpsError('not-found', `Produto ${codigo} não encontrado.`);
  }

  const valorVenda = numero(produtoSnap.get('valorVenda'));
  const pedido = numero(req.data?.percentual);
  const aplicado = arredondar(Math.min(pedido, DESCONTO_MAXIMO_AVISTA));
  const valorDesconto = arredondar((valorVenda * aplicado) / 100);
  const valorFinal = arredondar(Math.max(valorVenda - valorDesconto, 0));

  const resposta: Record<string, unknown> = {
    codigo,
    valorVenda,
    percentualSolicitado: arredondar(pedido),
    percentualAplicado: aplicado,
    limitadoPeloTeto: pedido > DESCONTO_MAXIMO_AVISTA,
    tetoVigente: DESCONTO_MAXIMO_AVISTA,
    valorDesconto,
    valorFinal
  };

  // Custo e margem só saem daqui para quem tem direito de ver.
  if (PAPEIS_COM_CUSTO.includes(papel)) {
    const custoSnap = await db.doc(`productCosts/${codigo}`).get();
    const valorReposicao = numero(custoSnap.get('valorReposicao'));
    if (valorReposicao > 0) {
      const margem = arredondar(valorFinal - valorReposicao);
      resposta.valorReposicao = valorReposicao;
      resposta.margemBruta = margem;
      resposta.margemPercentual = valorFinal > 0 ? arredondar((margem / valorFinal) * 100) : 0;
      resposta.abaixoDoCusto = margem < 0;
    }
  }

  return resposta;
});

// ---------------------------------------------------------------------------
// 4. Cotação vinda do site
// ---------------------------------------------------------------------------

const JANELA_RATE_LIMIT_MS = 60_000;
const MAXIMO_COTACOES_POR_JANELA = 3;

/**
 * Cria o lead com preço lido do catálogo e rate limit por identidade.
 *
 * Sem o limite, um script gera milhares de leads e transforma o painel comercial
 * em lixo — negação de serviço barata contra o processo de vendas, não contra o servidor.
 */
export const registrarCotacao = onCall(async (req) => {
  const codigo = texto(req.data?.codigoProduto, 40);
  const nomeCliente = texto(req.data?.nomeCliente, 120);
  const telefone = texto(req.data?.telefone, 24).replace(/[^\d+]/g, '');

  if (!codigo) throw new HttpsError('invalid-argument', 'Informe o produto desejado.');
  if (nomeCliente.length < 2) throw new HttpsError('invalid-argument', 'Informe seu nome.');
  if (telefone.length < 10) throw new HttpsError('invalid-argument', 'Informe um telefone válido com DDD.');

  const identidade = req.auth?.uid || req.rawRequest.ip || 'anonimo';
  const limiteRef = db.doc(`rateLimits/cotacao_${Buffer.from(identidade).toString('base64url')}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(limiteRef);
    const agora = Date.now();
    const inicioJanela = numero(snap.get('inicioJanela'));
    const contagem = numero(snap.get('contagem'));

    if (snap.exists && agora - inicioJanela < JANELA_RATE_LIMIT_MS) {
      if (contagem >= MAXIMO_COTACOES_POR_JANELA) {
        throw new HttpsError(
          'resource-exhausted',
          'Muitas solicitações em sequência. Aguarde um minuto e tente novamente.'
        );
      }
      tx.update(limiteRef, { contagem: FieldValue.increment(1) });
    } else {
      tx.set(limiteRef, { inicioJanela: agora, contagem: 1 });
    }
  });

  const produtoSnap = await db.doc(`products/${codigo}`).get();
  if (!produtoSnap.exists || produtoSnap.get('ativo') !== true) {
    throw new HttpsError('not-found', 'Produto indisponível no site.');
  }

  const cotacao = {
    nomeCliente,
    telefone,
    email: texto(req.data?.email, 160),
    documento: texto(req.data?.documento, 20),
    tipoCliente: req.data?.tipoCliente === 'CNPJ' ? 'CNPJ' : 'CPF',
    codigoProduto: codigo,
    // Preço vem do catálogo, nunca do payload — cliente não dita o valor do lead.
    descricaoProduto: texto(produtoSnap.get('descricao'), 200),
    valorVendaNoMomento: numero(produtoSnap.get('valorVenda')),
    observacoes: texto(req.data?.observacoes, 600),
    status: 'Novo' as const,
    origem: 'site',
    uid: req.auth?.uid || null,
    criadoEm: FieldValue.serverTimestamp()
  };

  const doc = await db.collection('inquiries').add(cotacao);
  logger.info('cotação registrada', { id: doc.id, codigo });
  return { ok: true, id: doc.id };
});

// ---------------------------------------------------------------------------
// 5. Varredura diária de consistência
// ---------------------------------------------------------------------------

/**
 * Rede de segurança: se algum gatilho falhou (retry esgotado, deploy no meio da
 * importação), esta varredura noturna corrige produtos publicados sem estoque.
 */
export const varreduraDeConsistencia = onSchedule(
  { schedule: '0 4 * * *', timeZone: 'America/Fortaleza', timeoutSeconds: 540 },
  async () => {
    const publicadosSemEstoque = await db
      .collection('products')
      .where('ativo', '==', true)
      .where('quantidade', '<=', 0)
      .get();

    if (publicadosSemEstoque.empty) {
      logger.info('varredura: catálogo consistente');
      return;
    }

    const lote = db.batch();
    publicadosSemEstoque.docs.forEach((documento) => {
      lote.update(documento.ref, {
        ativo: false,
        motivoInativacao: 'estoque-zerado',
        corrigidoPorVarreduraEm: FieldValue.serverTimestamp()
      });
    });
    await lote.commit();

    logger.warn('varredura corrigiu produtos publicados sem estoque', {
      total: publicadosSemEstoque.size
    });

    await registrarAuditoria({
      acao: 'varredura.corrigiuPublicacao',
      detalhes: { total: publicadosSemEstoque.size }
    });
  }
);
