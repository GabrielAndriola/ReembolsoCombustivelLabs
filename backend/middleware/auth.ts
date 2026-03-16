import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: 'admin' | 'supervisor' | 'employee';
    companyId: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Token de acesso ausente.', 401));
    return;
  }

  try {
    const payload = verifyToken(header.replace('Bearer ', ''));

    req.auth = {
      userId: payload.sub,
      role: payload.role,
      companyId: payload.companyId
    };

    next();
  } catch (error) {
    next(new AppError('Token inválido.', 401));
  }
};

export const requireRole =
  (...roles: Array<'admin' | 'supervisor' | 'employee'>) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new AppError('Você não tem permissão para esta operação.', 403));
      return;
    }

    next();
  };
