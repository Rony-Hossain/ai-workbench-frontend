import { eq, and, lt, desc, count } from 'drizzle-orm';
import { db } from '../client';
import { messages, conversations, type MessageRow } from '../schema';
import { BaseRepository } from './base.repository';
import type { Message, MessageWithConversation } from '@ai-workbench/bounded-contexts';

export class MessageRepository extends BaseRepository<
  typeof messages,
  Message,
  MessageRow
> {
  constructor() {
    super(messages);
  }

  protected toDomain(row: MessageRow): Message {
    return {
      id: row.id,
      conversationId: row.conversationId,
      role: row.role as Message['role'], // Type cast safe due to schema enum enforcement (if used)
      content: row.content,
      metadata: row.metadata ?? undefined,
      timestamp: row.timestamp,
    };
  }

  protected toDatabase(domain: Partial<Message>): Partial<MessageRow> {
    return {
      id: domain.id,
      conversationId: domain.conversationId,
      role: domain.role,
      content: domain.content,
      metadata: domain.metadata ?? null,
      timestamp: domain.timestamp,
    };
  }

  async findByConversation(
    conversationId: string,
    opts: { limit?: number; offset?: number; beforeTimestamp?: Date }
  ) {
    const limit = opts.limit ?? 100;
    const offset = opts.offset ?? 0;

    let query = db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.timestamp)) // Get newest first
      .limit(limit)
      .offset(offset);

    if (opts.beforeTimestamp) {
      // Pagination: Get messages older than X
      // @ts-ignore - dynamic chaining
      query = query.where(and(
        eq(messages.conversationId, conversationId),
        lt(messages.timestamp, opts.beforeTimestamp)
      ));
    }

    const rows = await query;
    // Reverse to return [Oldest, ..., Newest] for the UI
    return rows.reverse().map(r => this.toDomain(r));
  }

  async countByConversation(conversationId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
    return result.count;
  }

  async deleteByConversation(conversationId: string) {
    const result = await db
      .delete(messages)
      .where(eq(messages.conversationId, conversationId));
    return result.changes;
  }
}