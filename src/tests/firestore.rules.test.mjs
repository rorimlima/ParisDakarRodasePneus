/**
 * Testes de Regras de Segurança do Firestore (Paris Dakar Rodas e Pneus)
 *
 * Execução: npm run test:rules
 * (sobe o emulador do Firestore, carrega firestore.rules e roda este arquivo)
 *
 * Cada caso valida uma decisão de autorização real: leitura pública do catálogo,
 * bloqueio de escrita por cliente comum, RBAC por Custom Claim `role: admin`,
 * isolamento por UID e proteção de campos financeiros (desconto B2B, pedidos).
 */
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const PROJECT_ID = 'demo-paris-dakar';

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
  },
});

const anon = testEnv.unauthenticatedContext().firestore();
const admin = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore();
const cliente = testEnv.authenticatedContext('cliente-uid', { role: 'client' }).firestore();
const outro = testEnv.authenticatedContext('outro-uid', { role: 'client' }).firestore();
// Usuário recém-criado no Firebase Auth: ainda sem claim de papel e sem perfil.
const novo = testEnv.authenticatedContext('novo-uid').firestore();

const produtoValido = {
  sku: 'RODA-BBS-17-01',
  name: 'Roda Esportiva Aro 17',
  price: 3890,
  stockQuantity: 12,
  category: 'rodas',
  isActive: true,
};

// Semeia documentos ignorando as regras, para testar apenas a leitura.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'products/prod-001'), produtoValido);
  await setDoc(doc(db, 'clients/cliente-uid'), { fullName: 'Carlos', email: 'c@ex.com' });
  await setDoc(doc(db, 'b2bAccounts/cliente-uid'), {
    companyName: 'Dakar Auto Center',
    cnpj: '12.ABC.345/0001-89',
    status: 'approved',
    discountPercentage: 20,
  });
  await setDoc(doc(db, 'adminUsers/admin-uid'), { name: 'Master', role: 'senior' });
  await setDoc(doc(db, 'orders/order-001'), { userId: 'cliente-uid', total: 1200 });
  await setDoc(doc(db, 'orders/order-002'), { userId: 'outro-uid', total: 900 });
});

const casos = [
  // --- Catálogo público ---
  ['visitante lê o catálogo', 'ok', () => getDoc(doc(anon, 'products/prod-001'))],
  ['visitante NÃO grava produto', 'fail', () => setDoc(doc(anon, 'products/prod-002'), produtoValido)],
  ['cliente logado NÃO grava produto', 'fail', () => setDoc(doc(cliente, 'products/prod-003'), produtoValido)],
  ['admin grava produto válido', 'ok', () => setDoc(doc(admin, 'products/prod-004'), produtoValido)],
  [
    'admin NÃO grava produto com preço negativo',
    'fail',
    () => setDoc(doc(admin, 'products/prod-005'), { ...produtoValido, price: -1 }),
  ],
  ['admin apaga produto', 'ok', () => deleteDoc(doc(admin, 'products/prod-004'))],

  // --- Isolamento de dados do cliente B2C ---
  ['dono lê o próprio cadastro', 'ok', () => getDoc(doc(cliente, 'clients/cliente-uid'))],
  ['terceiro NÃO lê cadastro alheio', 'fail', () => getDoc(doc(outro, 'clients/cliente-uid'))],
  ['admin lê cadastro de qualquer cliente', 'ok', () => getDoc(doc(admin, 'clients/cliente-uid'))],
  [
    'dono atualiza os próprios dados cadastrais',
    'ok',
    () => updateDoc(doc(cliente, 'clients/cliente-uid'), { phone: '(11) 90000-0000' }),
  ],
  [
    'dono NÃO injeta campo de privilégio no próprio cadastro',
    'fail',
    () => updateDoc(doc(cliente, 'clients/cliente-uid'), { role: 'admin' }),
  ],

  // --- Contas B2B: desconto e aprovação são exclusivos do admin ---
  [
    'autocadastro B2B entra pendente e sem desconto',
    'ok',
    () =>
      setDoc(doc(outro, 'b2bAccounts/outro-uid'), {
        companyName: 'Off Road LTDA',
        cnpj: '11.222.333/0001-44',
        status: 'pending',
        discountPercentage: 0,
      }),
  ],
  [
    'autocadastro B2B NÃO pode nascer aprovado com desconto',
    'fail',
    () =>
      setDoc(doc(outro, 'b2bAccounts/outro-uid'), {
        companyName: 'Off Road LTDA',
        cnpj: '11.222.333/0001-44',
        status: 'approved',
        discountPercentage: 30,
      }),
  ],
  [
    'cliente B2B NÃO altera o próprio desconto',
    'fail',
    () => updateDoc(doc(cliente, 'b2bAccounts/cliente-uid'), { discountPercentage: 90 }),
  ],
  [
    'admin altera o desconto B2B',
    'ok',
    () => updateDoc(doc(admin, 'b2bAccounts/cliente-uid'), { discountPercentage: 25 }),
  ],

  // --- Painel administrativo ---
  ['cliente NÃO lê a lista de admins', 'fail', () => getDoc(doc(cliente, 'adminUsers/admin-uid'))],
  ['admin lê a lista de admins', 'ok', () => getDoc(doc(admin, 'adminUsers/admin-uid'))],
  [
    'nem o admin cria admin pelo navegador (só via Admin SDK)',
    'fail',
    () => setDoc(doc(admin, 'adminUsers/novo-uid'), { name: 'Novo', role: 'admin' }),
  ],

  // --- Pedidos: leitura restrita, escrita só pelo backend ---
  ['dono lê o próprio pedido', 'ok', () => getDoc(doc(cliente, 'orders/order-001'))],
  ['terceiro NÃO lê pedido alheio', 'fail', () => getDoc(doc(cliente, 'orders/order-002'))],
  [
    'ninguém grava pedido pelo cliente (valores vêm do servidor)',
    'fail',
    () => setDoc(doc(admin, 'orders/order-003'), { userId: 'admin-uid', total: 1 }),
  ],

  // --- Orçamentos ---
  [
    'cliente cria orçamento em seu próprio nome',
    'ok',
    () =>
      setDoc(doc(cliente, 'inquiries/inq-001'), {
        userId: 'cliente-uid',
        message: 'Tenho interesse na roda aro 17',
        createdAt: serverTimestamp(),
      }),
  ],
  [
    'cliente NÃO cria orçamento no nome de outro usuário',
    'fail',
    () =>
      setDoc(doc(cliente, 'inquiries/inq-002'), {
        userId: 'outro-uid',
        message: 'spoofing',
        createdAt: serverTimestamp(),
      }),
  ],

  // --- Contrato com o authService: os payloads reais de cadastro devem passar ---
  [
    'payload de cadastro B2C do authService é aceito',
    'ok',
    () =>
      setDoc(doc(novo, 'clients/novo-uid'), {
        fullName: 'Ana Ranger',
        cpf: '123.456.789-00',
        email: 'ana@ex.com',
        phone: '(11) 90000-0000',
        address: 'Rua X, 10',
        cep: '01000-000',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
  ],
  [
    'payload de cadastro B2B do authService é aceito',
    'ok',
    () =>
      setDoc(doc(novo, 'b2bAccounts/novo-uid'), {
        companyName: 'Ranger Peças LTDA',
        tradeName: 'Ranger 4x4',
        cnpj: '11.222.333/0001-44',
        taxRegime: 'Simples Nacional',
        stateRegistration: 'Isento',
        phone: '(11) 90000-0000',
        email: 'ana@ex.com',
        address: 'Rua X, 10',
        status: 'pending',
        discountPercentage: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
  ],

  // --- Negação por padrão ---
  [
    'coleção não declarada é inacessível',
    'fail',
    () => setDoc(doc(cliente, 'colecaoDesconhecida/x'), { a: 1 }),
  ],
];

let falhas = 0;
for (const [nome, esperado, acao] of casos) {
  try {
    await (esperado === 'ok' ? assertSucceeds(acao()) : assertFails(acao()));
    console.log(`  ✅ ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.error(`  ❌ ${nome}\n     ${erro.message}`);
  }
}

await testEnv.cleanup();

console.log(`\n${casos.length - falhas}/${casos.length} regras validadas.`);
if (falhas > 0) {
  process.exit(1);
}
