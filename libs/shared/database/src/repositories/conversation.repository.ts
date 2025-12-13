import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { conversations, type ConversationRow } from '../schema';
import { BaseRepository } from './base.repository';
import type { Conversation, ConversationWithMessageCount } from '@ai-workbench/bounded-contexts';

export class ConversationRepository extends BaseRepository<
  typeof conversations,
  Conversation,
  ConversationRow
> {
  constructor() {
    super(conversations);
  }

  // 1. Map DB Row -> Domain Object
  // Drizzle automatically parses 'agent_ids' from JSON string to Array because of { mode: 'json' } in schema
  protected toDomain(row: ConversationRow): Conversation {
    return {
      id: row.id,
      title: row.title,
      workspacePath: row.workspacePath ?? undefined,
      agentIds: row.agentIds ?? [], 
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // 2. Map Domain Object -> DB Row
  protected toDatabase(domain: Partial<Conversation>): Partial<ConversationRow> {
    return {
      id: domain.id,
      title: domain.title,
      workspacePath: domain.workspacePath ?? null,
      agentIds: domain.agentIds ?? [],
      metadata: domain.metadata ?? null,
    };
  }

  // 3. Specific Queries
  async findRecent(limit = 50): Promise<ConversationWithMessageCount[]> {
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);
      
    // TODO: You can add a 'leftJoin' with messages table here later to get real counts
    return rows.map(r => ({ ...this.toDomain(r), messageCount: 0 }));
  }

  async findByAgent(agentId: string): Promise<Conversation[]> {
    // SQLite doesn't have an efficient "array_contains" operator like Postgres.
    // For local desktop apps, fetching all and filtering in JS is fast enough for <10k chats.
    // Alternatively, use a LIKE query: like(conversations.agentIds, `%${agentId}%`)
    const all = await this.findAll();
    return all.filter(c => c.agentIds.includes(agentId));
  }

  async addAgent(conversationId: string, agentId: string) {
    const convo = await this.findById(conversationId);
    if (!convo) return undefined;
    
    if (!convo.agentIds.includes(agentId)) {
      const newAgents = [...convo.agentIds, agentId];
      return this.update(conversationId, { agentIds: newAgents });
    }
    return convo;
  }

  async removeAgent(conversationId: string, agentId: string) {
    const convo = await this.findById(conversationId);
    if (!convo) return undefined;
    
    const newAgents = convo.agentIds.filter(id => id !== agentId);
    return this.update(conversationId, { agentIds: newAgents });
  }
}