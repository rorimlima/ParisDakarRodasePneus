import { Request, Response } from 'express';
import { stockImportService } from '../services/importService.js';

export const handleStockImport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        code: 'MISSING_FILE',
        message: 'Nenhum arquivo de planilha foi enviado na requisição. Envie um arquivo .xlsx ou .csv no parâmetro "file".',
      });
      return;
    }

    const resultSummary = await stockImportService.processSpreadsheetBuffer(req.file.buffer);

    res.status(200).json({
      status: 'success',
      message: 'Processamento da planilha de estoque concluído com sucesso.',
      summary: {
        totalRowsProcessed: resultSummary.totalRowsProcessed,
        createdCount: resultSummary.createdCount,
        updatedCount: resultSummary.updatedCount,
        failedCount: resultSummary.failedCount,
      },
      errors: resultSummary.errors,
      processedItems: resultSummary.processedItems,
    });
  } catch (error: any) {
    console.error('❌ Erro durante o processamento do upload de estoque:', error);
    res.status(500).json({
      status: 'error',
      code: 'IMPORT_PROCESSING_FAILED',
      message: 'Falha interna ao processar planilha de estoque.',
      details: error.message,
    });
  }
};
