import { TRPCError, initTRPC } from '@trpc/server';
import { BaseTRPCContext } from './context';

/**
 * Initialize tRPC with base context
 * Generic type parameter allows apps to extend the context
 */
export const createTRPCInstance = <TContext extends BaseTRPCContext>() => {
  return initTRPC.context<TContext>().create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof Error ? error.cause.message : null,
        },
      };
    },
  });
};

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  requestId: string;
  action: string;
  input: unknown;
  timestamp: number;
  userId?: string;
}

/**
 * Request Logger Middleware
 * Logs all incoming requests and their duration
 */
export const createRequestLogger = <TContext extends BaseTRPCContext>(
  t: ReturnType<typeof createTRPCInstance<TContext>>
) => {
  return t.middleware(async ({ path, type, next, ctx }) => {
    const start = Date.now();
    console.log(`[${ctx.requestId}] → ${type.toUpperCase()} ${path}`);

    const result = await next();
    const duration = Date.now() - start;

    if (result.ok) {
      console.log(`[${ctx.requestId}] ✓ ${path} (${duration}ms)`);
    } else {
      console.log(`[${ctx.requestId}] ✗ ${path} (${duration}ms)`);
    }

    return result;
  });
};

/**
 * Audit Logger Middleware
 * Records all mutations for audit trail
 */
export const createAuditLogger = <TContext extends BaseTRPCContext>(
  t: ReturnType<typeof createTRPCInstance<TContext>>,
  onAudit: (data: AuditLogEntry) => void | Promise<void>
) => {
  return t.middleware(async ({ path, type, next, ctx, rawInput }) => {
    if (type === 'mutation') {
      const auditEntry: AuditLogEntry = {
        requestId: ctx.requestId,
        action: path,
        input: rawInput,
        timestamp: ctx.timestamp,
      };

      await onAudit(auditEntry);
    }

    return next();
  });
};

/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting requests per time window
 */
export const createRateLimiter = <TContext extends BaseTRPCContext>(
  t: ReturnType<typeof createTRPCInstance<TContext>>,
  options: {
    maxRequests: number;
    windowMs: number;
    keyExtractor?: (ctx: TContext) => string;
  }
) => {
  const { maxRequests, windowMs, keyExtractor = () => 'global' } = options;
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  return t.middleware(async ({ path, next, ctx }) => {
    const key = `${keyExtractor(ctx)}:${path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    } else if (record.count >= maxRequests) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetAt - now) / 1000)}s`,
      });
    } else {
      record.count++;
    }

    return next();
  });
};

/**
 * Critical Action Guard
 * Adds extra logging/validation for dangerous operations
 */
export const createCriticalGuard = <TContext extends BaseTRPCContext>(
  t: ReturnType<typeof createTRPCInstance<TContext>>,
  options?: {
    criticalActions?: string[];
    onCriticalAction?: (path: string, ctx: TContext) => void | Promise<void>;
  }
) => {
  const defaultCritical = ['delete', 'destroy', 'clear', 'remove', 'kill'];
  const criticalActions = options?.criticalActions || defaultCritical;

  return t.middleware(async ({ path, next, ctx }) => {
    const isCritical = criticalActions.some(action => path.toLowerCase().includes(action));

    if (isCritical) {
      console.warn(`⚠️  CRITICAL ACTION: ${path} [${ctx.requestId}]`);
      
      if (options?.onCriticalAction) {
        await options.onCriticalAction(path, ctx);
      }
    }

    return next();
  });
};

/**
 * Performance Monitor
 * Warns about slow operations
 */
export const createPerformanceMonitor = <TContext extends BaseTRPCContext>(
  t: ReturnType<typeof createTRPCInstance<TContext>>,
  thresholdMs: number = 1000
) => {
  return t.middleware(async ({ path, next, ctx }) => {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;

    if (duration > thresholdMs) {
      console.warn(`⚠️  SLOW OPERATION: ${path} took ${duration}ms [${ctx.requestId}]`);
    }

    return result;
  });
};
