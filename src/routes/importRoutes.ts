import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';
import { handleUploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { strictRateLimiter } from '../config/security.js';
import { handleStockImport } from '../controllers/importController.js';

const router = Router();

/**
 * Rota Protegida de Importação de Estoque por Planilha (.xlsx / .csv)
 * Camadas de Segurança Aplicadas:
 * 1. Rate Limiting Estrito (strictRateLimiter): Previne força bruta e flooding.
 * 2. Autenticação Firebase JWT (authenticateToken): Exige token válido.
 * 3. Controle de Acesso RBAC (requireRole('admin')): Apenas administradores/estoquistas.
 * 4. Interceptação de Upload (handleUploadMiddleware): Valida tipo de arquivo e tamanho (max 10MB).
 * 5. Sanitização Zod & Upsert: Valida tipos e efetua Upsert atômico por SKU.
 */
router.post(
  '/import',
  strictRateLimiter,
  authenticateToken,
  requireRole('admin'),
  handleUploadMiddleware,
  handleStockImport
);

export default router;
