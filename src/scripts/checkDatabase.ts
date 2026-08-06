import dotenv from 'dotenv';
import { getDatabaseHealth, DbStatus } from '../services/dbHealth.js';

dotenv.config();

const ICON: Record<DbStatus, string> = {
  ok: '✅',
  degraded: '⚠️ ',
  down: '❌'
};

/**
 * Diagnóstico da conexão com o banco: `npm run check:db`
 * Sai com código 1 quando algum item está em falha, para uso em CI.
 */
const main = async () => {
  const report = await getDatabaseHealth();

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  PARIS DAKAR — DIAGNÓSTICO DA CAMADA DE DADOS');
  console.log('══════════════════════════════════════════════════════════════\n');

  console.log(`Situação geral : ${ICON[report.status]} ${report.status.toUpperCase()}`);
  console.log(`Armazenamento  : ${report.activeStore}`);
  console.log(`Persistente    : ${report.persistent ? 'sim' : 'NÃO'}`);
  console.log(`Verificado em  : ${report.checkedAt}\n`);

  console.log('Verificações:');
  for (const check of report.checks) {
    const latency = check.latencyMs !== undefined ? ` (${check.latencyMs}ms)` : '';
    console.log(`  ${ICON[check.status]} ${check.name}${latency}`);
    console.log(`     ${check.detail}`);
  }

  if (report.warnings.length > 0) {
    console.log('\nAtenção:');
    for (const warning of report.warnings) {
      console.log(`  • ${warning}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');

  process.exit(report.status === 'down' ? 1 : 0);
};

main().catch((error) => {
  console.error('❌ Falha ao executar o diagnóstico:', error);
  process.exit(1);
});
