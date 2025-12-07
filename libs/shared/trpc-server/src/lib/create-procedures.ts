import { createTRPCInstance, createRequestLogger, createAuditLogger, createRateLimiter, createCriticalGuard, createPerformanceMonitor, AuditLogEntry } from './middleware';
import { BaseTRPCContext } from './context';

export interface ProcedureOptions {
  enableAuditLog?: boolean;
  auditLogHandler?: (entry: AuditLogEntry) => void | Promise<void>;
  rateLimitMaxRequests?: number;
  rateLimitWindowMs?: number;
  performanceThreshold?: number;
  criticalActions?: string[];
}

/**
 * Create standard procedures with configurable middleware
 */
export const createProcedures = <TContext extends BaseTRPCContext>(
  t: ReturnType<typeof createTRPCInstance<TContext>>,
  options: ProcedureOptions = {}
) => {
  const {
    enableAuditLog = true,
    auditLogHandler = (entry) => console.log('[AUDIT]', entry),
    rateLimitMaxRequests = 100,
    rateLimitWindowMs = 60000, // 1 minute
    performanceThreshold = 1000,
    criticalActions,
  } = options;

  // Create middleware instances
  const requestLogger = createRequestLogger(t);
  const performanceMonitor = createPerformanceMonitor(t, performanceThreshold);
  const rateLimiter = createRateLimiter(t, {
    maxRequests: rateLimitMaxRequests,
    windowMs: rateLimitWindowMs,
  });
  const criticalGuard = createCriticalGuard(t, { criticalActions });
  const auditLogger = enableAuditLog 
    ? createAuditLogger(t, auditLogHandler)
    : undefined;

  // Public procedure - basic logging only
  const publicProcedure = t.procedure.use(requestLogger);

  // Protected procedure - full middleware stack
  let protectedProcedure = t.procedure
    .use(requestLogger)
    .use(performanceMonitor)
    .use(rateLimiter)
    .use(criticalGuard);

  if (auditLogger) {
    protectedProcedure = protectedProcedure.use(auditLogger);
  }

  return {
    router: t.router,
    publicProcedure,
    protectedProcedure,
    middleware: {
      requestLogger,
      performanceMonitor,
      rateLimiter,
      criticalGuard,
      auditLogger,
    },
  };
};
