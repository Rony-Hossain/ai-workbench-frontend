import { z } from 'zod';
import { AIModelSchema, CreateProviderInputSchema } from './provider.types';

/**
 * Create provider DTO
 */
export const createProviderDto = CreateProviderInputSchema.extend({
  models: z.array(AIModelSchema).min(1),
});

export type CreateProviderDto = z.infer<typeof createProviderDto>;
export const CreateProviderSchema = createProviderDto;

/**
 * Update provider DTO
 */
export const updateProviderDto = createProviderDto.partial();
export type UpdateProviderDto = z.infer<typeof updateProviderDto>;
export const UpdateProviderSchema = updateProviderDto;

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
