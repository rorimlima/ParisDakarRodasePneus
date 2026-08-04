import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';

/**
 * Política Restrita de CORS (Cross-Origin Resource Sharing)
 * Permite apenas requisições vindas dos domínios do front-end na Vercel e localhost autorizados.
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'https://parisdakarrodas.vercel.app',
      'https://parisdakarrodas-admin.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: chamadas server-to-server ou ferramentas de teste locais em ambiente dev)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `CORS Error: A origem '${origin}' não está autorizada pela política de segurança da Paris Dakar Rodas.`
        )
      );
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'If-None-Match', 'If-Modified-Since'],
  exposedHeaders: ['ETag', 'Last-Modified'],
  credentials: true,
  maxAge: 86400, // Cache de preflight CORS por 24 horas
};

/**
 * Configuração de Cabeçalhos de Segurança HTTP via Helmet
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com'],
      // Necessário para o mapa da unidade (embed do Google Maps) renderizar.
      frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' }, // Proteção total contra Clickjacking
  hidePoweredBy: true, // Neutraliza o cabeçalho X-Powered-By
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true, // Proteção contra Mime Sniffing
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Rate Limiter Global para Rotas de Consulta Gerais
 * Limite de 100 requisições a cada 15 minutos por IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Limite de requisições excedido. Por favor, aguarde alguns minutos antes de tentar novamente.',
  },
});

/**
 * Rate Limiter Estrito para Upload de Estoque e Rotas Críticas
 * Proteção contra Ataques de Força Bruta e DDoS de alta carga (Max 10 requisições a cada 15 minutos).
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Bloqueio de taxa estrita ativado: Excesso de chamadas na rota sensível de estoque/autenticação.',
  },
});
