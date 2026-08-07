import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import {
  FirebaseNotConfiguredError,
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from '../config/firebaseClient';
import type { AdminUser, B2BUser, CpfClient, TaxRegime, UserSession } from '../types';

/**
 * Camada de autenticação sobre o Firebase Auth.
 *
 * Papéis:
 *  - `admin` vem exclusivamente do Custom Claim `role` no token (definido pelo
 *    backend via `npm run set-admin <UID>`). O navegador não consegue forjá-lo.
 *  - `b2b` e `b2c` vêm do documento de perfil do próprio usuário no Firestore
 *    (`b2bAccounts/{uid}` ou `clients/{uid}`), protegido por UID nas rules.
 */

const CLIENTS_COLLECTION = 'clients';
const B2B_COLLECTION = 'b2bAccounts';

export interface B2CRegistrationInput {
  fullName: string;
  cpf: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  cep: string;
}

export interface B2BRegistrationInput {
  companyName: string;
  tradeName: string;
  cnpj: string;
  taxRegime: TaxRegime;
  stateRegistration: string;
  phone: string;
  email: string;
  password: string;
  address: string;
}

/** Traduz os códigos do Firebase Auth para mensagens exibíveis ao usuário. */
export const describeAuthError = (error: unknown): string => {
  if (error instanceof FirebaseNotConfiguredError) {
    return error.message;
  }

  const code = (error as { code?: string })?.code ?? '';

  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido. Confira o endereço digitado.';
    case 'auth/missing-password':
      return 'Informe a senha para continuar.';
    case 'auth/weak-password':
      return 'Senha muito fraca. Use no mínimo 6 caracteres.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui cadastro. Faça login ou recupere a senha.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada. Fale com o administrador.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com o Firebase. Verifique sua internet e tente de novo.';
    case 'permission-denied':
      return 'Permissão negada pelas regras de segurança para esta operação.';
    default:
      return (error as Error)?.message || 'Não foi possível concluir a operação. Tente novamente.';
  }
};

const isoDate = (value: unknown): string => {
  if (typeof value === 'string') return value;
  const toDate = (value as { toDate?: () => Date } | null)?.toDate;
  if (typeof toDate === 'function') {
    return toDate.call(value).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

/** Papéis de Custom Claim que abrem o painel administrativo. */
const PAPEIS_DE_PAINEL = ['admin', 'senior', 'gerencia'] as const;

const buildAdminSession = (user: User, claimRole: string): UserSession => {
  const adminUser: AdminUser = {
    id: user.uid,
    name: user.displayName || 'Administrador',
    email: user.email || '',
    // 'gerencia' enxerga custo igual 'senior' (ver PAPEIS_COM_ACESSO_A_CUSTO) —
    // não existe like AdminRole próprio para ele, então herda o rótulo 'senior'.
    role: claimRole === 'senior' || claimRole === 'gerencia' ? 'senior' : 'admin',
    grantedBySenior: true,
    createdAt: isoDate(user.metadata.creationTime),
  };
  return { type: 'admin', adminUser };
};

/**
 * Monta a sessão da aplicação a partir do usuário autenticado: lê os Custom
 * Claims do token e, se não for admin, busca o perfil B2B ou B2C no Firestore.
 */
export const resolveSession = async (user: User): Promise<UserSession> => {
  const token = await user.getIdTokenResult();
  const claimRole = token.claims.role as string | undefined;

  if (claimRole && (PAPEIS_DE_PAINEL as readonly string[]).includes(claimRole)) {
    return buildAdminSession(user, claimRole);
  }

  const db = getFirebaseDb();

  const b2bSnapshot = await getDoc(doc(db, B2B_COLLECTION, user.uid));
  if (b2bSnapshot.exists()) {
    const data = b2bSnapshot.data();
    const b2bUser: B2BUser = {
      id: user.uid,
      isLoggedIn: true,
      companyName: data.companyName ?? '',
      tradeName: data.tradeName ?? data.companyName ?? '',
      cnpj: data.cnpj ?? '',
      taxRegime: (data.taxRegime as TaxRegime) ?? 'Simples Nacional',
      stateRegistration: data.stateRegistration ?? 'Isento',
      phone: data.phone ?? '',
      email: data.email ?? user.email ?? '',
      address: data.address ?? '',
      // O desconto é definido pelo administrador; conta pendente compra sem desconto.
      discountPercentage: typeof data.discountPercentage === 'number' ? data.discountPercentage : 0,
      status: data.status === 'approved' || data.status === 'rejected' ? data.status : 'pending',
      createdAt: isoDate(data.createdAt),
    };
    return { type: 'b2b', b2bUser };
  }

  const clientSnapshot = await getDoc(doc(db, CLIENTS_COLLECTION, user.uid));
  const clientData = clientSnapshot.exists() ? clientSnapshot.data() : {};

  const b2cUser: CpfClient = {
    id: user.uid,
    fullName: clientData.fullName ?? user.displayName ?? 'Cliente Paris Dakar',
    cpf: clientData.cpf ?? '',
    email: clientData.email ?? user.email ?? '',
    phone: clientData.phone ?? '',
    address: clientData.address ?? '',
    cep: clientData.cep ?? '',
    createdAt: isoDate(clientData.createdAt ?? user.metadata.creationTime),
  };

  return { type: 'b2c', b2cUser };
};

/**
 * Observa o estado de autenticação. Retorna a função para cancelar a inscrição.
 * Quando o Firebase não está configurado, emite uma sessão vazia e não observa nada.
 */
export const onSessionChange = (
  callback: (session: UserSession) => void,
  onError?: (message: string) => void
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback({ type: null });
    return () => undefined;
  }

  return onAuthStateChanged(getFirebaseAuth(), async (user) => {
    if (!user) {
      callback({ type: null });
      return;
    }

    try {
      callback(await resolveSession(user));
    } catch (error) {
      console.error('[Auth] Falha ao carregar o perfil do usuário:', error);
      onError?.(describeAuthError(error));
      callback({ type: null });
    }
  });
};

export const loginWithEmail = async (email: string, password: string): Promise<UserSession> => {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return resolveSession(credential.user);
};

/**
 * Login social. O perfil B2C só é criado se ainda não existir — reentrar pelo
 * Google nunca sobrescreve CPF, telefone e endereço já preenchidos pelo cliente.
 */
export const loginWithGoogle = async (): Promise<UserSession> => {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  const { user } = credential;

  const perfil = doc(db, CLIENTS_COLLECTION, user.uid);
  if (!(await getDoc(perfil)).exists()) {
    await setDoc(perfil, {
      fullName: user.displayName || user.email?.split('@')[0] || 'Cliente',
      cpf: '',
      email: user.email || '',
      phone: user.phoneNumber || '',
      address: '',
      cep: '',
      createdAt: serverTimestamp(),
    });
  }

  return resolveSession(user);
};

/**
 * Login do painel administrativo: exige um Custom Claim de `role` em PAPEIS_DE_PAINEL.
 * Uma conta comum que acerte a senha é deslogada imediatamente.
 */
export const loginAsAdmin = async (email: string, password: string): Promise<UserSession> => {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const token = await credential.user.getIdTokenResult();
  const claimRole = token.claims.role as string | undefined;

  if (!claimRole || !(PAPEIS_DE_PAINEL as readonly string[]).includes(claimRole)) {
    await signOut(auth);
    throw new Error(
      'Esta conta não tem permissão de administrador. Peça a um administrador para executar "npm run set-admin".'
    );
  }

  return buildAdminSession(credential.user, claimRole);
};

export const registerB2CClient = async (input: B2CRegistrationInput): Promise<UserSession> => {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await updateProfile(credential.user, { displayName: input.fullName });

  await setDoc(doc(db, CLIENTS_COLLECTION, credential.user.uid), {
    fullName: input.fullName,
    cpf: input.cpf,
    email: input.email.trim(),
    phone: input.phone,
    address: input.address,
    cep: input.cep,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return resolveSession(credential.user);
};

export const registerB2BAccount = async (input: B2BRegistrationInput): Promise<UserSession> => {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await updateProfile(credential.user, { displayName: input.tradeName || input.companyName });

  // `status` e `discountPercentage` são fixados aqui e só o admin pode alterá-los
  // depois — as regras do Firestore rejeitam qualquer outro valor na criação.
  await setDoc(doc(db, B2B_COLLECTION, credential.user.uid), {
    companyName: input.companyName,
    tradeName: input.tradeName || input.companyName,
    cnpj: input.cnpj,
    taxRegime: input.taxRegime,
    stateRegistration: input.stateRegistration || 'Isento',
    phone: input.phone,
    email: input.email.trim(),
    address: input.address,
    status: 'pending',
    discountPercentage: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return resolveSession(credential.user);
};

export const logout = async (): Promise<void> => {
  if (!isFirebaseConfigured) return;
  await signOut(getFirebaseAuth());
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
};

/** Token para chamar as rotas protegidas da API (Authorization: Bearer ...). */
export const getIdToken = async (): Promise<string | null> => {
  if (!isFirebaseConfigured) return null;
  const user = getFirebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
};
