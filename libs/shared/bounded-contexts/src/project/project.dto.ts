import { z } from 'zod';
import { ProjectStatus } from '../common/enums';

/**
 * Create project DTO
 */
export const createProjectDto = z.object({
  name: z.string().min(1).max(200),
  description: z.string(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  repositoryPath: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectDto>;

/**
 * Update project DTO
 */
export const updateProjectDto = createProjectDto.partial();
export type UpdateProjectDto = z.infer<typeof updateProjectDto>;

/**
 * Assign agent to project DTO
 */
export const assignAgentDto = z.object({
  projectId: z.string().uuid(),
  agentId: z.string().uuid(),
  role: z.enum(['lead', 'contributor', 'reviewer']).default('contributor'),
});
export type AssignAgentDto = z.infer<typeof assignAgentDto>;

/**
 * Unassign agent DTO
 */
export const unassignAgentDto = z.object({
  projectId: z.string().uuid(),
  agentId: z.string().uuid(),
});
export type UnassignAgentDto = z.infer<typeof unassignAgentDto>;
