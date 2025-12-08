import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { ConversationRepository, MessageRepository } from '@ai-workbench/shared/database';
import { AppError } from '@ai-workbench/shared/trpc-server';
import {
  createConversationDto,
  updateConversationDto,
  type Conversation,
  type ConversationWithMessageCount,
} from '@ai-workbench/bounded-contexts';
import { z } from 'zod';

export const conversationRouter = router({
  /**
   * List all conversations
   */
  list: publicProcedure
    .output(z.array(z.custom<Conversation>()))
    .query(async ({ ctx }) => {
      const repo = new ConversationRepository();
      return repo.findAll();
    }),

  /**
   * List recent conversations with message counts
   */
  listRecent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .output(z.array(z.custom<ConversationWithMessageCount>()))
    .query(async ({ ctx, input }) => {
      const repo = new ConversationRepository();
      return repo.findRecent(input?.limit);
    }),

  /**
   * Get conversation by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<Conversation>())
    .query(async ({ ctx, input }) => {
      const repo = new ConversationRepository();
      const conversation = await repo.findById(input.id);

      if (!conversation) {
        throw AppError.notFound(`Conversation with ID ${input.id} not found`);
      }

      return conversation;
    }),

  /**
   * Get conversation statistics
   */
  getStatistics: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({
      messageCount: z.number(),
      userMessages: z.number(),
      assistantMessages: z.number(),
      totalTokens: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const repo = new ConversationRepository();
      return repo.getStatistics(input.id);
    }),

  /**
   * Find conversations by agent
   */
  getByAgent: publicProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .output(z.array(z.custom<Conversation>()))
    .query(async ({ ctx, input }) => {
      const repo = new ConversationRepository();
      return repo.findByAgent(input.agentId);
    }),

  /**
   * Create new conversation
   */
  create: protectedProcedure
    .input(createConversationDto)
    .output(z.custom<Conversation>())
    .mutation(async ({ ctx, input }) => {
      const repo = new ConversationRepository();
      return repo.create(input);
    }),

  /**
   * Update conversation
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateConversationDto,
    }))
    .output(z.custom<Conversation>())
    .mutation(async ({ ctx, input }) => {
      const repo = new ConversationRepository();

      const exists = await repo.exists(input.id);
      if (!exists) {
        throw AppError.notFound(`Conversation with ID ${input.id} not found`);
      }

      const updated = await repo.update(input.id, input.data);
      if (!updated) {
        throw AppError.internal('Failed to update conversation');
      }

      return updated;
    }),

  /**
   * Add agent to conversation
   */
  addAgent: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      agentId: z.string().uuid(),
    }))
    .output(z.custom<Conversation>())
    .mutation(async ({ ctx, input }) => {
      const repo = new ConversationRepository();

      const updated = await repo.addAgent(input.conversationId, input.agentId);
      if (!updated) {
        throw AppError.notFound(`Conversation with ID ${input.conversationId} not found`);
      }

      return updated;
    }),

  /**
   * Remove agent from conversation
   */
  removeAgent: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      agentId: z.string().uuid(),
    }))
    .output(z.custom<Conversation>())
    .mutation(async ({ ctx, input }) => {
      const repo = new ConversationRepository();

      const updated = await repo.removeAgent(input.conversationId, input.agentId);
      if (!updated) {
        throw AppError.notFound(`Conversation with ID ${input.conversationId} not found`);
      }

      return updated;
    }),

  /**
   * Delete conversation (cascades to messages)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new ConversationRepository();

      const deleted = await repo.delete(input.id);
      if (!deleted) {
        throw AppError.notFound(`Conversation with ID ${input.id} not found`);
      }

      // Messages are cascade deleted via foreign key
      return { success: true, deletedId: input.id };
    }),

  /**
   * Clear conversation messages
   */
  clearMessages: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedCount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const conversationRepo = new ConversationRepository();
      const messageRepo = new MessageRepository();

      // Verify conversation exists
      const exists = await conversationRepo.exists(input.conversationId);
      if (!exists) {
        throw AppError.notFound(`Conversation with ID ${input.conversationId} not found`);
      }

      const deletedCount = await messageRepo.deleteByConversation(input.conversationId);

      return { success: true, deletedCount };
    }),
});
