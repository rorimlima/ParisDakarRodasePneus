import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

import { helmetMiddleware, corsOptions, generalRateLimiter } from './config/security.js';
import { OFFICIAL_BRAND } from './config/branding.js';
import { errorHandlerMiddleware, notFoundMiddleware } from './middlewares/errorHandler.js';

import importRoutes from './routes/importRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Configurações de Segurança HTTP e CORS
app.use(helmetMiddleware);
app.use(cors(corsOptions));
app.use(generalRateLimiter);

// 2. Parse de JSON e formulários no corpo das requisições
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 3. Servir arquivos estáticos da logo oficial e ativos públicos
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// 4. Rota para consulta da Identidade Visual e Logo Oficial
app.get('/api/brand', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: OFFICIAL_BRAND,
  });
});

// 5. Health check da API Backend Paris Dakar Rodas
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: OFFICIAL_BRAND.name,
    timestamp: new Date().toISOString(),
    security: 'ENABLED',
  });
});

// 6. Montagem das Rotas da API Antigravity
app.use('/api/v1/stock', importRoutes);
app.use('/api/v1/products', catalogRoutes);
app.use('/api/v1/checkout', checkoutRoutes);

// 7. Middlewares de Erro e Rotas Não Encontradas
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// 8. Inicialização do servidor Express
const server = app.listen(PORT, () => {
  console.log(`
🏎️  =============================================================
🏁  PARIS DAKAR RODAS E PNEUS - BACKEND SERVER OPERATIONAL
🔒  Ecossistema: Antigravity Logic Engine + Firebase Auth
🌐  Porta: ${PORT} | Modo: ${process.env.NODE_ENV || 'development'}
🛡️  Segurança: CORS Estrito, JWT Revocation Check, RBAC & Zod Actives
🖼️  Branding: http://localhost:${PORT}/api/brand
=============================================================
  `);
});

process.on('SIGTERM', () => {
  console.log('🛑 [SERVER SIGTERM]: Encerrando conexões graciosamente...');
  server.close(() => {
    console.log('✅ Servidor finalizado com segurança.');
    process.exit(0);
  });
});

export default app;
