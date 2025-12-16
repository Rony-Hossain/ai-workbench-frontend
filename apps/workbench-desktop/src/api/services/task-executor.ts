import { rawDb as sqliteDb, db } from '../database';
import { agents, messages, providers } from '@ai-workbench/shared/database';
import { AgentProtocolSchema, type AgentProtocol } from '@ai-workbench/bounded-contexts';
import { gbnfGenerator } from '@ai-workbench/shared/ai-engine';
import type { MessageMetadata } from '@ai-workbench/bounded-contexts';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import * as crypto from 'crypto';
import { buildPlannerRagInjection } from '../rag/planner-rag-context';

export interface ExecutionResult {
  protocol: AgentProtocol;
  messageId: string;
}

type LlmRole = 'system' | 'user' | 'assistant';

/**
 * Normalize DB roles to roles accepted by most /v1/chat/completions implementations.
 * - We store internal agent outputs as "tool" in DB, but we send them to the LLM as "assistant".
 */
function normalizeRoleForLlm(role: string): LlmRole {
  if (role === 'tool') return 'assistant';
  if (role === 'system' || role === 'user' || role === 'assistant') return role;
  // Fallback: safest default
  return 'assistant';
}

export class TaskExecutor {
  private grammar: string;

  constructor(private agentId: string, private conversationId: string) {
    this.grammar = gbnfGenerator.generate(AgentProtocolSchema);
  }

  /**
   * Executes the Agent Loop with:
   * - strict protocol schema enforcement (GBNF + Zod)
   * - scoped protocol injection ([PROTOCOL_DATA] only for internal tool messages)
   * - abort support via AbortSignal
   */
  async run(
    userContent: string,
    taskId: string,
    traceId: string | null,
    signal?: AbortSignal
  ): Promise<ExecutionResult | null> {
    const startTime = Date.now();
    console.log('[TaskExecutor] start', { agentId: this.agentId, conversationId: this.conversationId, taskId });

    // 1) Fetch Agent & Provider (sync read)
    const agent = db.select().from(agents).where(eq(agents.id, this.agentId)).get();
    const modelId = (agent as any)?.modelId ?? (agent as any)?.model_id;
    const provider = modelId
      ? db.select().from(providers).where(eq(providers.id, modelId)).get()
      : null;

    if (!provider?.endpoint) {
      console.error('[TaskExecutor] provider missing/offline', { agentId: this.agentId, modelId: agent?.modelId });
      await this.writeSystemError('Provider not found or offline', taskId, traceId, 0);
      return null;
    }

    // 2) Build context (Patch 3: scoped injection)
    const historyRows = sqliteDb
      .prepare(
        `
        SELECT role, content, metadata
        FROM messages
        WHERE conversation_id = ?
        ORDER BY timestamp DESC
        LIMIT 30
      `
      )
      .all(this.conversationId) as any[];

    const formattedHistory = historyRows.reverse().map((m) => {
      let content = String(m.content ?? '');

      // Attempt to parse metadata to find hidden protocol instructions
      let meta: MessageMetadata | null = null;
      try {
        meta = typeof m.metadata === 'string' ? (JSON.parse(m.metadata) as MessageMetadata) : (m.metadata as MessageMetadata);
      } catch {
        // ignore
      }

      // PATCH 3: only inject protocol data if it's an internal tool message
      if (m.role === 'tool' && meta?.protocol) {
        content += `\n\n[PROTOCOL_DATA]: ${JSON.stringify(meta.protocol)}`;
      }

      return {
        role: normalizeRoleForLlm(String(m.role ?? 'assistant')),
        content
      };
    });

    // --- PHASE 5: RAG AUGMENTATION (Planner Only) ---
    let ragSystemInjection = '';

    if (agent?.role === 'planner') {
      const convo = sqliteDb
        .prepare('SELECT workspace_root as workspaceRoot, workspace_path as workspacePath FROM conversations WHERE id = ?')
        .get(this.conversationId) as { workspaceRoot?: string; workspacePath?: string } | undefined;

      const workspaceRoot = convo?.workspaceRoot ?? convo?.workspacePath;

      if (workspaceRoot) {
        try {
          ragSystemInjection = await buildPlannerRagInjection({
            rawDb: sqliteDb,
            conversationId: this.conversationId,
            query: userContent,
            workspaceRootAbsPath: workspaceRoot,
            topK: 10,
            maxChars: 10_000,
          });
          console.log('[TaskExecutor] planner RAG injected', { conversationId: this.conversationId });
        } catch (e) {
          console.error('[RAG] planner injection failed:', e);
        }
      }
    }

    // 3) Payload
    const systemPrompt = `${agent.systemPrompt}${ragSystemInjection}\nCRITICAL: Output valid JSON matching the schema provided.`;

    // Providers may not list models; try reasonable fallbacks
    const modelFromProvider =
      (provider as any)?.models?.[0]?.id ??
      (provider as any)?.models?.[0]?.name ??
      (provider as any)?.metadata?.defaultModel ??
      provider?.name ??
      provider?.id ??
      'phi-3';

    const supportsGrammar = (provider as any)?.metadata?.supportsGrammar === true;

    const payload: any = {
      model: modelFromProvider,
      messages: [{ role: 'system', content: systemPrompt }, ...formattedHistory, { role: 'user', content: userContent }],
      temperature: agent?.temperature ?? 0.1,
      stream: false
    };

    if (supportsGrammar) {
      payload.grammar = this.grammar;
    }

    try {
      console.log(`🧠 [Executor] Sending to ${provider.endpoint}...`);

      const res = await axios.post(`${provider.endpoint}/chat/completions`, payload, { signal });

      const rawContent = res.data?.choices?.[0]?.message?.content ?? '{}';
      const extractJson = (text: string) => {
        const trimmed = (text || '').trim();
        if (trimmed.startsWith('```')) {
          return trimmed
            .replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '')
            .replace(/```$/, '')
            .trim();
        }
        return trimmed;
      };
      const cleanedContent = extractJson(rawContent);

      // 4) Validate & parse
      let protocolData: AgentProtocol;
      try {
        const json = JSON.parse(cleanedContent);
        protocolData = AgentProtocolSchema.parse(json);
      } catch (validationError: any) {
        console.error('Protocol Violation:', { rawContent, cleanedContent, error: validationError?.message });
        // Fallback: wrap raw content as a final_answer so the task can complete
        protocolData = {
          protocolVersion: 1,
          tool: 'final_answer',
          thought: 'Fallback: provider returned non-protocol JSON',
          parameters: { content: cleanedContent || rawContent || 'No content' },
        };
      }

      // 5) Success write
      const messageId = await this.writeAgentResponse(agent, protocolData, taskId, traceId, Date.now() - startTime);
      console.log('[TaskExecutor] success', { taskId, messageId, tool: protocolData.tool });
      return { protocol: protocolData, messageId };
    } catch (e: any) {
      // Robust abort detection
      const isAborted =
        signal?.aborted ||
        e?.code === 'ERR_CANCELED' ||
        e?.name === 'CanceledError' ||
        e?.name === 'AbortError';

      if (isAborted) {
        console.warn(`[Executor] Request aborted for task ${taskId}`);
        return null; // clean exit; runner decides state transition
      }

      const msg = e?.message || 'Unknown Network Error';
      const status = e?.response?.status;
      const data = e?.response?.data;
      console.error('[Executor] request failed', { taskId, error: msg, status, data });
      await this.writeSystemError(`Execution Error: ${msg}`, taskId, traceId, Date.now() - startTime);
      return null;
    }
  }

  private async writeAgentResponse(
    agent: any,
    protocol: AgentProtocol,
    taskId: string,
    traceId: string | null,
    latency: number
  ): Promise<string> {
    const messageId = crypto.randomUUID();

    const displayContent =
      protocol.tool === 'final_answer'
        ? String((protocol as any).parameters?.content ?? 'Done.')
        : `⚙️ [${String(agent.role).toUpperCase()}] ${protocol.tool}`;

    // Visibility Control: UI agents are 'assistant', others are 'tool'
    const dbRole = agent.role === 'ui' ? 'assistant' : 'tool';

    const metadata: MessageMetadata = {
      senderType: 'agent',
      senderAgentId: agent.id,
      senderName: agent.name,
      protocol,
      taskId,
      traceId,
      modelId: agent.modelId,
      latencyMs: latency
    };

    await db.insert(messages).values({
      id: messageId,
      conversationId: this.conversationId,
      role: dbRole,
      content: displayContent,
      metadata,
      timestamp: new Date()
    });

    return messageId;
  }

  private async writeSystemError(errorMsg: string, taskId: string, traceId: string | null, latency: number) {
    const metadata: MessageMetadata = {
      senderType: 'system',
      senderAgentId: null,
      senderName: 'System',
      protocol: null,
      taskId,
      traceId,
      modelId: null,
      latencyMs: latency
    };

    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId: this.conversationId,
      role: 'system',
      content: errorMsg,
      metadata,
      timestamp: new Date()
    });
  }
}
