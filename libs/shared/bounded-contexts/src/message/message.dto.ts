import { z } from 'zod';
import { MessageRole } from '../common/enums';

export const createMessageDto = z.object({
  conversationId: z.string().uuid(),
  role: z.nativeEnum(MessageRole),
  content: z.string().min(1),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
  parentMessageId: z.string().uuid().optional(),
});

export type CreateMessageDto = z.infer<typeof createMessageDto>;

export const getMessagesDto = z.object({
  conversationId: z.string().uuid(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  beforeTimestamp: z.date().optional(),
});

export type GetMessagesDto = z.infer<typeof getMessagesDto>;

export const searchMessagesDto = z.object({
  query: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export type SearchMessagesDto = z.infer<typeof searchMessagesDto>;
