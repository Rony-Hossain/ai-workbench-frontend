import { db, DbConversation } from '../db.config';
import { ChatMessage } from '@ai-workbench/bounded-contexts';

export const chatDb = {
  // Create new thread
  create: async (workspaceId: string, title: string) => {
    const id = `conv-${Date.now()}`;
    await db.conversations.add({
      id,
      workspaceId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    });
    return id;
  },

  // List threads for a workspace
  listByWorkspace: async (workspaceId: string) => {
    return await db.conversations
      .where('workspaceId')
      .equals(workspaceId)
      .reverse()
      .sortBy('updatedAt');
  },

  // Save a message to a thread
  addMessage: async (conversationId: string, message: ChatMessage) => {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const updatedMessages = [...conversation.messages, message];
    
    await db.conversations.update(conversationId, {
      messages: updatedMessages,
      updatedAt: Date.now()
    });
  },
  
  get: async (conversationId: string) => {
    return await db.conversations.get(conversationId);
  }
};