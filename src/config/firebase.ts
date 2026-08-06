import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Inicialização centralizada do Firebase Admin SDK com credenciais de serviço
 * Suporta ESM / CJS Interop para verificação cryptográfica segura de tokens JWT.
 */
const getFirebaseAdminApps = (): admin.app.App[] => {
  const defaultAdmin = (admin as any).default || admin;
  const rawApps = defaultAdmin.apps;
  if (Array.isArray(rawApps)) {
    return rawApps.filter((app): app is admin.app.App => app !== null && app !== undefined);
  }
  return [];
};

const getFirebaseAdminInstance = (): typeof admin => {
  return (admin as any).default || admin;
};

const initFirebaseAdmin = (): admin.app.App => {
  const existingApps = getFirebaseAdminApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const firebaseSdk = getFirebaseAdminInstance();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (projectId && clientEmail && privateKey) {
    return firebaseSdk.initializeApp({
      credential: firebaseSdk.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  console.warn(
    '⚠️ [SECURITY WARNING]: Firebase Admin SDK sendo inicializado sem credenciais de serviço. Verifique as variáveis no .env em produção.'
  );

  return firebaseSdk.initializeApp({
    projectId: projectId || 'paris-dakar-rodas-pneus',
  });
};

export const firebaseApp = initFirebaseAdmin();
export const firebaseAuth = getFirebaseAdminInstance().auth(firebaseApp);
