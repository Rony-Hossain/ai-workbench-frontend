import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { tasks } from './project.schema';
import { conversations } from './conversation.schema';
import { agents } from './agent.schema';
import * as crypto from 'crypto'; // FIX: A1 Import crypto

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
    
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
    
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),

  status: text('status', { enum: ['pending', 'approved', 'denied', 'expired'] })
    .notNull()
    .default('pending'),

  permissionType: text('permission_type', { enum: ['run_command', 'write_file', 'file_read'] })
    .notNull(),

  // FIX: D - Structurally Rigid Request
  // All fields present, null if unused. Includes 'content'.
  request: text('request', { mode: 'json' })
    .$type<{
      command: string | null;
      path: string | null;
      content: string | null;
      reason: string | null;
    }>()
    .notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolvedBy: text('resolved_by'),
  decisionReason: text('decision_reason'),
}, (table) => ({
  idxStatusCreated: index('idx_permissions_status_created').on(table.status, table.createdAt),
  idxConversation: index('idx_permissions_conversation').on(table.conversationId, table.status),
  idxTask: index('idx_permissions_task').on(table.taskId),
}));