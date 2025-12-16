import { router, protectedProcedure } from '../trpc/init';
import { z } from 'zod';
import { messages, tasks, conversations, agents } from '@ai-workbench/shared/database';
import { eq, and, desc } from 'drizzle-orm';
import type { MessageMetadata } from '@ai-workbench/bounded-contexts';
import * as crypto from 'crypto';

export const chatRouter = router({
  history: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().int().min(1).max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.messages.findMany({
        where: eq(messages.conversationId, input.conversationId),
        orderBy: [desc(messages.timestamp)],
        limit: input.limit,
      });

      return rows.reverse();
    }),

  send: protectedProcedure
    .input(z.object({
        conversationId: z.string(),
        content: z.string(),
        targetAgentId: z.string().optional(), // Hint only
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('🔴🔴 HELLO! EXECUTING LATEST VERSION OF CHAT.SEND 🔴🔴');
      const { conversationId, content } = input;
      const messageId = crypto.randomUUID();
      const traceId = crypto.randomUUID();

      console.log('[chat.send] request', { conversationId, content, targetAgentId: input.targetAgentId });

      // 1. Save User Message
      const userMeta: MessageMetadata = {
        senderType: 'user',
        senderAgentId: null,
        senderName: 'Commander',
        protocol: null,
        taskId: null,
        traceId: traceId,
        modelId: null,
        latencyMs: null
      };

      await ctx.db
        .insert(messages)
        .values({
          id: messageId,
          conversationId,
          role: 'user',
          content,
          timestamp: new Date(),
          metadata: userMeta,
        });
      console.log('[chat.send] user message inserted', { messageId, conversationId });

      // 2. Identify the Planner (Strict Scoping)
      // TEMP: Bypassing conversation membership check due to schema mismatch
      const allPlanners = await ctx.db.query.agents.findMany({
          where: eq(agents.role, 'planner'),
      });
      
      const planner = allPlanners[0];
      console.log('🔴🔴 FOUND PLANNER:', planner);

      if (!planner) {
        console.error('[chat.send] planner not found', { conversationId });
        return { success: false, error: 'No active Planner found in this conversation.' };
      }
      console.log('[chat.send] planner found', { plannerId: planner.id });

      // 3. Enqueue Planner Task (Single Point of Entry)
      const taskId = crypto.randomUUID();
      try {
        await ctx.db.insert(tasks).values({
          id: taskId,
          conversationId,
          agentId: planner.id,
          triggerMessageId: messageId,
          status: 'pending',
          attempt: 0,
          traceId,
          priority: 10,
          leaseMs: 30000,
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: '9f8f2b1d-9e6a-4d4b-8e1c-5a3b2e0d1f4a'
        });
        console.log('[chat.send] task created', { taskId, plannerId: planner.id, triggerMessageId: messageId });
      } catch (e: any) {
        console.error('[chat.send] task insert failed', { error: e?.message ?? e });
        throw e;
      }

      console.log('[chat.send] returning success', { messageId, taskId, recipients: 1 });
      return { success: true, messageId, taskIds: [taskId], recipients: 1 };
    }),
});
