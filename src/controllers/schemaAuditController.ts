import { Request, Response } from 'express';
import { schemaAuditService } from '../services/schemaAuditService.js';

/**
 * GET /api/v1/products/admin/schema-audit
 *
 * Diagnóstico temporário — só existe para desenhar o adaptador entre o
 * schema real do Firestore (escrito pelo importador de planilha externo) e
 * o que o site espera. Remover depois que dbClient.ts for reescrito para o
 * schema real.
 */
export const getSchemaAudit = async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await schemaAuditService.auditKnownCollections();
    res.status(200).json({ status: 'success', data: report });
  } catch (error) {
    console.error('❌ Erro na auditoria de schema:', error);
    res.status(500).json({
      status: 'error',
      code: 'SCHEMA_AUDIT_FAILED',
      message: 'Falha ao auditar o schema do Firestore.'
    });
  }
};
