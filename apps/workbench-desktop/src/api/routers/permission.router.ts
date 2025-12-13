import { router, publicProcedure, protectedProcedure } from '../trpc/init';
// FIX: Import from the shared library, NOT '../db/schema'
import { permissions } from '@ai-workbench/shared/database';
import { eq, desc } from 'drizzle-orm';
import { RequestPermissionSchema, ResolvePermissionSchema } from '@ai-workbench/bounded-contexts';

export const permissionRouter = router({
  listPending: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select()
      .from(permissions)
      .where(eq(permissions.status, 'pending'))
      .orderBy(desc(permissions.createdAt));
      
    // Parse the JSON details field for the frontend
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
        .set({ status: input.decision, decidedAt: new Date() }) // Fix: Use Date object, not Date.now() for Drizzle timestamp
        .where(eq(permissions.id, input.permissionId));
      return { success: true };
    })
});