import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/init';
import {
  ProviderSchema,
  CreateProviderSchema,
  ProviderTypeEnum,
  type AIModel,
} from '@ai-workbench/bounded-contexts';
import { providers } from '@ai-workbench/shared/database';
import { eq } from 'drizzle-orm';

type ProbeResult = { alive: boolean; models: Array<{ id: string }> };

async function probeEndpoint(url: string): Promise<ProbeResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${url}/models`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as { data?: Array<{ id: string }> };
      return {
        alive: true,
        models: Array.isArray(data.data) ? data.data : [],
      };
    }
  } catch (error) {
    // Ignore errors; treated as offline endpoint
  }
  return { alive: false, models: [] };
}

export const providerRouter = router({
  list: protectedProcedure
    .output(z.array(ProviderSchema))
    .query(async ({ ctx }) => {
      const rows = await ctx.db.select().from(providers);

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        label: row.label ?? row.name,
        type: row.type as z.infer<typeof ProviderTypeEnum>,
        endpoint: row.endpoint ?? undefined,
        isConfigured: Boolean(row.apiKey) || row.type === 'local',
        models: (row.models ?? []) as AIModel[],
        workspaceScope: row.workspaceScope ?? 'global',
        status: row.status ?? 'offline',
        lastChecked: row.lastChecked ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }),

  create: protectedProcedure
    .input(CreateProviderSchema)
    .mutation(async ({ ctx, input }) => {
      const safeKey = input.apiKey ? `encrypted_${input.apiKey}` : null;

      await ctx.db.insert(providers).values({
        id: crypto.randomUUID(),
        name: input.name,
        label: input.label ?? input.name,
        type: input.type,
        endpoint: input.endpoint,
        apiKey: safeKey,
        models: [],
        workspaceScope: input.workspaceScope,
        status: 'offline',
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(providers).where(eq(providers.id, input.id));
      return { success: true };
    }),

  scanLocalNetwork: protectedProcedure
    .output(
      z.array(
        z.object({
          endpoint: z.string(),
          name: z.string(),
          models: z.array(z.string()),
        }),
      ),
    )
    .query(async () => {
      const candidates = [
        { url: 'http://10.0.0.110:8080/v1', name: 'Phi-3 (Intern)' },
        { url: 'http://10.0.0.110:8081/v1', name: 'DeepSeek (Architect)' },
        { url: 'http://10.0.0.110:8082/v1', name: 'Qwen (Engineer)' },
        { url: 'http://10.0.0.110:8092/v1', name: 'Jina (Embeddings)' },
        { url: 'http://localhost:11434/v1', name: 'Local Ollama' },
        { url: 'http://localhost:1234/v1', name: 'LM Studio' },
      ];

      const results = await Promise.all(
        candidates.map(async (candidate) => {
          const probe = await probeEndpoint(candidate.url);
          if (!probe.alive) return null;
          return {
            endpoint: candidate.url,
            name: candidate.name,
            models: probe.models.map((model) => model.id),
          };
        }),
      );

      return results.filter((item): item is NonNullable<typeof item> => Boolean(item));
    }),

  refreshModels: protectedProcedure
    .input(z.object({ providerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.providerId),
      });

      if (!provider || !provider.endpoint) {
        throw new Error('Provider not reachable');
      }

      const probe = await probeEndpoint(provider.endpoint);
      if (!probe.alive) {
        await ctx.db
          .update(providers)
          .set({ status: 'offline', lastChecked: new Date() })
          .where(eq(providers.id, input.providerId));
        return { success: false, message: 'Endpoint offline' };
      }

      const mappedModels: AIModel[] = probe.models.map((model) => ({
        id: model.id,
        name: model.id,
        capabilities: ['chat'],
        contextWindow: 4096,
        status: 'available',
      }));

      await ctx.db
          .update(providers)
          .set({
            models: mappedModels,
            status: 'running',
            lastChecked: new Date(),
          })
          .where(eq(providers.id, input.providerId));

      return { success: true, count: mappedModels.length };
    }),
});
