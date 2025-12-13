import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/init';
import {
  ProviderSchema,
  CreateProviderSchema,
  ProviderTypeEnum,
  type AIModel,
} from '@ai-workbench/bounded-contexts';
import { providers, agents } from '@ai-workbench/shared/database';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

// --- HELPER: Safe Network Probe (No Axios) ---
type ProbeResult = { alive: boolean; models: Array<{ id: string }> };

async function probeEndpoint(url: string): Promise<ProbeResult> {
  const controller = new AbortController();
  // 1.5s Timeout prevents the UI from freezing on dead IPs
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    console.log(`📡 Probing: ${url}...`); 

    const response = await fetch(`${url}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      
      // FIX: Strict check to ensure 'models' is NEVER undefined
      const rawModels = (data && Array.isArray(data.data)) ? data.data : [];
      
      // Clean mapping
      const models = rawModels.map((m: any) => ({
        id: m?.id ? String(m.id) : 'unknown-model'
      }));

      console.log(`✅ Alive: ${url} (${models.length} models)`);
      return { alive: true, models };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Ignore normal network errors during scan
    if (error.name !== 'AbortError') {
      console.log(`❌ Unreachable [${url}]`);
    }
  }
  return { alive: false, models: [] };
}

export const providerRouter = router({
  // 1. LIST
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

  // 2. CREATE
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

  // 3. BATCH IMPORT SWARM (Auto-Hires Agents)
  importSwarm: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          endpoint: z.string(),
          model: z.string().optional(),
          role: z.string().optional(),
          type: z.string(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const newProviders: any[] = [];
      const newAgents: any[] = [];

      for (const p of input) {
        const providerId = crypto.randomUUID();

        // A. Create Provider
        newProviders.push({
          id: providerId,
          name: p.name,
          label: p.role ? `${p.name} (${p.role})` : p.name,
          type: p.type,
          endpoint: p.endpoint,
          apiKey: null,
          models: p.model
            ? [{ id: p.model, name: p.model, capabilities: ['chat'], status: 'available' }]
            : [],
          workspaceScope: 'global',
          status: 'offline',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // B. Create Agent (If role exists)
        if (p.role) {
          let agentName = p.name;
          let roleType = 'coder'; // Safe default for schema
          let systemPrompt = 'You are a helpful AI assistant.';

          if (p.role === 'planner-agent') {
            agentName = 'Planner';
            roleType = 'planner';
            systemPrompt = 'You are a Senior Software Architect. Plan systems, create specs.';
          } else if (p.role === 'executor-agent') {
            agentName = 'Lead Engineer';
            roleType = 'coder';
            systemPrompt = 'You are a Lead Software Engineer. Write production-ready code.';
          } else if (p.role === 'reviewer-agent') {
            agentName = 'Reviewer';
            roleType = 'reviewer';
            systemPrompt = 'You are a QA Specialist. Review code strictly.';
          }

          newAgents.push({
            id: crypto.randomUUID(),
            name: agentName,
            role: roleType,
            modelId: providerId,
            systemPrompt: systemPrompt,
            temperature: 0.7,
            tools: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      if (newProviders.length > 0) await ctx.db.insert(providers).values(newProviders);
      if (newAgents.length > 0) await ctx.db.insert(agents).values(newAgents);

      return { success: true, count: newProviders.length + newAgents.length };
    }),

  // 4. DELETE
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(providers).where(eq(providers.id, input.id));
      return { success: true };
    }),

  // 5. SCAN LOCAL NETWORK (Uses ProbeEndpoint)
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
            // Map objects {id: "foo"} -> strings "foo"
            models: probe.models.map((m: any) => m.id),
          };
        }),
      );

      return results.filter((item): item is NonNullable<typeof item> => Boolean(item));
    }),

  // 6. REFRESH
  refreshModels: protectedProcedure
    .input(z.object({ providerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.query.providers.findFirst({ where: eq(providers.id, input.providerId) });
      if (!provider?.endpoint) throw new Error('Provider not reachable');

      const probe = await probeEndpoint(provider.endpoint);
      if (!probe.alive) {
        await ctx.db.update(providers)
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

      await ctx.db.update(providers)
        .set({ models: mappedModels, status: 'running', lastChecked: new Date() })
        .where(eq(providers.id, input.providerId));

      return { success: true, count: mappedModels.length };
    }),
});