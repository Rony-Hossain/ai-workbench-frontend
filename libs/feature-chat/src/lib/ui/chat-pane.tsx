import React, { useEffect, useState } from 'react';
import { trpc } from '@ai-workbench/shared/client-api';
import { WorkspaceChatWithPermissions } from './workspace-chat-with-permissions';
import type { Agent, User, Message, ConversationHistoryItem } from './types';

export const ChatPane: React.FC = () => {
  // Removed Zustand dependency. 
  // We use local state for the active conversation ID.
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const utils = trpc.useContext();

  // --- 1. DATA FETCHING ---
  
  // A. Agents from DB
  const { data: dbAgents } = trpc.agent.list.useQuery();
  
  // B. Conversations from DB (For Sidebar)
  const { data: conversations } = trpc.conversation.list.useQuery();
  
  // C. Messages for Active Chat
  const { data: dbMessages, isLoading: isChatLoading } = trpc.chat.history.useQuery(
    { conversationId: activeConversationId || '' },
    { 
      enabled: !!activeConversationId,
      refetchInterval: 1500 // Poll for new messages every 1.5s
    }
  );

  // --- 2. MUTATIONS ---

  const createConvMutation = trpc.chat.createConversation.useMutation({
    onSuccess: () => utils.conversation.list.invalidate()
  });
  
  const sendMutation = trpc.chat.send.useMutation({
    onMutate: (variables) => {
      console.log("🔄 [MUTATION] Starting...", variables);
    },
    onSuccess: () => {
      console.log("✅ [MUTATION] Success!");
      utils.chat.history.invalidate();
    },
    onError: (error) => {
      console.error("🔥 [MUTATION] Failed:", error);
    }
  });
  // --- 3. AUTO-INIT LOGIC ---
  useEffect(() => {
    if (!activeConversationId && conversations) {
      if (conversations.length > 0) {
        // Select most recent
        setActiveConversationId(conversations[0].id);
      } else {
        // Create default if empty
        createConvMutation.mutateAsync({ title: 'General Operations' }).then((res) => {
          setActiveConversationId(res.id);
        });
      }
    }
  }, [conversations, activeConversationId]);

  // --- 4. DATA MAPPING (DB -> UI) ---

  const users: User[] = [{ id: 'user-1', name: 'Commander', avatar: '' }];
  
  const agents: Agent[] = (dbAgents || []).map(a => ({
    id: a.id,
    name: a.name,
    model: a.role, 
    status: a.isActive ? 'online' : 'offline',
    avatar: '',
  }));

  const messages: Message[] = (dbMessages || []).map(m => ({
    id: m.id,
    type: m.role === 'user' ? 'human' : 'agent',
    senderId: m.role === 'user' ? 'user-1' : 'system',
    senderName: m.role === 'user' ? 'Commander' : 'AI Agent',
    // Basic mapping - in a real app, you'd parse metadata for specific agent names
    content: m.content,
    timestamp: new Date(m.timestamp),
    status: 'sent',
  }));

  const conversationHistory: ConversationHistoryItem[] = (conversations || []).map(c => ({
    id: c.id,
    title: c.title,
    lastMessage: 'View conversation', // Drizzle query doesn't fetch this yet, placeholder is fine
    timestamp: new Date(c.updatedAt),
    messageCount: 0,
    isActive: c.id === activeConversationId,
    participants: []
  }));

  // --- 5. HANDLERS ---

  // --- DEBUG HANDLER ---
  const handleSendMessage = async (content: string, targetAgent: string, attachments: any[]) => {
    console.log("📡 [PANE] handleSendMessage received:", content);
    
    if (!activeConversationId) {
      console.error("❌ [PANE] No Active Conversation ID!");
      return;
    }

    try {
      console.log("🚀 [PANE] Triggering Mutation...");
      await sendMutation.mutateAsync({
        conversationId: activeConversationId,
        content,
        targetAgentId: targetAgent === 'all' ? undefined : targetAgent
      });
    } catch (e) {
      console.error("💥 [PANE] Crash in handleSendMessage:", e);
    }
  };

  // ... (keep render)


  if (!activeConversationId) return <div className="h-full flex items-center justify-center text-neutral-500 text-xs">Initializing Comms Link...</div>;

  return (
    <WorkspaceChatWithPermissions
      workspaceName="Main Operations"
      users={users}
      agents={agents}
      messages={messages} // Passing REAL DB messages
      conversationHistory={conversationHistory} // Passing REAL DB conversations
      permissionHistory={[]} // Placeholder until permission router exists
      agentHistory={[]} // Placeholder
      
      // Feature Flags
      showHistoryPanel={false}
      showConversationPanel={true}
      showAgentPanel={false}
      
      // Events
      onSendMessage={handleSendMessage}
      onSelectConversation={setActiveConversationId}
      isGenerating={sendMutation.isPending}
      onStop={() => {}}
    />
  );
};