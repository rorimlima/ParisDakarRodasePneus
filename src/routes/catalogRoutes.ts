import { Router } from 'express';
import { generalRateLimiter } from '../config/security.js';
import { getCatalogProducts } from '../controllers/catalogController.js';

const router = Router();

/**
 * Rota do Catálogo de Produtos e Peças com Suporte a Arquitetura Offline-First
 * Camadas de Segurança e Funcionalidades:
 * 1. Rate Limiter Geral (100 req/15min).
 * 2. Suporte a Delta Sync via parâmetro `updatedSince`.
 * 3. Suporte a Cabeçalhos ETag e Resposta HTTP 304 Not Modified.
 */
router.get('/', generalRateLimiter, getCatalogProducts);

export default router;
