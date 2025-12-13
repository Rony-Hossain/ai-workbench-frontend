import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { AppError } from '@ai-workbench/shared/trpc-server';
import {
  createAgentDto,
  filterAgentsDto,
  type Agent,
} from '@ai-workbench/bounded-contexts';
import { agents, providers } from '@ai-workbench/shared/database';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as crypto from 'crypto';

export const agentRouter = router({
  // 1. LIST
  list: publicProcedure
    .input(filterAgentsDto.optional())
    .output(z.array(z.custom<Agent>()))
    .query(async ({ ctx, input }) => {
      let query = ctx.db.select().from(agents);

      if (input?.role) {
        // @ts-ignore
        query = query.where(eq(agents.role, input.role));
      }
      if (input?.isActive !== undefined) {
        // @ts-ignore
        query = query.where(eq(agents.isActive, input.isActive));
      }

      const rows = await query;

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role as Agent['role'],
        modelId: row.modelId,
        systemPrompt: row.systemPrompt,
        temperature: row.temperature,
        maxTokens: row.maxTokens ?? undefined,
        tools: row.tools,
        metadata: row.metadata ?? undefined,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }),

  // 2. CREATE
  create: protectedProcedure
    .input(createAgentDto)
    .output(z.custom<Agent>())
    .mutation(async ({ ctx, input }) => {
      // Validate Provider
      const providerExists = await ctx.db
        .select()
        .from(providers)
        .where(eq(providers.id, input.modelId))
        .limit(1);

      if (!providerExists.length) {
        throw AppError.badRequest(`Provider with ID ${input.modelId} does not exist`);
      }

      const newId = crypto.randomUUID();
      const newAgent = {
        id: newId,
        name: input.name,
        role: input.role as any,
        modelId: input.modelId,
        systemPrompt: input.systemPrompt,
        temperature: input.temperature ?? 0.7,
        maxTokens: input.maxTokens ?? null,
        tools: input.tools ?? [],
        metadata: input.metadata ?? null,
        isActive: input.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await ctx.db.insert(agents).values(newAgent);
      return newAgent;
    }),

  // 3. UPDATE (THIS WAS MISSING)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().optional(),
          role: z.string().optional(),
          modelId: z.string().optional(),
          systemPrompt: z.string().optional(),
          temperature: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if agent exists
      const existing = await ctx.db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id))
        .limit(1);

      if (!existing.length) {
        throw AppError.notFound(`Agent ${input.id} not found`);
      }

      // Perform Update
      await ctx.db
        .update(agents)
        .set({
          ...input.data,
          role: input.data.role as any, // Cast string to enum if needed
          updatedAt: new Date(),
        })
        .where(eq(agents.id, input.id));

      return { success: true, id: input.id };
    }),

  // 4. GET BY ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<Agent>())
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw AppError.notFound(`Agent with ID ${input.id} not found`);
      }

      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        role: row.role as Agent['role'],
        modelId: row.modelId,
        systemPrompt: row.systemPrompt,
        temperature: row.temperature,
        tools: row.tools,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }),

  // 5. TOGGLE ACTIVE
  toggleActive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id))
        .limit(1);

      if (!agent[0]) {
        throw AppError.notFound(`Agent with ID ${input.id} not found`);
      }

      const newState = !agent[0].isActive;

      await ctx.db
        .update(agents)
        .set({ isActive: newState, updatedAt: new Date() })
        .where(eq(agents.id, input.id));

      return { success: true, isActive: newState };
    }),

  // 6. DELETE
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(agents).where(eq(agents.id, input.id));
      return { success: true, deletedId: input.id };
    }),
});