import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { Provider } from '@workbench/bounded-contexts';

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type', { enum: ['local', 'cloud', 'openai', 'anthropic'] }).notNull(),
  endpoint: text('endpoint'),
  apiKey: text('api_key'),
  models: text('models', { mode: 'json' }).$type<Provider['models']>().notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Infer types from schema
export type ProviderRow = typeof providers.$inferSelect;
export type NewProviderRow = typeof providers.$inferInsert;
