import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { providers } from './provider.schema';
import * as crypto from 'crypto';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  
  // STRICT AUTHORITY TRIAD
  role: text('role', { enum: ['planner', 'executor', 'ui'] })
    .notNull()
    .default('executor'),

  modelId: text('model_id').notNull().references(() => providers.id, { onDelete: 'restrict' }),
  systemPrompt: text('system_prompt').notNull(),
  temperature: real('temperature').notNull().default(0.7),
  
  // FIX: Breakpoint 1 - Correct JSON array default
  tools: text('tools', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
    
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});