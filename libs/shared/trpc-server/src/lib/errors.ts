import { TRPCError } from '@trpc/server';

/**
 * Standard error codes and messages
 */
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
} as const;

/**
 * Helper to create standardized errors
 */
export class AppError {
  static notFound(message: string, meta?: Record<string, any>) {
    return new TRPCError({
      code: 'NOT_FOUND',
      message,
      cause: meta,
    });
  }

  static badRequest(message: string, meta?: Record<string, any>) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message,
      cause: meta,
    });
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new TRPCError({
      code: 'UNAUTHORIZED',
      message,
    });
  }

  static forbidden(message: string = 'Forbidden') {
    return new TRPCError({
      code: 'FORBIDDEN',
      message,
    });
  }

  static conflict(message: string, meta?: Record<string, any>) {
    return new TRPCError({
      code: 'CONFLICT',
      message,
      cause: meta,
    });
  }

  static preconditionFailed(message: string) {
    return new TRPCError({
      code: 'PRECONDITION_FAILED',
      message,
    });
  }

  static internal(message: string = 'Internal server error') {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    });
  }

  static tooManyRequests(message: string = 'Too many requests') {
    return new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message,
    });
  }
}
