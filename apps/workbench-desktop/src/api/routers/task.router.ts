import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { TaskRepository, ProjectRepository } from '@ai-workbench-frontend/database';
import { AppError } from '@ai-workbench-frontend/trpc-server';
import {
  createTaskDto,
  updateTaskDto,
  completeTaskDto,
  filterTasksDto,
  type Task,
} from '@ai-workbench-frontend/bounded-contexts';
import { z } from 'zod';

export const taskRouter = router({
  /**
   * List tasks with filters
   */
  list: publicProcedure
    .input(filterTasksDto.optional())
    .output(z.array(z.custom<Task>()))
    .query(async ({ ctx, input }) => {
      const repo = new TaskRepository();

      if (input?.projectId) {
        return repo.findByProject(input.projectId, input.includeDeleted);
      }

      if (input?.assignedToAgentId) {
        return repo.findByAgent(input.assignedToAgentId);
      }

      return repo.findAll(input?.includeDeleted);
    }),

  /**
   * Get task by ID
   */
  getById: publicProcedure
    .input(z.object({ 
      id: z.string().uuid(),
      includeDeleted: z.boolean().default(false) 
    }))
    .output(z.custom<Task>())
    .query(async ({ ctx, input }) => {
      const repo = new TaskRepository();
      const task = await repo.findById(input.id, input.includeDeleted);

      if (!task) {
        throw AppError.notFound(`Task with ID ${input.id} not found`);
      }

      return task;
    }),

  /**
   * Get overdue tasks
   */
  getOverdue: publicProcedure
    .output(z.array(z.custom<Task>()))
    .query(async ({ ctx }) => {
      const repo = new TaskRepository();
      return repo.findOverdue();
    }),

  /**
   * Create new task
   */
  create: protectedProcedure
    .input(createTaskDto)
    .output(z.custom<Task>())
    .mutation(async ({ ctx, input }) => {
      const taskRepo = new TaskRepository();
      const projectRepo = new ProjectRepository();

      // Verify project exists
      const projectExists = await projectRepo.exists(input.projectId);
      if (!projectExists) {
        throw AppError.notFound(`Project with ID ${input.projectId} not found`);
      }

      return taskRepo.create(input);
    }),

  /**
   * Update task
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateTaskDto,
    }))
    .output(z.custom<Task>())
    .mutation(async ({ ctx, input }) => {
      const repo = new TaskRepository();

      const exists = await repo.exists(input.id);
      if (!exists) {
        throw AppError.notFound(`Task with ID ${input.id} not found`);
      }

      const updated = await repo.update(input.id, input.data);
      if (!updated) {
        throw AppError.internal('Failed to update task');
      }

      return updated;
    }),

  /**
   * Complete task
   */
  complete: protectedProcedure
    .input(completeTaskDto)
    .output(z.custom<Task>())
    .mutation(async ({ ctx, input }) => {
      const repo = new TaskRepository();

      const task = await repo.findById(input.id);
      if (!task) {
        throw AppError.notFound(`Task with ID ${input.id} not found`);
      }

      if (task.status === 'done') {
        throw AppError.badRequest('Task is already completed');
      }

      const updated = await repo.update(input.id, {
        status: 'done',
        actualHours: input.actualHours,
        completedAt: new Date(),
      });

      if (!updated) {
        throw AppError.internal('Failed to complete task');
      }

      return updated;
    }),

  /**
   * Soft delete task
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new TaskRepository();

      const deleted = await repo.softDelete(input.id);
      if (!deleted) {
        throw AppError.notFound(`Task with ID ${input.id} not found`);
      }

      return { success: true, deletedId: input.id };
    }),

  /**
   * Restore soft-deleted task
   */
  restore: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new TaskRepository();

      const restored = await repo.restore(input.id);
      if (!restored) {
        throw AppError.notFound(`Task with ID ${input.id} not found or not deleted`);
      }

      return { success: true };
    }),

  /**
   * Get deleted tasks
   */
  listDeleted: publicProcedure
    .output(z.array(z.custom<Task>()))
    .query(async ({ ctx }) => {
      const repo = new TaskRepository();
      return repo.findDeleted();
    }),
});
