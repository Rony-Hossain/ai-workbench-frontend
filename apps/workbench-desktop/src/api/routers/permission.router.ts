import { router, protectedProcedure } from '../trpc/init';
import { permissions, tasks, messages } from '@ai-workbench/shared/database';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as crypto from 'crypto';
import type { MessageMetadata } from '@ai-workbench/bounded-contexts';
import { TaskRunner } from '../services/task-runner';

export const permissionRouter = router({
  listPending: protectedProcedure
    .input(z.object({ conversationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
        let query = ctx.db.select().from(permissions).where(eq(permissions.status, 'pending'));
        if (input.conversationId) {
            // @ts-ignore
            query = query.where(eq(permissions.conversationId, input.conversationId));
        }
        return query;
    }),

  resolve: protectedProcedure
    .input(z.object({
      permissionId: z.string(),
      decision: z.enum(['approved', 'denied']),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const perm = await ctx.db.query.permissions.findFirst({
        where: eq(permissions.id, input.permissionId)
      });

      if (!perm || perm.status !== 'pending') {
        throw new Error('Permission not pending');
      }

      await ctx.db.update(permissions)
        .set({
          status: input.decision,
          resolvedAt: new Date(),
          decisionReason: input.reason
        })
        .where(eq(permissions.id, input.permissionId));

      const task = await ctx.db.query.tasks.findFirst({
        where: eq(tasks.id, perm.taskId)
      });

      if (!task) {
        throw new Error('Associated task not found');
      }

      if (input.decision === 'approved') {
        // 1. Resume Task (Standard)
        await ctx.db.update(tasks)
            .set({ status: 'pending', runAfter: new Date(), lockedBy: null, lockedAt: null, updatedAt: new Date() })
            .where(eq(tasks.id, perm.taskId));
      } else {
        // FAIL TASK
        await ctx.db.update(tasks)
          .set({
            status: 'failed',
            lastError: `Permission denied: ${input.reason || 'User rejected'}`,
            finishedAt: new Date(),
            lockedBy: null,
            lockedAt: null,
            lockExpiresAt: null,
            updatedAt: new Date()
          })
          .where(eq(tasks.id, perm.taskId));

        // Log System Message
        const sysMeta: MessageMetadata = {
            senderType: 'system',
            senderAgentId: null,
            senderName: 'System',
            protocol: null,
            taskId: perm.taskId,
            traceId: null,
            modelId: null,
            latencyMs: null
        };

        await ctx.db.insert(messages).values({
            id: crypto.randomUUID(),
            conversationId: perm.conversationId,
            role: 'system',
            content: `🚫 Permission Denied.`,
            metadata: sysMeta,
            timestamp: new Date()
        });
      }

      return { success: true };
    }),
});
