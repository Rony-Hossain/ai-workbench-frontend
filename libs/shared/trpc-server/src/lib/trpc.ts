import { initTRPC } from '@trpc/server';
// Import the DB type interface, not the implementation, to keep this pure
// You might need to export DrizzleClient type from your db lib or define it here
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export interface TrpcContext {
  db: BetterSQLite3Database<any>; // We use 'any' for the schema generic here to keep it decoupled
  user: { id: string; role: 'admin' | 'user' };
}

const t = initTRPC.context<TrpcContext>().create();

// --- MIDDLEWARE ---

const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  if (type === 'mutation') {
    const status = result.ok ? '✅' : '❌';
    console.log(`[AUDIT] ${status} ${path} (${duration}ms)`);
  }
  return result;
});

const criticalActionMiddleware = t.middleware(async ({ path, next }) => {
  const dangerousKeywords = ['delete', 'drop', 'kill', 'remove', 'write'];
  if (dangerousKeywords.some(kw => path.toLowerCase().includes(kw))) {
    console.warn(`[SECURITY AUDIT] ⚠️ Critical Action Triggered: ${path}`);
  }
  return next();
});

// --- EXPORTS ---

export const router = t.router;
export const middleware = t.middleware;

// 1. Public Procedure (Safe Reads)
export const publicProcedure = t.procedure.use(loggerMiddleware);

// 2. Protected Procedure (Mutations/Dangerous)
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(criticalActionMiddleware);
