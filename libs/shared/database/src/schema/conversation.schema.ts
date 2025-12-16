import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import * as crypto from 'crypto';

export const conversations = sqliteTable('conversations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  title: text('title').notNull(),

  // Absolute path to the workspace / repo root for this conversation (RAG scope)
  workspacePath: text('workspace_path').default(null),
  // Preferred going forward
  workspaceRoot: text('workspace_root').default(null),

  // Agents participating in this conversation
  agentIds: text('agent_ids', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),

  // Flexible conversation metadata
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ConversationRow = typeof conversations.$inferSelect;
export type NewConversationRow = typeof conversations.$inferInsert;
