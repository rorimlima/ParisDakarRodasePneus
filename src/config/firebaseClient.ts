import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Inicialização do SDK Web do Firebase (frontend).
 *
 * As chaves vêm de variáveis VITE_* e são embutidas no bundle — isso é esperado
 * e seguro: a chave de API do Firebase apenas identifica o projeto. Quem protege
 * os dados são as Security Rules (firestore.rules / storage.rules) e os Custom
 * Claims, nunca o segredo do cliente.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Falso quando o `.env` do frontend não foi preenchido (build de desenvolvimento). */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

export const FIREBASE_NOT_CONFIGURED_MESSAGE =
  'Firebase não configurado neste ambiente. Preencha as variáveis VITE_FIREBASE_* no arquivo .env e recarregue a página.';

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super(FIREBASE_NOT_CONFIGURED_MESSAGE);
    this.name = 'FirebaseNotConfiguredError';
  }
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);

  // Mantém o usuário logado entre recarregamentos da página.
  void setPersistence(authInstance, browserLocalPersistence).catch((error) => {
    console.error('[Firebase] Não foi possível ativar a persistência local da sessão:', error);
  });
}

export const firebaseApp = app;

export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    throw new FirebaseNotConfiguredError();
  }
  return authInstance;
};

export const getFirebaseDb = (): Firestore => {
  if (!dbInstance) {
    throw new FirebaseNotConfiguredError();
  }
  return dbInstance;
};
