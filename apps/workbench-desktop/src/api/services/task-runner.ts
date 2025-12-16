import { db, rawDb } from '../database';
import { tasks, permissions, messages, agents, conversations } from '@ai-workbench/shared/database';
import { eq, lt, and, or, isNull, asc, desc, sql, inArray } from 'drizzle-orm';
import { TaskExecutor } from './task-executor';
import type { AgentTool, MessageMetadata } from '@ai-workbench/bounded-contexts';
import * as crypto from 'crypto';
import { TeiEmbeddingClient, SqliteRagStore, RagRetriever, buildRagContext } from '@ai-workbench/rag-core';

// Strict Authority Matrix (Phase 4)
const ALLOWED_TOOLS: Record<string, AgentTool[]> = {
  ui: ['final_answer', 'noop'],
  planner: ['request_permission', 'noop'],
  executor: ['run_command', 'write_file', 'noop']
};

// Strict Metadata Helper
const createSystemMeta = (taskId: string | null, traceId: string | null): MessageMetadata => ({
  senderType: 'system',
  senderAgentId: null,
  senderName: 'System',
  protocol: null,
  taskId,
  traceId,
  modelId: null,
  latencyMs: null
});

export class TaskRunner {
  private static instance: TaskRunner;
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;

  private readonly runnerId = crypto.randomUUID();
  private readonly CONCURRENCY = 2;
  private readonly DEFAULT_LEASE_MS = 30000;

  private constructor() {}
  /**
   * Normalize raw DB rows (snake_case) to the camelCase Drizzle shape.
   */
  private normalizeTaskRow(row: any): typeof tasks.$inferSelect {
    if (!row) return row;
    return {
      ...row,
      projectId: row.projectId ?? row.project_id ?? null,
      conversationId: row.conversationId ?? row.conversation_id ?? null,
      agentId: row.agentId ?? row.agent_id ?? null,
      triggerMessageId: row.triggerMessageId ?? row.trigger_message_id ?? null,
      maxAttempts: row.maxAttempts ?? row.max_attempts ?? 2,
      runAfter: row.runAfter ?? row.run_after ?? null,
      startedAt: row.startedAt ?? row.started_at ?? null,
      finishedAt: row.finishedAt ?? row.finished_at ?? null,
      lastError: row.lastError ?? row.last_error ?? null,
      traceId: row.traceId ?? row.trace_id ?? null,
      lockedBy: row.lockedBy ?? row.locked_by ?? null,
      lockedAt: row.lockedAt ?? row.locked_at ?? null,
      lockExpiresAt: row.lockExpiresAt ?? row.lock_expires_at ?? null,
      leaseMs: row.leaseMs ?? row.lease_ms ?? this.DEFAULT_LEASE_MS,
      createdAt: row.createdAt ?? row.created_at ?? new Date(),
      updatedAt: row.updatedAt ?? row.updated_at ?? new Date()
    } as typeof tasks.$inferSelect;
  }

  static getInstance() {
    if (!TaskRunner.instance) TaskRunner.instance = new TaskRunner();
    return TaskRunner.instance;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[TaskRunner] Started (ID: ${this.runnerId})`);
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
  }

  private async loop() {
    if (!this.isRunning) return;
    try {
      await this.processTick();
    } catch (error) {
      console.error('[TaskRunner] Tick Error:', error);
    }
    if (this.isRunning) {
      this.timer = setTimeout(() => this.loop(), 500);
    }
  }

  /**
   * Atomic claim & execute
   * Patch 2 FINAL: lock_expires_at is computed in the same UPDATE using lease_ms (single write).
   */
  private async processTick() {
    console.log('🔵 [TaskRunner] processTick called');
    const nowMs = Date.now();
    let claimedTasks: typeof tasks.$inferSelect[] = [];

    try {
      const runTx = rawDb.transaction(() => {
        console.log('🔵 [TaskRunner] Polling for tasks...');
        const candidates = rawDb
          .prepare(
            `
          SELECT id, lease_ms
          FROM tasks
          WHERE (status = 'pending' OR (status = 'running' AND lock_expires_at < ?))
            AND (run_after IS NULL OR run_after < ?)
          ORDER BY priority DESC, created_at ASC
          LIMIT ?
        `
          )
          .all(nowMs, nowMs, this.CONCURRENCY) as Array<{ id: string; lease_ms: number | null }>;

        console.log(`🔵 [TaskRunner] Raw candidates from query:`, candidates);
        console.log(`🔵 [TaskRunner] Found ${candidates.length} candidate tasks.`);

        if (candidates.length === 0) return [];

        const candidateIds = candidates.map((c) => c.id);
        const placeholders = candidateIds.map(() => '?').join(', ');

        const updateStmt = rawDb.prepare(
          `
        UPDATE tasks
        SET
          status = 'running',
          locked_by = ?,
          locked_at = ?,
          lock_expires_at = (? + coalesce(lease_ms, ?)),
          started_at = coalesce(started_at, ?),
          attempt = attempt + 1,
          updated_at = ?
        WHERE id IN (${placeholders})
          AND (status = 'pending' OR (status = 'running' AND lock_expires_at < ?))
          AND (run_after IS NULL OR run_after < ?)
        RETURNING *
      `
        );

        const result = updateStmt.all(
          this.runnerId,
          nowMs,
          nowMs,
          this.DEFAULT_LEASE_MS,
          nowMs,
          nowMs,
          ...candidateIds,
          nowMs,
          nowMs
        ) as typeof tasks.$inferSelect[];

        console.log('[TaskRunner] Claimed', result.map((r) => r.id));
        return result;
      });

      claimedTasks = runTx() as typeof tasks.$inferSelect[];
      claimedTasks = claimedTasks.map((t) => this.normalizeTaskRow(t));
    } catch (e: any) {
      console.error('🔴🔴 [TaskRunner] TRANSACTION FAILED:', e?.message ?? e);
      claimedTasks = [];
    }

    console.log(`🔵 [TaskRunner] Claimed ${claimedTasks.length} tasks this tick.`);

    if (claimedTasks.length === 0) return;

    await Promise.all(claimedTasks.map((task) => this.executeTask(task)));
  }

  private async executeTask(task: typeof tasks.$inferSelect) {
    const controller = new AbortController();
    const leaseTime = task.leaseMs ?? this.DEFAULT_LEASE_MS;

    // Heartbeat
    const interval = Math.max(5000, Math.min(15000, Math.floor(leaseTime / 2)));
    const heartbeat = setInterval(() => this.renewLease(task.id, leaseTime, controller), interval);

    try {
      console.log('[TaskRunner] Executing task', task.id, 'agent', task.agentId, 'conversation', task.conversationId);
      const triggerMsg = db.select().from(messages).where(eq(messages.id, task.triggerMessageId)).get();
      const agent = db.select().from(agents).where(eq(agents.id, task.agentId)).get();

      if (!triggerMsg || !agent) throw new Error('Invalid task context');

      // RAG Integration
      const embedder = new TeiEmbeddingClient('http://10.0.0.110:8092');
      // Use the raw better-sqlite handle for the RAG store so `prepare` is available
      const store = new SqliteRagStore(rawDb);
      const retriever = new RagRetriever(embedder, store);

      const results = await retriever.retrieve({
        query: triggerMsg.content,
        scope: { conversationId: task.conversationId },
        k: 8
      });

      const rag = buildRagContext(results, 12000);
      const plannerInput = `${rag.contextText}\n\nTASK:\n${triggerMsg.content}`;

      const executor = new TaskExecutor(task.agentId, task.conversationId);

      const result = await executor.run(plannerInput, task.id, task.traceId, controller.signal);

      if (!result) {
        if (controller.signal.aborted) {
          console.warn(`[TaskRunner] Task ${task.id} aborted (lease lost).`);
          await this.handleFailure(task, 'Execution aborted due to lease loss');
          return;
        }
        throw new Error('No protocol output');
      }

      const { protocol, messageId } = result;

      this.assertAuthority(agent.role as string, protocol.tool);

      if (protocol.tool === 'final_answer' || protocol.tool === 'noop') {
        await this.completeTask(task.id);
        return;
      }

      if (protocol.tool === 'request_permission') {
        if (agent.role !== 'planner') {
          throw new Error('AUTHORITY VIOLATION: Non-planner used request_permission.');
        }
        await this.handlePlannerDelegation(task, protocol.parameters, messageId);
        return;
      }

      // Executor action: run_command / write_file => permission request
      await this.createPermissionRequest(task, protocol.tool, protocol.parameters);
    } catch (error: any) {
      if (controller.signal.aborted) {
        await this.handleFailure(task, 'Execution aborted due to lease loss');
        return;
      }
      console.error(`[TaskRunner] Task ${task.id} Failed:`, error?.message ?? error);
      await this.handleFailure(task, error?.message ?? 'Unknown error');
    } finally {
      clearInterval(heartbeat);
    }
  }

  /**
   * Patch 1 FINAL:
   * Cleanup is allowed if:
   * - we own it, OR
   * - it is free (lockedBy is NULL), OR
   * - the lock is expired
   *
   * Plus a status guard to avoid clobbering a valid lock held by another runner.
   */
  private getCleanupWhere(taskId: string) {
    const now = new Date();
    return and(
      eq(tasks.id, taskId),
      // only touch tasks that are in states we are allowed to transition out of
      sql`status IN ('running', 'blocked', 'pending')`,
      or(isNull(tasks.lockedBy), eq(tasks.lockedBy, this.runnerId), lt(tasks.lockExpiresAt, now))
    );
  }

  private async completeTask(taskId: string) {
    await db
      .update(tasks)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        updatedAt: new Date()
      })
      .where(this.getCleanupWhere(taskId));
  }

  private async blockTask(taskId: string) {
    await db
      .update(tasks)
      .set({
        status: 'blocked',
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        updatedAt: new Date()
      })
      .where(this.getCleanupWhere(taskId));
  }

  private async handleFailure(task: typeof tasks.$inferSelect, errorMsg: string) {
    const isRetryable = task.attempt < task.maxAttempts;

    if (isRetryable) {
      const backoff = Math.pow(2, task.attempt) * 1000;

      await db
        .update(tasks)
        .set({
          status: 'pending',
          runAfter: new Date(Date.now() + backoff),
          lastError: errorMsg,
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
          updatedAt: new Date()
        })
        .where(this.getCleanupWhere(task.id));
    } else {
      await db
        .update(tasks)
        .set({
          status: 'failed',
          lastError: errorMsg,
          finishedAt: new Date(),
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
          updatedAt: new Date()
        })
        .where(this.getCleanupWhere(task.id));
    }
  }

  private async renewLease(taskId: string, leaseMs: number, controller: AbortController) {
    try {
      const now = new Date();
      const nowMs = now.getTime();

      const res = await db
        .update(tasks)
        .set({
          lockExpiresAt: sql`(${nowMs} + ${leaseMs})`,
          updatedAt: now,
          lockedAt: now
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.lockedBy, this.runnerId), eq(tasks.status, 'running')))
        .run();

      if (res.changes === 0) {
        console.warn(`[TaskRunner] Lost ownership of ${taskId} - ABORTING`);
        controller.abort();
      }
    } catch {
      controller.abort();
    }
  }

  private assertAuthority(role: string, tool: AgentTool) {
    const allowed = ALLOWED_TOOLS[role] || [];
    if (!allowed.includes(tool)) {
      throw new Error(`AUTHORITY VIOLATION: role='${role}' cannot use tool='${tool}'`);
    }
  }

  private async handlePlannerDelegation(task: typeof tasks.$inferSelect, _params: any, triggerMsgId: string) {
    const conversationId = task.conversationId;

    const convo = db.select({ agentIds: conversations.agentIds }).from(conversations).where(eq(conversations.id, conversationId)).get();
    const memberIds = (convo?.agentIds ?? []) as string[];

    const executors = await db.query.agents.findMany({
        where: and(
            eq(agents.role, 'executor'),
        )
    });
    const execAgent = executors.find(e => memberIds.includes(e.id));

    if (!execAgent) throw new Error('DELEGATION FAILED: No Executor found in conversation.');

    await db.insert(tasks).values({
      id: crypto.randomUUID(),
      conversationId,
      agentId: execAgent.id,
      triggerMessageId,
      status: 'pending',
      priority: 5,
      leaseMs: 30000,
      traceId: task.traceId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.completeTask(task.id);
  }

  private async createPermissionRequest(task: typeof tasks.$inferSelect, tool: string, params: any) {
    let permType: 'run_command' | 'write_file' | null = null;

    if (tool === 'run_command') permType = 'run_command';
    if (tool === 'write_file') permType = 'write_file';

    if (!permType) {
      await this.completeTask(task.id);
      return;
    }

    await db.insert(permissions).values({
      id: crypto.randomUUID(),
      taskId: task.id,
      conversationId: task.conversationId,
      agentId: task.agentId,
      status: 'pending',
      permissionType: permType,
      request: {
        command: params?.command ?? null,
        path: params?.path ?? null,
        content: params?.content ?? null,
        reason: params?.reason ?? null
      },
      createdAt: new Date()
    });

    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId: task.conversationId,
      role: 'system',
      content: `⚠️ Permission requested: ${permType}`,
      metadata: createSystemMeta(task.id, task.traceId),
      timestamp: new Date()
    });

    await this.blockTask(task.id);
  }

  // Called when Permission is Approved or Executor Completes
  public async finalizeExecutorAction(task: typeof tasks.$inferSelect) {
    await this.completeTask(task.id);
    await this.spawnUiTask(task.conversationId, task.traceId);
  }

  private async spawnUiTask(conversationId: string, traceId: string | null) {
    const convo = db.select({ agentIds: conversations.agentIds }).from(conversations).where(eq(conversations.id, conversationId)).get();
    const memberIds = (convo?.agentIds ?? []) as string[];

    const uiAgents = await db.query.agents.findMany({
        where: and(
            eq(agents.role, 'ui'),
        )
    });
    
    const uiAgent = uiAgents.find(a => memberIds.includes(a.id));

    if (!uiAgent) return;

    // Contextual Trigger
    const content = `ACTION REPORT: Tasks for traceId=${traceId} have completed. 
    Review the conversation history for messages with this traceId.
    Summarize the outcome to the user concisely.`;

    const sysMsgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: sysMsgId,
      conversationId,
      role: 'system',
      content,
      metadata: createSystemMeta(null, traceId),
      timestamp: new Date()
    });

    await db.insert(tasks).values({
      id: crypto.randomUUID(),
      conversationId,
      agentId: uiAgent.id,
      triggerMessageId: sysMsgId,
      status: 'pending',
      priority: 2,
      leaseMs: 30000,
      traceId: traceId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
