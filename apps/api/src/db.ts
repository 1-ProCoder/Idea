import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// In dev (`tsx watch`), modules reload on every change which would otherwise
// spawn a new PrismaClient per reload and exhaust the database connection
// pool. Cache one instance on `globalThis` for the lifetime of the process.
export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['query', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
