import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { AgentRepository, ProviderRepository } from '@ai-workbench-frontend/database';
import { AppError } from '@ai-workbench-frontend/trpc-server';
import {
  createAgentDto,
  updateAgentDto,
  filterAgentsDto,
  type Agent,
  type AgentWithProvider,
} from '@ai-workbench-frontend/bounded-contexts';
import { z } from 'zod';

export const agentRouter = router({
  /**
   * List all agents with optional filters
   */
  list: publicProcedure
    .input(filterAgentsDto.optional())
    .output(z.array(z.custom<Agent>()))
    .query(async ({ ctx, input }) => {
      const repo = new AgentRepository();

      if (input?.role) {
        return repo.findByRole(input.role);
      }

      if (input?.isActive !== undefined) {
        return input.isActive ? repo.findActive() : repo.findAll();
      }

      return repo.findAll();
    }),

  /**
   * Get agent by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<Agent>())
    .query(async ({ ctx, input }) => {
      const repo = new AgentRepository();
      const agent = await repo.findById(input.id);

      if (!agent) {
        throw AppError.notFound(`Agent with ID ${input.id} not found`);
      }

      return agent;
    }),

  /**
   * Get agent with provider info
   */
  getWithProvider: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<AgentWithProvider>())
    .query(async ({ ctx, input }) => {
      const repo = new AgentRepository();
      const agent = await repo.findWithProvider(input.id);

      if (!agent) {
        throw AppError.notFound(`Agent with ID ${input.id} not found`);
      }

      return agent;
    }),

  /**
   * Create new agent
   */
  create: protectedProcedure
    .input(createAgentDto)
    .output(z.custom<Agent>())
    .mutation(async ({ ctx, input }) => {
      const agentRepo = new AgentRepository();
      const providerRepo = new ProviderRepository();

      // Verify provider exists
      const providerExists = await providerRepo.exists(input.modelId);
      if (!providerExists) {
        throw AppError.badRequest(`Provider with ID ${input.modelId} does not exist`);
      }

      return agentRepo.create(input);
    }),

  /**
   * Update agent
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateAgentDto,
    }))
    .output(z.custom<Agent>())
    .mutation(async ({ ctx, input }) => {
      const agentRepo = new AgentRepository();

      // Verify exists
      const exists = await agentRepo.exists(input.id);
      if (!exists) {
        throw AppError.notFound(`Agent with ID ${input.id} not found`);
      }

      // If updating modelId, verify new provider exists
      if (input.data.modelId) {
        const providerRepo = new ProviderRepository();
        const providerExists = await providerRepo.exists(input.data.modelId);
        if (!providerExists) {
          throw AppError.badRequest(`Provider with ID ${input.data.modelId} does not exist`);
        }
      }

      const updated = await agentRepo.update(input.id, input.data);
      if (!updated) {
        throw AppError.internal('Failed to update agent');
      }

      return updated;
    }),

  /**
   * Toggle agent active status
   */
  toggleActive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new AgentRepository();

      const updated = await repo.toggleActive(input.id);
      if (!updated) {
        throw AppError.notFound(`Agent with ID ${input.id} not found`);
      }

      return { success: true, isActive: updated.isActive };
    }),

  /**
   * Delete agent
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new AgentRepository();

      const deleted = await repo.delete(input.id);
      if (!deleted) {
        throw AppError.notFound(`Agent with ID ${input.id} not found`);
      }

      return { success: true, deletedId: input.id };
    }),
});
