import { router, protectedProcedure } from '../trpc/init';
import { z } from 'zod';
import { messages, tasks, conversations, agents } from '@ai-workbench/shared/database';
import { eq, and } from 'drizzle-orm';
import type { MessageMetadata } from '@ai-workbench/bounded-contexts';
import * as crypto from 'crypto';

export const chatRouter = router({
  send: protectedProcedure
    .input(z.object({
        conversationId: z.string(),
        content: z.string(),
        targetAgentId: z.string().optional(), // Hint only
    }))
    .mutation(async ({ ctx, input }) => {
      const { conversationId, content } = input;
      const messageId = crypto.randomUUID();
      const traceId = crypto.randomUUID();

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

      await ctx.db.insert(messages).values({
        id: messageId,
        conversationId,
        role: 'user',
        content,
        timestamp: new Date(),
        metadata: userMeta,
      });

      // 2. Identify the Planner (Strict Scoping)
      const convo = await ctx.db.query.conversations.findFirst({
          where: eq(conversations.id, conversationId)
      });
      
      const memberIds = (convo?.agentIds ?? []) as string[];
      
      if (memberIds.length === 0) {
          return { success: false, error: 'Conversation has no agents.' };
      }

      // Query only valid members who are ACTIVE planners
      const activePlanners = await ctx.db.query.agents.findMany({
          where: and(
              eq(agents.role, 'planner'),
              eq(agents.isActive, true)
          )
      });
      
      const planner = activePlanners.find(p => memberIds.includes(p.id));

      if (!planner) {
        return { success: false, error: 'No active Planner found in this conversation.' };
      }

      // 3. Enqueue Planner Task (Single Point of Entry)
      const taskId = crypto.randomUUID();
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
        updatedAt: new Date()
      });

      return { success: true, messageId, taskIds: [taskId], recipients: 1 };
    }),
});
