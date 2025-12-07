import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  endpoint: text('endpoint'),
  apiKey: text('api_key'),
  models: text('models').default('[]'),
  status: text('status').default('offline'),
  createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`),
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  modelId: text('model_id').references(() => providers.id),
  systemPrompt: text('system_prompt'),
  temperature: integer('temperature'),
  createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title'),
  workspacePath: text('workspace_path'),
  updatedAt: integer('updated_at').default(sql`(strftime('%s', 'now'))`),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp').default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  idxConv: index('idx_messages_conversation').on(table.conversationId),
}));

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull(),
  agentId: text('agent_id'),
  type: text('type').notNull(),
  operation: text('operation').notNull(),
  details: text('details').notNull(),
  status: text('status').default('pending'),
  decidedAt: integer('decided_at'),
  createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`),
});
