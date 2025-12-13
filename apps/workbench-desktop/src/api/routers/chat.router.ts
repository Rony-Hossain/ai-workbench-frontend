import { router, publicProcedure, protectedProcedure } from '../trpc/init';
import { z } from 'zod';
import {
  messages,
  conversations,
  agents,
  providers,
} from '@ai-workbench/shared/database';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import * as crypto from 'crypto';
import axios from 'axios';

// --- HELPER: The Agent Executor ---
async function executeAgent(
  ctx: any,
  agentId: string,
  conversationId: string,
  userContent: string
) {
  // 1. Find Agent
  const agent = await ctx.db.query.agents.findFirst({
    where: eq(agents.id, agentId),
  });
  if (!agent) return { success: false, error: `Agent ${agentId} not found` };

  // 2. Find Provider
  const provider = await ctx.db.query.providers.findFirst({
    where: eq(providers.id, agent.modelId),
  });

  if (!provider || !provider.endpoint) {
    await ctx.db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId,
      role: 'system',
      content: `⚠️ Error: Agent ${agent.name} provider is offline.`,
      timestamp: new Date(),
    });
    return { success: false, error: 'Provider offline' };
  }

  // --- 3. URL NORMALIZATION ---
  // Ensure we hit the correct Llama.cpp endpoint: /v1/chat/completions
  let baseEndpoint = provider.endpoint.replace(/\/+$/, '');
  let targetUrl = `${baseEndpoint}/chat/completions`;
  if (!baseEndpoint.endsWith('/v1')) {
    targetUrl = `${baseEndpoint}/v1/chat/completions`;
  }

  // --- 4. MODEL NAME RESOLUTION ---
  // Use the exact name from your curl output ("Phi-3-mini...gguf")
  let realModelName = 'default';

  if (
    provider.models &&
    Array.isArray(provider.models) &&
    provider.models.length > 0
  ) {
    const m = provider.models[0] as any;
    realModelName = m.id || m.model || m.name || 'default';
  }

  // --- 5. PREPARE CONTEXT ---
  const history = await ctx.db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: (messages: any, { desc }: any) => [desc(messages.timestamp)],
    limit: 10,
  });

  const formattedHistory = history.reverse().map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

  // --- 6. EXECUTE ---
  try {
    const payload = {
      model: realModelName, 
      messages: [
        { role: 'system', content: agent.systemPrompt || 'You are a helpful assistant.' },
        ...formattedHistory,
        { role: 'user', content: userContent }
      ],
      temperature: agent.temperature || 0.7,
      max_tokens: 1024,                       // <--- ADD THIS
      stop: ["<|im_end|>", "<|im_start|>"],   // <--- ADD THIS
      stream: false 
    };

    console.log(`🚀 [EXEC] Sending to ${agent.name}...`);
    console.log(`   -> URL:   ${targetUrl}`);
    console.log(`   -> Model: ${realModelName}`);

    const response = await axios.post(targetUrl, payload, {
      timeout: 120000, // <--- 2 MINUTES (Handles Cold Starts)
      validateStatus: () => true, // Don't throw on 400/500
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 200) {
      console.error(`🔥 [EXEC] API Error ${response.status}:`, response.data);
      throw new Error(
        `API Error ${response.status}: ${JSON.stringify(response.data)}`
      );
    }

    const aiText = response.data?.choices?.[0]?.message?.content || '...';

    // 7. Save Response
    await ctx.db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId,
      role: 'assistant',
      content: aiText,
      timestamp: new Date(),
      metadata: JSON.stringify({ agentId: agent.id, agentName: agent.name }),
    });

    console.log(`✅ [EXEC] Success: ${aiText.substring(0, 30)}...`);
    return { success: true };
  } catch (err: any) {
    console.error(`🔥 [EXEC] CRITICAL FAIL:`, err.message);
    await ctx.db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId,
      role: 'system',
      content: `[System Error]: ${err.message}`,
      timestamp: new Date(),
    });
    return { success: false, error: err.message };
  }
}

export const chatRouter = router({
  // 1. GET HISTORY
  history: protectedProcedure
    .input(z.object({ conversationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.conversationId) return [];
      const rows = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(desc(messages.timestamp));

      return rows.reverse();
    }),

  // 2. SEND MESSAGE
  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string(),
        targetAgentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { conversationId, content } = input;
      let targetId = input.targetAgentId;

      console.log(
        `📨 [ROUTER] Inbound: "${content.substring(0, 15)}..." -> ${targetId}`
      );

      await ctx.db.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId,
        role: 'user',
        content,
        timestamp: new Date(),
      });

      // Routing Logic
      if (targetId && targetId !== 'all') {
        return executeAgent(ctx, targetId, conversationId, content);
      }

      // Auto-Routing: Mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = [...content.matchAll(mentionRegex)].map((m) =>
        m[1].toLowerCase()
      );

      if (mentions.length > 0) {
        console.log(`🔀 [ROUTER] Mentions detected:`, mentions);
        const allAgents = await ctx.db.select().from(agents);
        const matchedAgents = allAgents.filter(
          (a: any) =>
            mentions.includes(a.name.toLowerCase()) ||
            mentions.includes(a.role.toLowerCase().replace('_', ''))
        );

        if (matchedAgents.length > 0) {
          await Promise.all(
            matchedAgents.map((a: any) =>
              executeAgent(ctx, a.id, conversationId, content)
            )
          );
          return { success: true, strategy: 'mentions' };
        }
      }

      // Auto-Routing: Supervisor Fallback
      console.log(`🔀 [ROUTER] Defaulting to Supervisor.`);
      const supervisor = await ctx.db.query.agents.findFirst({
        where: eq(agents.role, 'planner'),
      });

      const fallback =
        supervisor ||
        (await ctx.db.query.agents.findFirst({
          where: eq(agents.isActive, true),
        }));

      if (fallback) {
        return executeAgent(ctx, fallback.id, conversationId, content);
      }

      await ctx.db.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId,
        role: 'system',
        content: '⚠️ No active agents found to reply.',
        timestamp: new Date(),
      });

      return { success: false, error: 'No agents' };
    }),

  // 3. CREATE CONVERSATION
  createConversation: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(conversations).values({
        id,
        title: input.title || 'New Chat',
        agentIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id };
    }),
});
