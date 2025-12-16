import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { agents } from './agent.schema';
import { conversations } from './conversation.schema'; // NEW IMPORT
import { messages } from './message.schema';     // NEW IMPORT
import * as crypto from 'crypto';                  // NEW IMPORT

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: text('status', {
    enum: ['planning', 'in_progress', 'review', 'completed', 'archived']
  }).notNull().default('planning'),
  repositoryPath: text('repository_path'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const projectAgents = sqliteTable('project_agents', {
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['lead', 'contributor', 'reviewer'] }).notNull().default('contributor'),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  hoursWorked: real('hours_worked').notNull().default(0),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
}, (table) => ({
  pk: primaryKey({ columns: [table.projectId, table.agentId] }),
}));

// MERGED TASKS TABLE DEFINITION
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

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

  leaseMs: integer('lease_ms').notNull().default(30000),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  idxStatusRunAfter: index('idx_tasks_status_run_after').on(table.status, table.runAfter),
  idxConversation: index('idx_tasks_conversation').on(table.conversationId, table.createdAt),
  idxAgentStatus: index('idx_tasks_agent_status').on(table.agentId, table.status),
  idxLockExpires: index('idx_tasks_lock_expires').on(table.lockExpiresAt),
}));

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type ProjectAgentRow = typeof projectAgents.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect; // MERGED
export type NewTaskRow = typeof tasks.$inferInsert; // MERGEDexport type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
