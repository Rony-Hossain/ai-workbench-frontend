import { z } from 'zod';

export const createConversationDto = z.object({
  title: z.string().min(1).max(200).default('New Conversation'),
  agentIds: z.array(z.string().uuid()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateConversationDto = z.infer<typeof createConversationDto>;

export const updateConversationDto = createConversationDto.partial();
export type UpdateConversationDto = z.infer<typeof updateConversationDto>;