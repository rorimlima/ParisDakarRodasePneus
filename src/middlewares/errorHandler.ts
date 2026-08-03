import { Request, Response, NextFunction } from 'express';

/**
 * Middleware Centralizado de Tratamento de Erros e Segurança
 * Garante que nenhuma stack trace ou vazamento de dados internos de infraestrutura ocorram em produção.
 */
export const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ [SERVER UNHANDLED ERROR]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    status: 'error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: isProd
      ? 'Ocorreu um erro interno no servidor. A equipe de segurança da Paris Dakar Rodas foi notificada.'
      : err.message || 'Erro interno inesperado.',
    ...(isProd ? {} : { stack: err.stack }),
  });
};

/**
 * Middleware para capturar rotas não encontradas (404)
 */
export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    code: 'ROUTE_NOT_FOUND',
    message: `A rota '${req.originalUrl}' não existe no servidor Antigravity da Paris Dakar Rodas.`,
  });
};
