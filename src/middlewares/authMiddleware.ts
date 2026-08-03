import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase.js';

/**
 * Middleware de Validação Cryptográfica de Token JWT do Firebase Auth
 * Impede acesso a qualquer rota sensível sem um token válido e não expirado.
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED_NO_TOKEN',
        message: 'Acesso negado: Cabeçalho de autorização ausente ou malformatado (Formato esperado: Bearer <token>).',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1].trim();

    if (!token) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED_EMPTY_TOKEN',
        message: 'Acesso negado: Token JWT ausente.',
      });
      return;
    }

    // Valida o token com o Firebase Admin SDK (incluindo checagem de revogação)
    const decodedToken = await firebaseAuth.verifyIdToken(token, true);

    // Injeta os dados do usuário autenticado no objeto Request da requisição
    req.user = {
      ...decodedToken,
      role: (decodedToken.role as string) || 'client', // Role padrão 'client' se nenhuma for definida
    };

    return next();
  } catch (error: any) {
    console.error('❌ [AUTH SECURITY ERROR] Falha na validação do JWT Firebase:', error.message);

    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Sessão expirada: O token Firebase informado expirou. Por favor, autentique-se novamente.',
      });
      return;
    }

    if (error.code === 'auth/id-token-revoked') {
      res.status(401).json({
        status: 'error',
        code: 'TOKEN_REVOKED',
        message: 'Acesso revogado: O token de autenticação foi revogado.',
      });
      return;
    }

    res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Acesso negado: Token JWT inválido ou adulterado.',
    });
  }
};

/**
 * Middleware RBAC (Role-Based Access Control)
 * Permite restrição de endpoints específicos com base no nível de permissão do usuário.
 * Exemplo: requireRole('admin') para gerentes de estoque
 */
export const requireRole = (...allowedRoles: Array<'admin' | 'client' | string>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Acesso negado: Usuário não autenticado.',
      });
      return;
    }

    const userRole = req.user.role || 'client';

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        message: `Acesso proibido: Esta operação requer permissão [${allowedRoles.join(' ou ')}]. Sua permissão atual é [${userRole}].`,
      });
      return;
    }

    next();
  };
};
