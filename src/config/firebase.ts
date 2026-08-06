import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Inicialização centralizada do Firebase Admin SDK com credenciais de serviço
 * Suporta ESM / CJS Interop para verificação cryptográfica segura de tokens JWT.
 */
const getFirebaseAdminApps = (): App[] => {
  return getApps();
};

const initFirebaseAdmin = (): App => {
  const existingApps = getFirebaseAdminApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  console.warn(
    '⚠️ [SECURITY WARNING]: Firebase Admin SDK sendo inicializado sem credenciais de serviço. Verifique as variáveis no .env em produção.'
  );

  return initializeApp({
    projectId: projectId || 'paris-dakar-rodas-pneus',
  });
};

export const firebaseApp = initFirebaseAdmin();
export const firebaseAuth = getAuth(firebaseApp);
