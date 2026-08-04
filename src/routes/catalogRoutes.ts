import { Router } from 'express';
import { generalRateLimiter, strictRateLimiter } from '../config/security.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';
import { getCatalogProducts } from '../controllers/catalogController.js';
import {
  listAllProducts,
  upsertProduct,
  deleteProduct
} from '../controllers/productAdminController.js';
import { getSchemaAudit } from '../controllers/schemaAuditController.js';

const router = Router();

/**
 * Catálogo público (leitura, sem autenticação).
 * Rate Limiter geral, Delta Sync via `updatedSince`, ETag e HTTP 304.
 */
router.get('/', generalRateLimiter, getCatalogProducts);

/**
 * Escrita do catálogo — exclusiva do painel administrativo.
 *
 * Toda rota abaixo exige token Firebase válido com a claim de role `admin`.
 * Sem isso qualquer visitante poderia alterar preço e estoque, já que o
 * bundle do site é público e as rotas ficam à vista.
 */
router.get('/admin/all', strictRateLimiter, authenticateToken, requireRole('admin'), listAllProducts);
router.put('/admin', strictRateLimiter, authenticateToken, requireRole('admin'), upsertProduct);
router.delete('/admin/:sku', strictRateLimiter, authenticateToken, requireRole('admin'), deleteProduct);

/**
 * Diagnóstico temporário: schema real das coleções do Firestore de produção.
 * Ver MIGRACAO-BANCO.md ("Schema real diverge") antes de remover.
 */
router.get('/admin/schema-audit', strictRateLimiter, authenticateToken, requireRole('admin'), getSchemaAudit);

export default router;
