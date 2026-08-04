import admin from 'firebase-admin';
import { firebaseApp } from './firebase.js';

/**
 * Instância única do Firestore.
 *
 * Em desenvolvimento e nos testes, o Admin SDK redireciona sozinho para o
 * emulador quando FIRESTORE_EMULATOR_HOST está definido (ex.: 127.0.0.1:8080),
 * então não existe caminho de código diferente entre local e produção.
 */
export const firestore = admin.firestore(firebaseApp);

firestore.settings({ ignoreUndefinedProperties: true });

export const COLLECTIONS = {
  PRODUCTS: 'products',
  SELLERS: 'sellers',
  INQUIRIES: 'inquiries',
  SETTINGS: 'settings'
} as const;

export const isUsingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
