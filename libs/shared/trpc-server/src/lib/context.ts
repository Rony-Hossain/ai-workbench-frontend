import { inferAsyncReturnType } from '@trpc/server';

/**
 * Base context shape that all apps must extend
 * Contains common fields for request tracking
 */
export interface BaseTRPCContext {
  requestId: string;
  timestamp: number;
}

/**
 * Factory to create base context
 * Apps will extend this with their own context (e.g., db, auth)
 */
export const createBaseContext = (): BaseTRPCContext => {
  return {
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
  };
};

export type BaseContext = inferAsyncReturnType<typeof createBaseContext>;
