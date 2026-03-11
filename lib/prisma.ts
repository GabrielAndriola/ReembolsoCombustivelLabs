import { PrismaClient } from '@prisma/client';

declare global {
  var __kmPresencialPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__kmPresencialPrisma__ ??
  new PrismaClient({
    log: ['error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__kmPresencialPrisma__ = prisma;
}
