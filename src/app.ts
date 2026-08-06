import express from 'express';
import cors from 'cors';
import { helmetMiddleware, corsOptions } from './config/security.js';
import { errorHandlerMiddleware, notFoundMiddleware } from './middlewares/errorHandler.js';
import { getDatabaseHealth } from './services/dbHealth.js';

import importRoutes from './routes/importRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';

const app = express();

// 1. Aplicar cabeçalhos de segurança HTTP via Helmet
app.use(helmetMiddleware);

// 2. Configurar política restrita de CORS
app.use(cors(corsOptions));

// 3. Sanitização e limites rígidos no body-parser para evitar Nuke/Memory Exhaustion attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rota de verificação de integridade e saúde da API (Health Check)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Paris Dakar Rodas Backend API (Antigravity Engine)',
    timestamp: new Date().toISOString(),
    security: 'ENABLED',
  });
});

// 4.1. Diagnóstico da camada de dados (credenciais, Firestore e store ativo)
app.get('/health/db', async (_req, res, next) => {
  try {
    const report = await getDatabaseHealth();
    res.status(report.status === 'down' ? 503 : 200).json(report);
  } catch (error) {
    next(error);
  }
});

// 5. Montagem das Rotas da Aplicação Backend
app.use('/api/v1/stock', importRoutes);
app.use('/api/v1/products', catalogRoutes);
app.use('/api/v1/checkout', checkoutRoutes);

// 6. Tratamento de rotas inexistentes e erros não capturados
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
