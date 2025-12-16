// apps/workbench-desktop/src/api/trpc/context.ts
import type { inferAsyncReturnType } from '@trpc/server';
import { db, rawDb } from '../database';

export const createContext = () => ({
  db,     // Drizzle typed
  rawDb,  // better-sqlite3 raw
  user: {
    id: 'local-admin',
    role: 'admin' as const,
  },
});

export type AppContext = inferAsyncReturnType<typeof createContext>;
