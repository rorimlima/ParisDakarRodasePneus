import { firebaseAuth } from '../config/firebase.js';

/**
 * CLI para conceder papel administrativo (Custom Claim `role`) a um usuário do Firebase Auth.
 * Roda com o Admin SDK — é a única via legítima de concessão, propositalmente fora
 * do alcance do navegador (ver firestore.rules: adminUsers/{uid} nega toda escrita).
 *
 * Uso:
 *   npm run set-admin -- --email <email> [--role admin|senior]
 *   npm run set-admin -- <UID> [--role admin|senior]
 *
 * Sem conta ainda cadastrada, --email provisiona uma sem senha: ela se funde
 * automaticamente com a conta real no primeiro login por "Entrar com Google"
 * usando o mesmo e-mail (vinculação por e-mail é o padrão do Firebase Auth).
 */
type Papel = 'admin' | 'senior';
const PAPEIS_VALIDOS: Papel[] = ['admin', 'senior'];

interface Args {
  uid: string;
  email: string;
  role: Papel;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { uid: '', email: '', role: 'admin' };
  for (let i = 0; i < argv.length; i++) {
    const atual = argv[i];
    if (atual === '--email') {
      args.email = (argv[++i] || '').trim();
    } else if (atual === '--role') {
      args.role = (argv[++i] || '').trim() as Papel;
    } else if (!atual.startsWith('--')) {
      args.uid = atual.trim();
    }
  }
  return args;
}

const run = async () => {
  const { uid: uidArg, email, role } = parseArgs(process.argv.slice(2));

  if (!uidArg && !email) {
    console.error('❌ Informe --email <email> ou o UID do usuário.');
    console.error('   Exemplo: npm run set-admin -- --email pessoa@dominio.com --role senior');
    process.exit(1);
  }

  if (!PAPEIS_VALIDOS.includes(role)) {
    console.error(`❌ --role deve ser um de: ${PAPEIS_VALIDOS.join(', ')}.`);
    process.exit(1);
  }

  try {
    let user;
    if (uidArg) {
      user = await firebaseAuth.getUser(uidArg);
    } else {
      try {
        user = await firebaseAuth.getUserByEmail(email);
      } catch {
        user = await firebaseAuth.createUser({ email, emailVerified: true });
        console.log(`ℹ️  Conta ainda não existia — provisionada sem senha (uid: ${user.uid}).`);
      }
    }

    await firebaseAuth.setCustomUserClaims(user.uid, { role });
    console.log(`✅ Papel "${role}" concedido. UID: ${user.uid}.`);
    console.log('   Se a pessoa já estava logada, precisa sair e entrar de novo (o token só atualiza no próximo login, em até 1h).');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao atribuir papel:', error.message);
    process.exit(1);
  }
};

run();
