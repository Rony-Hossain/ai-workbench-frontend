import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { z } from 'zod';
// FIX: Import schema directly to use with ctx.db
import { conversations, messages } from '@ai-workbench/shared/database';
import { eq, desc } from 'drizzle-orm';
import * as crypto from 'crypto';

export const conversationRouter = router({
  /**
   * 1. List for Sidebar (Fast, Metadata only)
   */
  list: protectedProcedure
    .output(z.array(z.object({
      id: z.string(),
      title: z.string(),
      updatedAt: z.date(),
    })))
    .query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({
          id: conversations.id,
          title: conversations.title,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .orderBy(desc(conversations.updatedAt));
      
      return rows;
    }),

  /**
   * 2. Create New Chat
   */
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(conversations).values({
        id,
        title: input.title || 'New Conversation',
        agentIds: '[]', // Default empty JSON array
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id };
    }),

  /**
   * 3. Rename Chat
   */
  update: protectedProcedure
    .input(z.object({ 
      id: z.string(), 
      title: z.string() 
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(conversations)
        .set({ 
          title: input.title, 
          updatedAt: new Date() 
        })
        .where(eq(conversations.id, input.id));
      return { success: true };
    }),

  /**
   * 4. Delete Chat (and its messages)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Manual cascade delete to be safe
      await ctx.db.delete(messages).where(eq(messages.conversationId, input.id));
      await ctx.db.delete(conversations).where(eq(conversations.id, input.id));
      return { success: true };
    }),

  /**
   * 5. Clear History (Keep chat, delete messages)
   */
  clearMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(messages)
        .where(eq(messages.conversationId, input.conversationId));
      return { success: true };
    }),
});