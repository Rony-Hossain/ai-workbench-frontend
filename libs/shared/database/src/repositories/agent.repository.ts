import { eq, and, sql } from 'drizzle-orm';
import { db } from '../client';
import { agents, providers, type AgentRow } from '../schema';
import { BaseRepository } from './base.repository';
import type { Agent, AgentWithProvider } from '@ai-workbench-frontend/bounded-contexts';

export class AgentRepository extends BaseRepository<
  typeof agents,
  Agent,
  AgentRow
> {
  constructor() {
    super(agents);
  }

  protected toDomain(row: AgentRow): Agent {
    return {
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
    };
  }

  protected toDatabase(domain: Partial<Agent>): Partial<AgentRow> {
    return {
      id: domain.id,
      name: domain.name,
      role: domain.role as any,
      modelId: domain.modelId,
      systemPrompt: domain.systemPrompt,
      temperature: domain.temperature,
      maxTokens: domain.maxTokens ?? null,
      tools: domain.tools as any,
      metadata: domain.metadata ?? null,
      isActive: domain.isActive,
    };
  }

  async findByRole(role: Agent['role']): Promise<Agent[]> {
    const rows = await db.select().from(agents).where(eq(agents.role, role)).all();
    return rows.map(row => this.toDomain(row));
  }

  async findActive(): Promise<Agent[]> {
    const rows = await db.select().from(agents).where(eq(agents.isActive, true)).all();
    return rows.map(row => this.toDomain(row));
  }

  async findWithProvider(agentId: string): Promise<AgentWithProvider | undefined> {
    const result = await db
      .select({
        agent: agents,
        provider: {
          id: providers.id,
          name: providers.name,
          type: providers.type,
        },
      })
      .from(agents)
      .innerJoin(providers, eq(agents.modelId, providers.id))
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!result[0]) return undefined;

    return {
      ...this.toDomain(result[0].agent),
      provider: result[0].provider as any,
    };
  }

  async toggleActive(agentId: string): Promise<Agent | undefined> {
    const agent = await this.findById(agentId);
    if (!agent) return undefined;

    return this.update(agentId, { isActive: !agent.isActive });
  }
}
