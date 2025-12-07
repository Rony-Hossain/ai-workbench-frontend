// Context
export { createBaseContext, type BaseTRPCContext, type BaseContext } from './lib/context';

// Middleware
export {
  createTRPCInstance,
  createRequestLogger,
  createAuditLogger,
  createRateLimiter,
  createCriticalGuard,
  createPerformanceMonitor,
  type AuditLogEntry,
} from './lib/middleware';

// Procedures
export { createProcedures, type ProcedureOptions } from './lib/create-procedures';

// Errors
export { AppError, ErrorCodes } from './lib/errors';

// Re-export tRPC types that apps will need
export type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';