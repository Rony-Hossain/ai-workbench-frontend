import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { providers } from './provider.schema';
import type { Agent } from '@workbench/bounded-contexts';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  role: text('role', { 
    enum: ['planner', 'coder', 'reviewer', 'tester', 'researcher', 'coordinator'] 
  }).notNull(),
  modelId: text('model_id').notNull().references(() => providers.id, { onDelete: 'restrict' }),
  systemPrompt: text('system_prompt').notNull(),
  temperature: real('temperature').notNull().default(0.7),
  maxTokens: integer('max_tokens'),
  tools: text('tools', { mode: 'json' }).$type<string[]>().notNull().default([]),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type AgentRow = typeof agents.$inferSelect;
export type NewAgentRow = typeof agents.$inferInsert;
