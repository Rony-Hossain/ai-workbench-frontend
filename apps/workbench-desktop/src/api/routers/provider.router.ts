import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '@ai-workbench/shared/trpc-server';
import { CreateProviderSchema } from '@ai-workbench/bounded-contexts'; // Your Zod schemas
import { providers } from '../db/schema';
import { eq } from 'drizzle-orm';

export const providerRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(providers);
    return rows.map(r => ({
      ...r,
      models: JSON.parse(r.models || '[]')
    }));
  }),

  create: protectedProcedure
    .input(CreateProviderSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(providers).values({
        id: crypto.randomUUID(),
        name: input.name,
        type: input.type,
        endpoint: input.endpoint,
        apiKey: input.apiKey,
        models: JSON.stringify(input.models),
        status: 'active'
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(providers).where(eq(providers.id, input));
      return { success: true };
    })
});
