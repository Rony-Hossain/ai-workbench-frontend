import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { conversations } from './conversation.schema';
import type { MessageMetadata } from '@ai-workbench/bounded-contexts';
import * as crypto from 'crypto';

// The "Safe" Default that satisfies the strict type completely
const createDefaultMetadata = (): MessageMetadata => ({
  // Identity
  senderType: 'system',
  senderAgentId: null,
  senderName: 'System',
  
  // Protocol
  protocol: null,
  
  // Telemetry
  taskId: null,
  traceId: null,
  modelId: null,
  latencyMs: null // Correct: Unknown, not zero
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  
  role: text('role', { enum: ['user', 'assistant', 'system', 'tool'] }).notNull(),
  content: text('content').notNull(),
  
  // STRICT JSON STRUCTURE
  // Using $defaultFn prevents shared reference issues and serialization edge cases
  metadata: text('metadata', { mode: 'json' })
    .$type<MessageMetadata>()
    .notNull()
    .$defaultFn(createDefaultMetadata),
  
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  idxConversation: index('idx_messages_conversation').on(table.conversationId),
}));