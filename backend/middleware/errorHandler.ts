import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    message: 'Rota não encontrada.'
  });
};

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      message: 'Dados inválidos.',
      issues: error.issues
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target.join(',')
        : String(error.meta?.target ?? '');
      const message =
        target.includes('email')
          ? 'Ja existe um funcionario com esse e-mail.'
          : target.includes('employeeCode')
            ? 'Ja existe um funcionario com essa matricula.'
            : 'Ja existe um registro duplicado.';

      res.status(409).json({
        message
      });
      return;
    }

    if (error.code === 'P2022') {
      res.status(503).json({
        message: 'O banco de dados ainda nao foi atualizado com as novas colunas da aplicacao.'
      });
      return;
    }
  }

  console.error(error);

  res.status(500).json({
    message: 'Erro interno do servidor.'
  });
};
