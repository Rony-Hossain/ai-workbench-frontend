import { db } from '../database';
import { tasks, permissions, messages, agents, conversations } from '@ai-workbench/shared/database';
import { eq, lt, and, or, isNull, asc, desc, inArray, sql } from 'drizzle-orm';
import { TaskExecutor } from './task-executor';
import type { AgentTool, MessageMetadata } from '@ai-workbench/bounded-contexts';
import * as crypto from 'crypto';

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
    const now = new Date();
    const nowMs = now.getTime();

    const claimedTasks = await db.transaction(async (tx) => {
      // 1) Candidates: pending OR reclaim expired running
      const candidates = tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            or(eq(tasks.status, 'pending'), and(eq(tasks.status, 'running'), lt(tasks.lockExpiresAt, now))),
            or(isNull(tasks.runAfter), lt(tasks.runAfter, now))
          )
        )
        .orderBy(desc(tasks.priority), asc(tasks.createdAt))
        .limit(this.CONCURRENCY)
        .all();

      if (candidates.length === 0) return [];

      // 2) Atomic claim
      // NOTE: lockExpiresAt uses row's leaseMs; if leaseMs is missing for any reason, fallback to DEFAULT_LEASE_MS.
      return tx
        .update(tasks)
        .set({
          status: 'running',
          lockedBy: this.runnerId,
          lockedAt: now,
          // SINGLE WRITE EXPIRY COMPUTATION (ms epoch)
          lockExpiresAt: sql`(${nowMs} + coalesce(${tasks.leaseMs}, ${this.DEFAULT_LEASE_MS}))`,
          startedAt: sql`coalesce(started_at, ${now})`,
          attempt: sql`attempt + 1`,
          updatedAt: now
        })
        .where(
          and(
            inArray(
              tasks.id,
              candidates.map((c) => c.id)
            ),
            // Re-verify eligibility inside write lock
            or(eq(tasks.status, 'pending'), and(eq(tasks.status, 'running'), lt(tasks.lockExpiresAt, now))),
            or(isNull(tasks.runAfter), lt(tasks.runAfter, now))
          )
        )
        .returning()
        .all();
    });

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
      const triggerMsg = db.select().from(messages).where(eq(messages.id, task.triggerMessageId)).get();
      const agent = db.select().from(agents).where(eq(agents.id, task.agentId)).get();

      if (!triggerMsg || !agent) throw new Error('Invalid task context');

      const executor = new TaskExecutor(task.agentId, task.conversationId);

      const result = await executor.run(triggerMsg.content, task.id, task.traceId, controller.signal);

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
      inArray(tasks.status, ['running', 'blocked', 'pending'] as any),
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

    const execAgent = db
      .select()
      .from(agents)
      .where(and(eq(agents.role, 'executor'), inArray(agents.id, memberIds)))
      .get();

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

    const uiAgent = db
      .select()
      .from(agents)
      .where(and(eq(agents.role, 'ui'), inArray(agents.id, memberIds)))
      .get();

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