import * as XLSX from 'xlsx';
import { ProductImportRowSchema, ProductImportRow } from '../schemas/productSchema.js';
import { dbClient, ProductRecord } from './dbClient.js';

export interface RowErrorDetail {
  rowNumber: number;
  skuAttempted?: string;
  errors: string[];
}

export interface ImportResultSummary {
  totalRowsProcessed: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: RowErrorDetail[];
  processedItems: Array<{ sku: string; action: 'CREATED' | 'UPDATED' }>;
}

/**
 * Normaliza os nomes de colunas da planilha para alinhar com o esquema esperado pelo Zod
 */
const normalizeColumnName = (colName: string): string => {
  const clean = colName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (clean === 'sku' || clean === 'codigo' || clean === 'cod') return 'sku';
  if (clean === 'nome' || clean === 'produto' || clean === 'descricao') return 'name';
  if (clean === 'categoria' || clean === 'tipo') return 'category';
  if (clean === 'marca' || clean === 'fabricante') return 'brand';
  if (clean === 'preco' || clean === 'valor' || clean === 'preco_venda') return 'price';
  if (clean === 'estoque' || clean === 'quantidade' || clean === 'qtd') return 'stockQuantity';
  if (clean === 'aro' || clean === 'tamanho_aro') return 'rimSize';
  if (clean === 'largura') return 'width';
  if (clean === 'perfil') return 'aspectRatio';

  return colName.trim();
};

/**
 * Service de Processamento e Importação de Planilhas Excel (.xlsx) e CSV
 * Executa sanitização, validação estrita com Zod linha a linha e Upsert por SKU.
 */
export class StockImportService {
  /**
   * Processa o buffer do arquivo enviado, lê as linhas e efetua o Upsert atômico
   */
  public async processSpreadsheetBuffer(fileBuffer: Buffer): Promise<ImportResultSummary> {
    // Leitura da planilha a partir do buffer em memória via XLSX
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Converte planilha para JSON de objetos brutos
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const summary: ImportResultSummary = {
      totalRowsProcessed: rawRows.length,
      createdCount: 0,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
      processedItems: [],
    };

    if (rawRows.length === 0) {
      return summary;
    }

    // Processamento estrito de cada linha
    for (let index = 0; index < rawRows.length; index++) {
      const rawRow = rawRows[index];
      const rowNumber = index + 2; // Linha 1 é o cabeçalho na planilha

      // Normaliza as chaves do objeto para o schema
      const normalizedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        const normKey = normalizeColumnName(key);
        normalizedRow[normKey] = value;
      }

      // Validação rígida de tipagem e limites via Zod
      const validationResult = ProductImportRowSchema.safeParse(normalizedRow);

      if (!validationResult.success) {
        summary.failedCount++;
        const errorMessages = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        summary.errors.push({
          rowNumber,
          skuAttempted: normalizedRow.sku ? String(normalizedRow.sku) : undefined,
          errors: errorMessages,
        });
        continue;
      }

      const validProductData: ProductImportRow = validationResult.data;

      try {
        // Execução da Lógica de Upsert por SKU no Banco Antigravity
        const { action, record } = await dbClient.upsertBySku(validProductData);

        if (action === 'CREATED') {
          summary.createdCount++;
        } else {
          summary.updatedCount++;
        }

        summary.processedItems.push({
          sku: record.sku,
          action,
        });
      } catch (dbErr: any) {
        summary.failedCount++;
        summary.errors.push({
          rowNumber,
          skuAttempted: validProductData.sku,
          errors: [`Erro de persistência no banco de dados: ${dbErr.message}`],
        });
      }
    }

    return summary;
  }
}

export const stockImportService = new StockImportService();
