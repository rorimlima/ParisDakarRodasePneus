/**
 * Inicialização do Firebase.
 *
 * A config do Firebase Web é pública por natureza (vai no bundle) — quem protege os
 * dados são as Security Rules em `firestore.rules`, não o segredo dessas chaves.
 * O que NÃO pode vazar aqui: service account, chave privada de admin, token de API
 * server-side. Nada disso é referenciado neste arquivo.
 *
 * Sem variáveis de ambiente configuradas, `firebaseAtivo` fica false e o app roda em
 * modo local (localStorage) — útil para desenvolvimento, nunca para produção.
 */

import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Functions, getFunctions } from 'firebase/functions';

// Fora do bundle Vite (script Node, teste) `import.meta.env` não existe; o fallback
// mantém o módulo importável e simplesmente deixa `firebaseAtivo` como false.
const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ??
  {}) as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

/** Região das Cloud Functions — São Paulo reduz latência para o público brasileiro. */
export const REGIAO_FUNCTIONS = env.VITE_FIREBASE_FUNCTIONS_REGION || 'southamerica-east1';

export const firebaseAtivo: boolean = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;
let functionsInstance: Functions | null = null;

function obterApp(): FirebaseApp | null {
  if (!firebaseAtivo) return null;
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
  }
  return app;
}

export function obterDb(): Firestore | null {
  const instancia = obterApp();
  if (!instancia) return null;
  if (!dbInstance) {
    // Cache persistente multi-aba: o catálogo tem ~1.2k documentos e muda pouco entre
    // importações. Servir da cache corta leitura cobrada e mantém o site utilizável offline.
    dbInstance = initializeFirestore(instancia, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  }
  return dbInstance;
}

export function obterAuth(): Auth | null {
  const instancia = obterApp();
  if (!instancia) return null;
  if (!authInstance) authInstance = getAuth(instancia);
  return authInstance;
}

export function obterStorage(): FirebaseStorage | null {
  const instancia = obterApp();
  if (!instancia) return null;
  if (!storageInstance) storageInstance = getStorage(instancia);
  return storageInstance;
}

export function obterFunctions(): Functions | null {
  const instancia = obterApp();
  if (!instancia) return null;
  if (!functionsInstance) functionsInstance = getFunctions(instancia, REGIAO_FUNCTIONS);
  return functionsInstance;
}

/** Nomes de coleção centralizados — evita string solta divergindo das Security Rules. */
export const COLECOES = {
  produtos: 'products',
  /** custos: ValorReposicao. Leitura restrita a gerência/senior nas rules. */
  custos: 'productCosts',
  categorias: 'categories',
  importacoes: 'imports',
  configuracoes: 'settings',
  usuarios: 'users',
  clientesCpf: 'clientsCpf',
  clientesCnpj: 'clientsCnpj',
  cotacoes: 'inquiries',
  auditoria: 'auditLog'
} as const;
