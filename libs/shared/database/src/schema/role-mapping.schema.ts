import { sqliteTable, text, primaryKey, integer } from 'drizzle-orm/sqlite-core';
import { providers } from './provider.schema';

export const roleMappings = sqliteTable(
  'role_mappings',
  {
    workspaceId: text('workspace_id').notNull(),
    role: text('role').notNull(),
    providerId: text('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    modelId: text('model_id').notNull(),
    fallbackModelId: text('fallback_model_id'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.role] }),
  }),
);

export type RoleMappingRow = typeof roleMappings.$inferSelect;
