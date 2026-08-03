import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { generalRateLimiter } from '../config/security.js';
import { handleCalculateSplitFee } from '../controllers/checkoutController.js';

const router = Router();

/**
 * Rota Protegida de Cálculo de Split-Fee no lado do Servidor
 * Garante que o front-end não manipule valores financeiros.
 */
router.post('/split-fee', generalRateLimiter, authenticateToken, handleCalculateSplitFee);

export default router;
