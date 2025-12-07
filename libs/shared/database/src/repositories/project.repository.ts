import { eq, and, sql } from 'drizzle-orm';
import { db } from '../client';
import { projects, projectAgents, agents, tasks, type ProjectRow } from '../schema';
import { BaseRepository } from './base.repository';
import type { 
  Project, 
  ProjectWithAgents, 
  ProjectAgent,
  ProjectStats 
} from '@ai-workbench-frontend/bounded-contexts';

export class ProjectRepository extends BaseRepository<
  typeof projects,
  Project,
  ProjectRow
> {
  constructor() {
    super(projects);
  }

  protected toDomain(row: ProjectRow): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status as Project['status'],
      repositoryPath: row.repositoryPath ?? undefined,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  protected toDatabase(domain: Partial<Project>): Partial<ProjectRow> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      status: domain.status as any,
      repositoryPath: domain.repositoryPath ?? null,
      metadata: domain.metadata ?? null,
    };
  }

  /**
   * Find project with all assigned agents (many-to-many)
   */
  async findWithAgents(projectId: string): Promise<ProjectWithAgents | undefined> {
    const project = await this.findById(projectId);
    if (!project) return undefined;

    const agentsList = await db
      .select({
        agent: agents,
        role: projectAgents.role,
        hoursWorked: projectAgents.hoursWorked,
      })
      .from(projectAgents)
      .innerJoin(agents, eq(projectAgents.agentId, agents.id))
      .where(eq(projectAgents.projectId, projectId))
      .all();

    return {
      ...project,
      agents: agentsList.map(({ agent, role, hoursWorked }) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role as any,
        modelId: agent.modelId,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens ?? undefined,
        tools: agent.tools,
        metadata: agent.metadata ?? undefined,
        isActive: agent.isActive,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        role: role,
        hoursWorked: hoursWorked,
      })),
    };
  }

  /**
   * Assign agent to project
   */
  async assignAgent(
    projectId: string,
    agentId: string,
    role: ProjectAgent['role'] = 'contributor'
  ): Promise<void> {
    await db.insert(projectAgents).values({
      projectId,
      agentId,
      role,
    });
  }

  /**
   * Remove agent from project
   */
  async unassignAgent(projectId: string, agentId: string): Promise<boolean> {
    const result = await db
      .delete(projectAgents)
      .where(
        and(
          eq(projectAgents.projectId, projectId),
          eq(projectAgents.agentId, agentId)
        )
      );
    return result.changes > 0;
  }

  /**
   * Get project statistics
   */
  async getStatistics(projectId: string): Promise<ProjectStats> {
    const [agentStats] = await db
      .select({
        totalAgents: sql<number>`count(distinct ${projectAgents.agentId})`,
        totalHours: sql<number>`coalesce(sum(${projectAgents.hoursWorked}), 0)`,
      })
      .from(projectAgents)
      .where(eq(projectAgents.projectId, projectId));

    const [taskStats] = await db
      .select({
        total: sql<number>`count(*)`,
        todo: sql<number>`sum(case when ${tasks.status} = 'todo' then 1 else 0 end)`,
        inProgress: sql<number>`sum(case when ${tasks.status} = 'in_progress' then 1 else 0 end)`,
        blocked: sql<number>`sum(case when ${tasks.status} = 'blocked' then 1 else 0 end)`,
        done: sql<number>`sum(case when ${tasks.status} = 'done' then 1 else 0 end)`,
        overdue: sql<number>`sum(case when ${tasks.dueDate} < ${Date.now()} and ${tasks.status} != 'done' then 1 else 0 end)`,
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.isDeleted, false)));

    return {
      totalAgents: agentStats?.totalAgents || 0,
      totalHours: agentStats?.totalHours || 0,
      taskStats: {
        total: taskStats?.total || 0,
        todo: taskStats?.todo || 0,
        inProgress: taskStats?.inProgress || 0,
        blocked: taskStats?.blocked || 0,
        done: taskStats?.done || 0,
        overdue: taskStats?.overdue || 0,
      },
    };
  }
}
