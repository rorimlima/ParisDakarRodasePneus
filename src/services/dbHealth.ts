import admin from 'firebase-admin';
import { firebaseApp } from '../config/firebase.js';
import { isUsingEmulator } from '../config/firestore.js';
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
  activeStore: 'firestore' | 'firestore-emulator';
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
  try {
    const latencyMs = await dbClient.ping();
    const skus = await dbClient.getAllSkusMap();

    return {
      name: 'catalogo-ativo',
      status: 'ok',
      detail: `Catálogo persistido no Firestore (coleção "products") com ${skus.size} SKU(s)${
        isUsingEmulator ? ' — apontando para o EMULADOR, não para o banco de produção' : ''
      }.`,
      latencyMs
    };
  } catch (error) {
    return {
      name: 'catalogo-ativo',
      status: 'down',
      detail: `Não foi possível ler a coleção de produtos: ${(error as Error).message}`
    };
  }
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
 * Reporta o que está realmente acontecendo, sem mascarar. Um item em falha
 * derruba o status geral, então "ok" aqui significa que a API consegue mesmo
 * ler e gravar o catálogo.
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

  const warnings: string[] = [];

  if (isUsingEmulator) {
    warnings.push(
      `FIRESTORE_EMULATOR_HOST está definido (${process.env.FIRESTORE_EMULATOR_HOST}): esta instância grava no emulador, não no banco real.`
    );
  }

  warnings.push(
    'O site público ainda lê e grava produtos, usuários e leads no localStorage do navegador. A troca do localStorage pelas chamadas à API é a etapa seguinte.'
  );

  if (credentials.status !== 'ok') {
    warnings.push('Sem credenciais de serviço, a verificação de tokens JWT do Firebase Auth também falha.');
  }

  const storeCheck = checks.find((c) => c.name === 'catalogo-ativo');

  return {
    status: worstStatus(checks),
    checkedAt: new Date().toISOString(),
    activeStore: isUsingEmulator ? 'firestore-emulator' : 'firestore',
    persistent: storeCheck?.status === 'ok',
    checks,
    warnings
  };
};
