import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { ProjectRepository, AgentRepository } from '@ai-workbench-frontend/database';
import { AppError } from '@ai-workbench-frontend/trpc-server';
import {
  createProjectDto,
  updateProjectDto,
  assignAgentDto,
  unassignAgentDto,
  type Project,
  type ProjectWithAgents,
  type ProjectStats,
} from '@ai-workbench-frontend/bounded-contexts';
import { z } from 'zod';

export const projectRouter = router({
  /**
   * List all projects
   */
  list: publicProcedure
    .output(z.array(z.custom<Project>()))
    .query(async ({ ctx }) => {
      const repo = new ProjectRepository();
      return repo.findAll();
    }),

  /**
   * Get project by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<Project>())
    .query(async ({ ctx, input }) => {
      const repo = new ProjectRepository();
      const project = await repo.findById(input.id);

      if (!project) {
        throw AppError.notFound(`Project with ID ${input.id} not found`);
      }

      return project;
    }),

  /**
   * Get project with all assigned agents
   */
  getWithAgents: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<ProjectWithAgents>())
    .query(async ({ ctx, input }) => {
      const repo = new ProjectRepository();
      const result = await repo.findWithAgents(input.id);

      if (!result) {
        throw AppError.notFound(`Project with ID ${input.id} not found`);
      }

      return result;
    }),

  /**
   * Get project statistics
   */
  getStatistics: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.custom<ProjectStats>())
    .query(async ({ ctx, input }) => {
      const repo = new ProjectRepository();
      return repo.getStatistics(input.id);
    }),

  /**
   * Create new project
   */
  create: protectedProcedure
    .input(createProjectDto)
    .output(z.custom<Project>())
    .mutation(async ({ ctx, input }) => {
      const repo = new ProjectRepository();
      return repo.create(input);
    }),

  /**
   * Update project
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateProjectDto,
    }))
    .output(z.custom<Project>())
    .mutation(async ({ ctx, input }) => {
      const repo = new ProjectRepository();

      const exists = await repo.exists(input.id);
      if (!exists) {
        throw AppError.notFound(`Project with ID ${input.id} not found`);
      }

      const updated = await repo.update(input.id, input.data);
      if (!updated) {
        throw AppError.internal('Failed to update project');
      }

      return updated;
    }),

  /**
   * Assign agent to project
   */
  assignAgent: protectedProcedure
    .input(assignAgentDto)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const projectRepo = new ProjectRepository();
      const agentRepo = new AgentRepository();

      // Verify project exists
      const projectExists = await projectRepo.exists(input.projectId);
      if (!projectExists) {
        throw AppError.notFound(`Project with ID ${input.projectId} not found`);
      }

      // Verify agent exists
      const agentExists = await agentRepo.exists(input.agentId);
      if (!agentExists) {
        throw AppError.notFound(`Agent with ID ${input.agentId} not found`);
      }

      await projectRepo.assignAgent(input.projectId, input.agentId, input.role);
      return { success: true };
    }),

  /**
   * Remove agent from project
   */
  unassignAgent: protectedProcedure
    .input(unassignAgentDto)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new ProjectRepository();

      const removed = await repo.unassignAgent(input.projectId, input.agentId);
      if (!removed) {
        throw AppError.notFound('Agent assignment not found');
      }

      return { success: true };
    }),

  /**
   * Delete project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new ProjectRepository();

      const deleted = await repo.delete(input.id);
      if (!deleted) {
        throw AppError.notFound(`Project with ID ${input.id} not found`);
      }

      // Note: Agents and tasks are cascade deleted via foreign keys
      return { success: true, deletedId: input.id };
    }),
});
