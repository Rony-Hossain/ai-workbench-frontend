import { z } from 'zod';
import { ProviderType } from '../common/enums';

/**
 * Zod schema for model info
 */
export const modelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  contextWindow: z.number().optional(),
  maxTokens: z.number().optional(),
});

/**
 * Create provider DTO
 */
export const createProviderDto = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ProviderType),
  endpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
  models: z.array(modelInfoSchema).min(1),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateProviderDto = z.infer<typeof createProviderDto>;

/**
 * Update provider DTO
 */
export const updateProviderDto = createProviderDto.partial();
export type UpdateProviderDto = z.infer<typeof updateProviderDto>;

/**
 * Get provider by ID DTO
 */
export const getProviderByIdDto = z.object({
  id: z.string().uuid(),
});
export type GetProviderByIdDto = z.infer<typeof getProviderByIdDto>;

/**
 * Test connection DTO
 */
export const testConnectionDto = z.object({
  id: z.string().uuid(),
});
export type TestConnectionDto = z.infer<typeof testConnectionDto>;
