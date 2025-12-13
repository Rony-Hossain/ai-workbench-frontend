import type { inferAsyncReturnType } from '@trpc/server';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { db as rawDb } from '../database'; 
import * as schema from '@ai-workbench/shared/database';

// 3. Wrap them together
const database = drizzle(rawDb, { schema });

export const createContext = () => ({
  db: database, // This is now fully typed with your shared schema
  user: {
    id: 'local-admin',
    role: 'admin' as const,
  },
});

export type AppContext = inferAsyncReturnType<typeof createContext>;