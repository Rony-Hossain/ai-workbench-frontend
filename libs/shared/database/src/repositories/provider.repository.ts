import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { providers, agents, type ProviderRow } from '../schema';
import { BaseRepository } from './base.repository';
import type {
  Provider,
  ProviderConnectionTest,
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
      label: row.label ?? undefined,
      type: row.type,
      endpoint: row.endpoint ?? undefined,
      isConfigured: Boolean(row.apiKey),
      models: row.models ?? [],
      workspaceScope: row.workspaceScope ?? 'global',
      status: row.status ?? 'offline',
      lastChecked: row.lastChecked ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  protected toDatabase(domain: Partial<Provider>): Partial<ProviderRow> {
    const domainWithKey = domain as Partial<Provider> & { apiKey?: string };
    return {
      id: domain.id,
      name: domain.name,
      label: domain.label ?? null,
      type: domain.type,
      endpoint: domain.endpoint ?? null,
      apiKey: domainWithKey.apiKey ?? null,
      models: domain.models ?? [],
      workspaceScope: domain.workspaceScope ?? 'global',
      status: domain.status ?? 'offline',
      lastChecked: domain.lastChecked ?? null,
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
