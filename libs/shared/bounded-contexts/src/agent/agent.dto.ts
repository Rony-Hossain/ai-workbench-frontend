import { z } from 'zod';
import { AgentRole } from '../common/enums';

/**
 * Create agent DTO
 */
export const createAgentDto = z.object({
  name: z.string().min(1).max(100),
  role: z.nativeEnum(AgentRole),
  modelId: z.string().uuid(),
  systemPrompt: z.string().min(10).max(10000),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(100000).optional(),
  tools: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateAgentDto = z.infer<typeof createAgentDto>;

/**
 * Update agent DTO
 */
export const updateAgentDto = createAgentDto.partial();
export type UpdateAgentDto = z.infer<typeof updateAgentDto>;

/**
 * Filter agents DTO
 */
export const filterAgentsDto = z.object({
  role: z.nativeEnum(AgentRole).optional(),
  isActive: z.boolean().optional(),
  modelId: z.string().uuid().optional(),
});
export type FilterAgentsDto = z.infer<typeof filterAgentsDto>;
