import type { Auth, User } from 'firebase/auth';
import { AdminUser } from '../types';

/**
 * Autenticação de administrador via Firebase Auth.
 *
 * Regras que este módulo sustenta:
 *
 * 1. Nenhuma senha vive no código. O navegador manda e-mail e senha para o
 *    Firebase e recebe um token assinado; o app nunca compara segredos.
 * 2. Ser administrador é a claim `role: 'admin'` dentro do token, atribuída
 *    fora da aplicação (`npm run set-admin <uid>`). Um usuário comum que
 *    consiga se autenticar continua sem acesso ao painel.
 * 3. A sessão não é lida do localStorage. O que vale é o token do Firebase,
 *    que é assinado e expira — localStorage é editável pelo visitante, então
 *    confiar nele era o mesmo que não ter login.
 *
 * O SDK do Firebase só é baixado quando alguém abre o login administrativo,
 * para não pesar na vitrine.
 */

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID
};

/** A configuração Web do Firebase é pública por design; o que protege é a claim. */
export const isAuthConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain);

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

let authPromise: Promise<Auth> | null = null;

const getAuth = async (): Promise<Auth> => {
  if (!isAuthConfigured) {
    throw new AuthError(
      'Login administrativo não configurado neste ambiente. Defina as variáveis VITE_FIREBASE_* no build.',
      'auth/not-configured'
    );
  }

  if (!authPromise) {
    authPromise = (async () => {
      const [{ initializeApp, getApps }, { getAuth: getFirebaseAuth, setPersistence, browserSessionPersistence }] =
        await Promise.all([import('firebase/app'), import('firebase/auth')]);

      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const auth = getFirebaseAuth(app);

      // Sessão presa à aba: fechar o navegador encerra o acesso ao painel,
      // em vez de deixá-lo aberto num computador compartilhado.
      await setPersistence(auth, browserSessionPersistence);
      return auth;
    })();
  }

  return authPromise;
};

/** Mensagens do Firebase são técnicas e em inglês; aqui viram algo utilizável. */
const describeError = (code: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      // Mesma mensagem para e-mail inexistente e senha errada: dizer qual dos
      // dois falhou entrega a um atacante a lista de e-mails válidos.
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar de novo.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/network-request-failed':
      return 'Falha de rede ao contatar o servidor de autenticação.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada.';
    default:
      return 'Não foi possível concluir o login.';
  }
};

const toAdminUser = (user: User, claims: Record<string, unknown>): AdminUser => ({
  id: user.uid,
  name: user.displayName || user.email?.split('@')[0] || 'Administrador',
  email: user.email ?? '',
  role: claims.role === 'senior' ? 'senior' : 'admin',
  grantedBySenior: true,
  createdAt: user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toISOString().split('T')[0]
    : ''
});

export const authService = {
  /**
   * Autentica e exige a claim de administrador.
   *
   * Quem entra sem a claim é deslogado na hora: sem isso, qualquer conta do
   * projeto abriria o painel.
   */
  async signInAdmin(email: string, password: string): Promise<AdminUser> {
    const auth = await getAuth();
    const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');

    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const code = (error as { code?: string }).code ?? 'auth/unknown';
      throw new AuthError(describeError(code), code);
    }

    const tokenResult = await credential.user.getIdTokenResult();

    if (tokenResult.claims.role !== 'admin' && tokenResult.claims.role !== 'senior') {
      await signOut(auth);
      throw new AuthError(
        'Esta conta não tem permissão de administrador.',
        'auth/insufficient-role'
      );
    }

    return toAdminUser(credential.user, tokenResult.claims as Record<string, unknown>);
  },

  async signOut(): Promise<void> {
    if (!isAuthConfigured) return;
    const auth = await getAuth();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  },

  /**
   * Token para autorizar chamadas de escrita na API.
   * `forceRefresh` renova claims recém-atribuídas sem exigir novo login.
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!isAuthConfigured) return null;
    const auth = await getAuth();
    return auth.currentUser ? auth.currentUser.getIdToken(forceRefresh) : null;
  },

  /**
   * Observa a sessão. Emite o administrador quando há token válido com a
   * claim, e null em qualquer outro caso.
   */
  async observeAdmin(callback: (admin: AdminUser | null) => void): Promise<() => void> {
    if (!isAuthConfigured) {
      callback(null);
      return () => undefined;
    }

    const auth = await getAuth();
    const { onAuthStateChanged } = await import('firebase/auth');

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        const role = tokenResult.claims.role;
        callback(
          role === 'admin' || role === 'senior'
            ? toAdminUser(user, tokenResult.claims as Record<string, unknown>)
            : null
        );
      } catch {
        callback(null);
      }
    });
  }
};
