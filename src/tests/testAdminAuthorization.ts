import admin from 'firebase-admin';
import { firebaseApp } from '../config/firebase.js';

/**
 * Verifica a autorização das rotas de escrita do catálogo contra os
 * emuladores de Auth e Firestore.
 *
 *   npm run test:auth
 *
 * O que precisa ser verdade: só um token válido COM a claim de admin grava.
 * Sem token, com token forjado ou com conta sem a claim, a API recusa.
 */
const API = process.env.TEST_API_URL ?? 'http://127.0.0.1:3100';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const PROJECT = process.env.FIREBASE_PROJECT_ID ?? 'demo-paris-dakar';

let failures = 0;
const check = (label: string, ok: boolean, detail = '') => {
  if (ok) console.log(`  ✅ ${label}`);
  else {
    failures++;
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

/** Troca a senha por um ID token usando a API REST do emulador de Auth. */
const signIn = async (email: string, password: string): Promise<string> => {
  const res = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    }
  );
  const body = (await res.json()) as { idToken?: string; error?: { message: string } };
  if (!body.idToken) throw new Error(`login falhou: ${body.error?.message}`);
  return body.idToken;
};

const ensureUser = async (email: string, password: string, claims?: Record<string, unknown>) => {
  const auth = admin.auth(firebaseApp);
  let uid: string;
  try {
    uid = (await auth.getUserByEmail(email)).uid;
  } catch {
    uid = (await auth.createUser({ email, password })).uid;
  }
  await auth.setCustomUserClaims(uid, claims ?? {});
  return uid;
};

const payload = (sku: string) => ({
  sku,
  name: 'Produto de Teste de Autorização',
  brand: 'Paris Dakar',
  category: 'rodas',
  price: 1500,
  stockQuantity: 3,
  image: 'https://exemplo.com/roda.jpg',
  description: 'Item criado pelo teste de autorização',
  specs: { aro: '17' },
  compatibleVehicles: ['Toyota Hilux'],
  isActive: true
});

const put = (body: unknown, token?: string) =>
  fetch(`${API}/api/v1/products/admin`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

const main = async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error('❌ Requer FIRESTORE_EMULATOR_HOST. Este teste cria e apaga dados.');
    process.exit(1);
  }

  console.log(`\n🔐 API: ${API} | Auth: ${AUTH_HOST} | projeto: ${PROJECT}\n`);

  await ensureUser('admin.teste@parisdakar.com.br', 'SenhaForte#2026', { role: 'admin' });
  await ensureUser('cliente.teste@parisdakar.com.br', 'SenhaForte#2026', {});

  console.log('1) Escrita sem credencial');
  check('sem cabeçalho Authorization -> 401', (await put(payload('AUTHZ-1'))).status === 401);
  check('com token forjado -> 401', (await put(payload('AUTHZ-2'), 'nao.e.um.token')).status === 401);

  console.log('\n2) Conta autenticada, mas SEM a claim de admin');
  const clientToken = await signIn('cliente.teste@parisdakar.com.br', 'SenhaForte#2026');
  const clientRes = await put(payload('AUTHZ-3'), clientToken);
  check(
    'usuário comum autenticado -> 403',
    clientRes.status === 403,
    `recebeu ${clientRes.status}`
  );

  console.log('\n3) Administrador legítimo');
  const adminToken = await signIn('admin.teste@parisdakar.com.br', 'SenhaForte#2026');
  const created = await put(payload('AUTHZ-OK'), adminToken);
  check('admin grava -> 201', created.status === 201, `recebeu ${created.status}`);

  const updated = await put({ ...payload('AUTHZ-OK'), price: 1999 }, adminToken);
  check('admin atualiza -> 200', updated.status === 200, `recebeu ${updated.status}`);

  console.log('\n4) O que foi gravado aparece no catálogo público');
  const publicList = await fetch(`${API}/api/v1/products?limit=200`).then((r) => r.json());
  const found = publicList.data?.find((p: { sku: string }) => p.sku === 'AUTHZ-OK');
  check('produto do admin visível na loja', Boolean(found));
  check('preço atualizado propagou', found?.price === 1999, `preço=${found?.price}`);

  console.log('\n5) Validação de entrada');
  const bad = await put({ ...payload('AUTHZ-BAD'), image: 'javascript:alert(1)' }, adminToken);
  check('URL javascript: recusada -> 400', bad.status === 400, `recebeu ${bad.status}`);
  const negative = await put({ ...payload('AUTHZ-NEG'), price: -50 }, adminToken);
  check('preço negativo recusado -> 400', negative.status === 400, `recebeu ${negative.status}`);

  console.log('\n6) Exclusão');
  const delNoAuth = await fetch(`${API}/api/v1/products/admin/AUTHZ-OK`, { method: 'DELETE' });
  check('exclusão sem token -> 401', delNoAuth.status === 401);
  const del = await fetch(`${API}/api/v1/products/admin/AUTHZ-OK`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('admin exclui -> 200', del.status === 200, `recebeu ${del.status}`);

  console.log(`\n${failures === 0 ? '✅ Todas as verificações passaram' : `❌ ${failures} falha(s)`}\n`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((error) => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});
