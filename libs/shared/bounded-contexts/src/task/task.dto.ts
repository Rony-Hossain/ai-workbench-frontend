import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../common/enums';

/**
 * Create task DTO
 */
export const createTaskDto = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assignedToAgentId: z.string().uuid().optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.date().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskDto>;

/**
 * Update task DTO
 */
export const updateTaskDto = createTaskDto.partial().extend({
  actualHours: z.number().positive().optional(),
  completedAt: z.date().optional(),
});
export type UpdateTaskDto = z.infer<typeof updateTaskDto>;

/**
 * Complete task DTO
 */
export const completeTaskDto = z.object({
  id: z.string().uuid(),
  actualHours: z.number().positive(),
});
export type CompleteTaskDto = z.infer<typeof completeTaskDto>;

/**
 * Filter tasks DTO
 */
export const filterTasksDto = z.object({
  projectId: z.string().uuid().optional(),
  assignedToAgentId: z.string().uuid().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  includeDeleted: z.boolean().default(false),
});
export type FilterTasksDto = z.infer<typeof filterTasksDto>;
