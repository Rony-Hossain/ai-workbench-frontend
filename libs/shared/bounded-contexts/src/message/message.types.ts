import { BaseEntity } from '../common/base.types';
import { MessageRole } from '../common/enums';

export interface Message extends BaseEntity {
  conversationId: string;
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  parentMessageId?: string;
  tokens?: number;
  timestamp: Date;
}

export interface MessageWithConversation extends Message {
  conversation: {
    id: string;
    title: string;
  };
}
