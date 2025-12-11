import type { ChatMessage } from '@ai-workbench/bounded-contexts';

type Conversation = {
  id: string;
  workspacePath: string;
  title: string;
  messages: ChatMessage[];
};

/**
 * Lightweight in-memory chat DB shim to unblock UI flows until a real DB is wired.
 */
class InMemoryChatDb {
  private conversations = new Map<string, Conversation>();

  async listByWorkspace(workspacePath: string) {
    return Array.from(this.conversations.values()).filter(
      (c) => c.workspacePath === workspacePath
    );
  }

  async create(workspacePath: string, title: string) {
    const id = crypto.randomUUID();
    this.conversations.set(id, {
      id,
      workspacePath,
      title,
      messages: [],
    });
    return id;
  }

  async get(id: string) {
    return this.conversations.get(id);
  }

  async listMessages(id: string, limit = 10) {
    const convo = this.conversations.get(id);
    if (!convo) return [];
    if (limit <= 0) return [...convo.messages];
    return convo.messages.slice(-limit);
  }

  async addMessage(id: string, msg: ChatMessage) {
    const convo = this.conversations.get(id);
    if (!convo) return;
    convo.messages.push(msg);
  }
}

type WorkspaceRecord = { id: string; name: string; path: string };

class InMemoryWorkspaceDb {
  private workspaces = new Map<string, WorkspaceRecord>();

  async getRecents(limit: number) {
    return Array.from(this.workspaces.values()).slice(0, limit);
  }

  async upsert(record: WorkspaceRecord) {
    this.workspaces.set(record.id, record);
  }
}

export const chatDb = new InMemoryChatDb();
export const workspaceDb = new InMemoryWorkspaceDb();
