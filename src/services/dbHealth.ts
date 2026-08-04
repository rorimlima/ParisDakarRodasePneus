import admin from 'firebase-admin';
import { firebaseApp } from '../config/firebase.js';
import { dbClient } from './dbClient.js';

export type DbStatus = 'ok' | 'degraded' | 'down';

export interface DbCheck {
  name: string;
  status: DbStatus;
  detail: string;
  latencyMs?: number;
}

export interface DbHealthReport {
  status: DbStatus;
  checkedAt: string;
  /** Onde os produtos realmente estão guardados neste momento. */
  activeStore: 'in-memory' | 'firestore';
  persistent: boolean;
  checks: DbCheck[];
  warnings: string[];
}

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: tempo limite de ${ms}ms excedido`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
};

/** Credenciais de serviço presentes no ambiente. */
const checkCredentials = (): DbCheck => {
  const missing = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'].filter(
    (key) => !process.env[key]
  );

  if (missing.length === 0) {
    return {
      name: 'credenciais-firebase',
      status: 'ok',
      detail: `Credenciais de serviço configuradas para o projeto "${process.env.FIREBASE_PROJECT_ID}".`
    };
  }

  return {
    name: 'credenciais-firebase',
    status: 'down',
    detail: `Variáveis ausentes no ambiente: ${missing.join(', ')}. O SDK sobe sem credencial e nenhuma leitura/escrita autenticada funciona.`
  };
};

/** Conectividade real com o Firestore (round-trip de leitura). */
const checkFirestore = async (): Promise<DbCheck> => {
  const started = Date.now();

  try {
    const firestore = admin.firestore(firebaseApp);
    await withTimeout(firestore.listCollections(), 5000, 'firestore.listCollections');

    return {
      name: 'firestore',
      status: 'ok',
      detail: 'Conexão estabelecida e leitura autorizada.',
      latencyMs: Date.now() - started
    };
  } catch (error) {
    return {
      name: 'firestore',
      status: 'down',
      detail: `Falha ao conectar: ${(error as Error).message}`,
      latencyMs: Date.now() - started
    };
  }
};

/** Estado do armazenamento que a API usa de fato hoje. */
const checkActiveStore = async (): Promise<DbCheck> => {
  const started = Date.now();
  const skus = await dbClient.getAllSkusMap();

  return {
    name: 'catalogo-ativo',
    status: 'degraded',
    detail: `Armazenamento em memória (Map) com ${skus.size} SKU(s). Os dados são perdidos a cada reinício do processo ou cold start da Cloud Function, e cada instância tem a sua própria cópia.`,
    latencyMs: Date.now() - started
  };
};

/** DATABASE_URL existe no .env mas nenhum código do projeto abre essa conexão. */
const checkDeclaredDatabaseUrl = (): DbCheck | null => {
  if (!process.env.DATABASE_URL) return null;

  return {
    name: 'database-url',
    status: 'degraded',
    detail:
      'DATABASE_URL está definida no ambiente, mas nenhum driver (pg/prisma/knex) é carregado pelo projeto. A variável não tem efeito algum.'
  };
};

const worstStatus = (checks: DbCheck[]): DbStatus => {
  if (checks.some((c) => c.status === 'down')) return 'down';
  if (checks.some((c) => c.status === 'degraded')) return 'degraded';
  return 'ok';
};

/**
 * Diagnóstico da camada de persistência.
 *
 * Reporta o que está realmente acontecendo, sem mascarar: hoje o catálogo vive
 * em memória, então mesmo com o Firestore acessível o resultado é "degraded".
 */
export const getDatabaseHealth = async (): Promise<DbHealthReport> => {
  const credentials = checkCredentials();
  const checks: DbCheck[] = [credentials];

  // Sem credencial não vale a pena esperar o timeout de rede do Firestore.
  checks.push(
    credentials.status === 'ok'
      ? await checkFirestore()
      : {
          name: 'firestore',
          status: 'down',
          detail: 'Não verificado: credenciais de serviço ausentes.'
        }
  );

  checks.push(await checkActiveStore());

  const declaredUrl = checkDeclaredDatabaseUrl();
  if (declaredUrl) checks.push(declaredUrl);

  const warnings: string[] = [
    'O catálogo servido pela API vem de um Map em memória (src/services/dbClient.ts), não de um banco de dados.',
    'O site público lê e grava produtos, usuários e leads no localStorage do navegador — os dados ficam só no dispositivo do visitante.'
  ];

  if (credentials.status !== 'ok') {
    warnings.push('Sem credenciais de serviço, a verificação de tokens JWT do Firebase Auth também falha.');
  }

  return {
    status: worstStatus(checks),
    checkedAt: new Date().toISOString(),
    activeStore: 'in-memory',
    persistent: false,
    checks,
    warnings
  };
};
