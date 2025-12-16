import { router, protectedProcedure } from '../trpc/init';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { conversations } from '@ai-workbench/shared/database';

import { migrateRag } from '../rag/rag-migrate';
import { reindexRepo } from '../rag/reindex-repo';
import { getRagServices } from '../rag/rag-services';

export const ragRouter = router({
  migrate: protectedProcedure.mutation(async ({ ctx }) => {
    migrateRag(ctx.rawDb);
    return { success: true };
  }),

  setWorkspaceRoot: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      workspaceRoot: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(conversations)
        .set({ workspaceRoot: input.workspaceRoot, updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return { success: true };
    }),

  reindexConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const convo = await ctx.db.query.conversations.findFirst({
        where: eq(conversations.id, input.conversationId),
      });

      const workspaceRoot = (convo as any)?.workspaceRoot ?? null;
      if (!workspaceRoot) {
        return { success: false, error: 'Conversation workspaceRoot is null.' };
      }

      await reindexRepo(ctx.rawDb, workspaceRoot);
      return { success: true };
    }),

  search: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      query: z.string().min(1),
      k: z.number().int().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const convo = await ctx.db.query.conversations.findFirst({
        where: eq(conversations.id, input.conversationId),
      });

      const workspaceRoot = (convo as any)?.workspaceRoot ?? null;
      if (!workspaceRoot) {
        return { success: false, error: 'Conversation workspaceRoot is null.' };
      }

      const normalized = workspaceRoot.replace(/\\/g, '/').replace(/\/$/, '');
      const sourcePrefix = `repo:${normalized}/`;

      const { retriever } = getRagServices(ctx.rawDb);
      const results = await retriever.search(input.query, input.k, {
        sourcePrefix,
        documentTypes: ['code', 'doc'],
      });

      return { success: true, results };
    }),
});
