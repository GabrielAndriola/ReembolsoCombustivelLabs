import { PrismaClient } from '@prisma/client';

declare global {
  var __meuReembolsoPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__meuReembolsoPrisma__ ??
  new PrismaClient({
    log: ['error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__meuReembolsoPrisma__ = prisma;
}
