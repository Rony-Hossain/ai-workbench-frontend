import { BaseEntity } from '../common/base.types';

export interface Conversation extends BaseEntity {
  title: string;
  agentIds: string[];
  workspacePath?: string;
  workspaceRoot?: string;
  metadata?: Record<string, any>;
}

export interface ConversationWithMessageCount extends Conversation {
  messageCount: number;
  lastMessageAt?: Date;
}
