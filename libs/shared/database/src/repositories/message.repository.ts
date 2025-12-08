import { randomUUID } from 'crypto';
import type {
  Message,
  MessageWithConversation,
} from '@ai-workbench/bounded-contexts';

type MessageRecord = Message & { conversationTitle?: string };
const messages = new Map<string, MessageRecord>();

export class MessageRepository {
  async findByConversation(
    conversationId: string,
    opts: { limit?: number; offset?: number; beforeTimestamp?: Date }
  ) {
    const limit = opts.limit ?? 100;
    const offset = opts.offset ?? 0;
    const filtered = Array.from(messages.values()).filter(
      (m) =>
        m.conversationId === conversationId &&
        (!opts.beforeTimestamp || m.timestamp < opts.beforeTimestamp)
    );
    return filtered.slice(offset, offset + limit);
  }

  async countByConversation(conversationId: string) {
    return Array.from(messages.values()).filter(
      (m) => m.conversationId === conversationId
    ).length;
  }

  async findById(id: string) {
    return messages.get(id);
  }

  async findWithConversation(id: string): Promise<MessageWithConversation | undefined> {
    const msg = messages.get(id);
    if (!msg) return undefined;
    return {
      ...msg,
      conversation: {
        id: msg.conversationId,
        title: msg.conversationTitle || 'Conversation',
      },
    };
  }

  async findRecent(limit = 50) {
    return Array.from(messages.values()).slice(0, limit);
  }

  async search(query: string, opts: { conversationId?: string; limit?: number }) {
    const limit = opts.limit ?? 20;
    return Array.from(messages.values())
      .filter((m) => {
        const inConversation = opts.conversationId
          ? m.conversationId === opts.conversationId
          : true;
        return inConversation && m.content.toLowerCase().includes(query.toLowerCase());
      })
      .slice(0, limit);
  }

  async findByRole(conversationId: string, role: Message['role']) {
    return Array.from(messages.values()).filter(
      (m) => m.conversationId === conversationId && m.role === role
    );
  }

  async create(input: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const record: MessageRecord = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    messages.set(record.id, record);
    return record;
  }

  async exists(id: string) {
    return messages.has(id);
  }

  async delete(id: string) {
    return messages.delete(id);
  }

  async deleteByConversation(conversationId: string) {
    let count = 0;
    for (const [id, msg] of messages.entries()) {
      if (msg.conversationId === conversationId) {
        messages.delete(id);
        count++;
      }
    }
    return count;
  }
}
