import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { providers, agents, type ProviderRow } from '../schema';
import { BaseRepository } from './base.repository';
import type { 
  Provider, 
  ProviderConnectionTest,
  CreateProviderDto 
} from '@ai-workbench-frontend/bounded-contexts';

export class ProviderRepository extends BaseRepository<
  typeof providers,
  Provider,
  ProviderRow
> {
  constructor() {
    super(providers);
  }

  protected toDomain(row: ProviderRow): Provider {
    return {
      id: row.id,
      name: row.name,
      type: row.type as Provider['type'],
      endpoint: row.endpoint ?? undefined,
      apiKey: row.apiKey ?? undefined,
      models: row.models,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  protected toDatabase(domain: Partial<Provider>): Partial<ProviderRow> {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type as any,
      endpoint: domain.endpoint ?? null,
      apiKey: domain.apiKey ?? null,
      models: domain.models as any,
      metadata: domain.metadata ?? null,
    };
  }

  async findByType(type: Provider['type']): Promise<Provider[]> {
    const rows = await db.select().from(providers).where(eq(providers.type, type)).all();
    return rows.map(row => this.toDomain(row));
  }

  async findByName(name: string): Promise<Provider | undefined> {
    const results = await db.select().from(providers).where(eq(providers.name, name)).limit(1);
    return results[0] ? this.toDomain(results[0]) : undefined;
  }

  async hasActiveAgents(providerId: string): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(agents)
      .where(eq(agents.modelId, providerId));
    return result[0].count > 0;
  }

  async testConnection(providerId: string): Promise<ProviderConnectionTest> {
    const provider = await this.findById(providerId);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    try {
      const start = Date.now();
      // TODO: Implement actual connection test based on provider type
      const latency = Date.now() - start;
      return { success: true, latency };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
