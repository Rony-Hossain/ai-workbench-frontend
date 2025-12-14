import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { conversations } from './conversation.schema';
import { agents } from './agent.schema';
import { messages } from './message.schema';
import * as crypto from 'crypto';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
    
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
    
  triggerMessageId: text('trigger_message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),

  status: text('status', { enum: ['pending', 'running', 'blocked', 'completed', 'failed', 'canceled'] })
    .notNull()
    .default('pending'),

  priority: integer('priority').notNull().default(0),
  attempt: integer('attempt').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(2),
  
  runAfter: integer('run_after', { mode: 'timestamp' }),
  
  startedAt: integer('started_at', { mode: 'timestamp' }),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  
  lastError: text('last_error'),
  traceId: text('trace_id'),
  
  lockedBy: text('locked_by'),
  lockedAt: integer('locked_at', { mode: 'timestamp' }),
  lockExpiresAt: integer('lock_expires_at', { mode: 'timestamp' }),
  
  // FIX: Added missing column definition to match migration
  leaseMs: integer('lease_ms').notNull().default(30000),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  idxStatusRunAfter: index('idx_tasks_status_run_after').on(table.status, table.runAfter),
  idxConversation: index('idx_tasks_conversation').on(table.conversationId, table.createdAt),
  idxAgentStatus: index('idx_tasks_agent_status').on(table.agentId, table.status),
  idxLockExpires: index('idx_tasks_lock_expires').on(table.lockExpiresAt),
}));
