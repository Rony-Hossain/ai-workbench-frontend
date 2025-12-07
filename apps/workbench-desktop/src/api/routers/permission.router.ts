import { router, publicProcedure, protectedProcedure } from '@ai-workbench/shared/trpc-server';
import { permissions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { RequestPermissionSchema, ResolvePermissionSchema } from '@ai-workbench/bounded-contexts';

export const permissionRouter = router({
  listPending: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select()
      .from(permissions)
      .where(eq(permissions.status, 'pending'))
      .orderBy(desc(permissions.createdAt));
      
    return rows.map(r => ({ ...r, details: JSON.parse(r.details) }));
  }),

  request: protectedProcedure
    .input(RequestPermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(permissions).values({
        id,
        requestId: id,
        agentId: input.agentId,
        type: input.type,
        operation: input.operation,
        details: JSON.stringify(input.details),
        status: 'pending'
      });
      return { permissionId: id, status: 'pending' };
    }),

  resolve: protectedProcedure
    .input(ResolvePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(permissions)
        .set({ status: input.decision, decidedAt: Date.now() })
        .where(eq(permissions.id, input.permissionId));
      return { success: true };
    })
});
