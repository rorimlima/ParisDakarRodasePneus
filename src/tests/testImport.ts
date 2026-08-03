import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stockImportService } from '../services/importService.js';
import { dbClient } from '../services/dbClient.js';
import { splitFeeService } from '../services/splitFeeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVerificationTests() {
  console.log('🧪 [TEST SUITE] Iniciando testes de validação do Backend Antigravity...\n');

  // Teste 1: Importação de Planilha CSV com Upsert por SKU
  console.log('--- Teste 1: Motor de Importação e Upsert de Planilha ---');
  const sampleCsvPath = path.join(__dirname, 'fixtures', 'sample_stock.csv');
  const csvBuffer = fs.readFileSync(sampleCsvPath);

  const importResult = await stockImportService.processSpreadsheetBuffer(csvBuffer);
  console.log('📊 Resultado da Importação:', JSON.stringify(importResult, null, 2));

  // Teste 2: Verificar estoque atualizado no Banco de Dados
  console.log('\n--- Teste 2: Verificação do Banco Antigravity após Upsert ---');
  const bbsWheel = await dbClient.findBySku('RODA-BBS-17-01');
  console.log('🔍 Registro da Roda BBS (Deve ter preço 3950 e estoque 15):', bbsWheel);

  // Teste 3: Cálculo de Split-Fee no Servidor
  console.log('\n--- Teste 3: Cálculo de Split-Fee no Lado do Servidor ---');
  const splitResult = await splitFeeService.calculateOrderSplit({
    items: [
      { sku: 'RODA-BBS-17-01', quantity: 4 },
      { sku: 'PNEU-MICHELIN-225-45-17', quantity: 4 },
    ],
    gatewayFeePercentage: 2.5,
    partnerCommissionPercentage: 5.0,
  });
  console.log(
    '💰 Resultado Financeiro Autoritativo (Split-Fee em Centavos):',
    JSON.stringify(splitResult.financialBreakdown, null, 2)
  );

  console.log('\n✅ Todos os testes de verificação executados com sucesso!');
}

runVerificationTests().catch((err) => {
  console.error('❌ Erro durante testes:', err);
  process.exit(1);
});
