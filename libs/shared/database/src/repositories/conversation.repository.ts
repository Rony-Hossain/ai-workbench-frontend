import { randomUUID } from 'crypto';
import type {
  Conversation,
  ConversationWithMessageCount,
} from '@ai-workbench/bounded-contexts';

type ConversationRecord = Conversation & { agentIds: string[] };

const conversations = new Map<string, ConversationRecord>();

export class ConversationRepository {
  async findAll(): Promise<Conversation[]> {
    return Array.from(conversations.values());
  }

  async findRecent(limit = 50): Promise<ConversationWithMessageCount[]> {
    return Array.from(conversations.values())
      .slice(0, limit)
      .map((c) => ({ ...c, messageCount: 0 }));
  }

  async findById(id: string): Promise<Conversation | undefined> {
    return conversations.get(id);
  }

  async getStatistics(_id: string) {
    return {
      messageCount: 0,
      userMessages: 0,
      assistantMessages: 0,
      totalTokens: 0,
    };
  }

  async findByAgent(agentId: string): Promise<Conversation[]> {
    return Array.from(conversations.values()).filter((c) =>
      c.agentIds.includes(agentId)
    );
  }

  async create(input: {
    title: string;
    agentIds?: string[];
    metadata?: Record<string, any>;
  }): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: ConversationRecord = {
      id,
      title: input.title,
      agentIds: input.agentIds || [],
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };
    conversations.set(id, conversation);
    return conversation;
  }

  async exists(id: string): Promise<boolean> {
    return conversations.has(id);
  }

  async update(
    id: string,
    data: Partial<Conversation>
  ): Promise<Conversation | undefined> {
    const existing = conversations.get(id);
    if (!existing) return undefined;
    const updated: ConversationRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    conversations.set(id, updated);
    return updated;
  }

  async addAgent(conversationId: string, agentId: string) {
    const existing = conversations.get(conversationId);
    if (!existing) return undefined;
    if (!existing.agentIds.includes(agentId)) {
      existing.agentIds.push(agentId);
    }
    existing.updatedAt = new Date();
    return existing;
  }

  async removeAgent(conversationId: string, agentId: string) {
    const existing = conversations.get(conversationId);
    if (!existing) return undefined;
    existing.agentIds = existing.agentIds.filter((id) => id !== agentId);
    existing.updatedAt = new Date();
    return existing;
  }

  async delete(id: string): Promise<boolean> {
    return conversations.delete(id);
  }
}
