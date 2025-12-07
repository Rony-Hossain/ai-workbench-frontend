import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { agents } from './agent.schema';

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

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status', { 
    enum: ['todo', 'in_progress', 'blocked', 'done'] 
  }).notNull().default('todo'),
  priority: text('priority', { 
    enum: ['low', 'medium', 'high', 'urgent'] 
  }).notNull().default('medium'),
  assignedToAgentId: text('assigned_to_agent_id').references(() => agents.id, { onDelete: 'set null' }),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type ProjectAgentRow = typeof projectAgents.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
