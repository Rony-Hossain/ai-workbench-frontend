import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { MessageRepository, ConversationRepository } from '@ai-workbench-frontend/database';
import { AppError } from '@ai-workbench-frontend/trpc-server';
import {
  createMessageDto,
  getMessagesDto,
  searchMessagesDto,
  type Message,
  type MessageWithConversation,
} from '@ai-workbench-frontend/bounded-contexts';
import { z } from 'zod';

export const messageRouter = router({
  /**
   * Get messages for a conversation with pagination
   */
  list: publicProcedure
    .input(getMessagesDto)
    .output(z.object({
      messages: z.array(z.custom<Message>()),
      total: z.number(),
      hasMore: z.boolean(),
    }))
    .query(async ({ ctx, input }) => {
      const repo = new MessageRepository();

      const messages = await repo.findByConversation(input.conversationId, {
        limit: input.limit,
        offset: input.offset,
        beforeTimestamp: input.beforeTimestamp,
      });

      const total = await repo.countByConversation(input.conversationId);
      const hasMore = input.offset + messages.length < total;

      return {
        messages,
        total,
        hasMore,
      };
    }),

  /**
   * Get message by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<Message>())
    .query(async ({ ctx, input }) => {
      const repo = new MessageRepository();
      const message = await repo.findById(input.id);

      if (!message) {
        throw AppError.notFound(`Message with ID ${input.id} not found`);
      }

      return message;
    }),

  /**
   * Get message with conversation info
   */
  getWithConversation: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<MessageWithConversation>())
    .query(async ({ ctx, input }) => {
      const repo = new MessageRepository();
      const message = await repo.findWithConversation(input.id);

      if (!message) {
        throw AppError.notFound(`Message with ID ${input.id} not found`);
      }

      return message;
    }),

  /**
   * Get recent messages across all conversations
   */
  listRecent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .output(z.array(z.custom<Message>()))
    .query(async ({ ctx, input }) => {
      const repo = new MessageRepository();
      return repo.findRecent(input?.limit);
    }),

  /**
   * Search messages by content
   */
  search: publicProcedure
    .input(searchMessagesDto)
    .output(z.array(z.custom<Message>()))
    .query(async ({ ctx, input }) => {
      const repo = new MessageRepository();
      return repo.search(input.query, {
        conversationId: input.conversationId,
        limit: input.limit,
      });
    }),

  /**
   * Get messages by role
   */
  getByRole: publicProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      role: z.enum(['user', 'assistant', 'system', 'tool']),
    }))
    .output(z.array(z.custom<Message>()))
    .query(async ({ ctx, input }) => {
      const repo = new MessageRepository();
      return repo.findByRole(input.conversationId, input.role as Message['role']);
    }),

  /**
   * Create new message
   */
  create: protectedProcedure
    .input(createMessageDto)
    .output(z.custom<Message>())
    .mutation(async ({ ctx, input }) => {
      const messageRepo = new MessageRepository();
      const conversationRepo = new ConversationRepository();

      // Verify conversation exists
      const conversationExists = await conversationRepo.exists(input.conversationId);
      if (!conversationExists) {
        throw AppError.notFound(`Conversation with ID ${input.conversationId} not found`);
      }

      // Verify parent message exists if specified
      if (input.parentMessageId) {
        const parentExists = await messageRepo.exists(input.parentMessageId);
        if (!parentExists) {
          throw AppError.notFound(`Parent message with ID ${input.parentMessageId} not found`);
        }
      }

      // Create message
      const message = await messageRepo.create(input);

      // Update conversation's updatedAt timestamp
      await conversationRepo.update(input.conversationId, {
        updatedAt: new Date(),
      } as any);

      return message;
    }),

  /**
   * Send message (convenience method that creates message and updates conversation)
   */
  send: protectedProcedure
    .input(createMessageDto)
    .output(z.object({
      message: z.custom<Message>(),
      conversation: z.custom<Conversation>(),
    }))
    .mutation(async ({ ctx, input }) => {
      const messageRepo = new MessageRepository();
      const conversationRepo = new ConversationRepository();

      // Verify conversation exists
      const conversation = await conversationRepo.findById(input.conversationId);
      if (!conversation) {
        throw AppError.notFound(`Conversation with ID ${input.conversationId} not found`);
      }

      // Create message
      const message = await messageRepo.create(input);

      // Update conversation
      const updatedConversation = await conversationRepo.update(input.conversationId, {
        updatedAt: new Date(),
      } as any);

      return {
        message,
        conversation: updatedConversation || conversation,
      };
    }),

  /**
   * Delete message
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new MessageRepository();

      const deleted = await repo.delete(input.id);
      if (!deleted) {
        throw AppError.notFound(`Message with ID ${input.id} not found`);
      }

      return { success: true, deletedId: input.id };
    }),

  /**
   * Count messages in conversation
   */
  count: publicProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx, input }) => {
      const repo = new MessageRepository();
      const count = await repo.countByConversation(input.conversationId);
      return { count };
    }),
});
