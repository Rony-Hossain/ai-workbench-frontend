import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { AIModel, ProviderStatus, ProviderType } from '@ai-workbench/bounded-contexts';

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  label: text('label'),
  type: text('type').$type<ProviderType>().notNull(),
  endpoint: text('endpoint'),
  apiKey: text('api_key'),
  models: text('models', { mode: 'json' }).$type<AIModel[]>().notNull().default([]),
  workspaceScope: text('workspace_scope', { mode: 'json' }).$type<'global' | string[]>().notNull().default('global'),
  status: text('status').$type<ProviderStatus>().default('offline'),
  lastChecked: integer('last_checked', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type ProviderRow = typeof providers.$inferSelect;
