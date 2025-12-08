import React, { useState } from 'react';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { WorkspaceChatWithPermissions } from './workspace-chat-with-permissions';
import type { Agent, User, Message, AgentHistoryItem, ConversationHistoryItem, PermissionHistoryItem } from './types';

export const ChatPane: React.FC = () => {
  const workspaces = useWorkbenchStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkbenchStore((s) => s.activeWorkspaceId);
  const initialMessages = useWorkbenchStore((s) => s.chatMessages);
  const agentStatuses = useWorkbenchStore((s) => s.agentStatuses);
  const addChatMessage = useWorkbenchStore((s) => s.addChatMessage);

  const workspaceList = Array.isArray(workspaces)
    ? workspaces
    : Object.values(workspaces || {});
  const activeWorkspace =
    (typeof workspaces === 'object' && !Array.isArray(workspaces)
      ? workspaces?.[activeWorkspaceId ?? '']
      : undefined) ??
    workspaceList.find((w) => w.id === activeWorkspaceId);

  // --- Data Mapping & Mocking ---
  // This section maps your Zustand state to the format the new components expect.
  // It also includes mock data that you should replace with real data from your store or API.

  const users: User[] = [
    { id: 'user-1', name: 'Rony', avatar: 'https://github.com/shadcn.png' },
  ];

  const agents: Agent[] = Object.values(agentStatuses || {}).map((status) => ({
    id: status.agentId,
    name: status.label,
    model: status.kind,
    status: status.state === 'active' ? 'thinking' : 'online',
    avatar: '', // You can add avatar URLs to your agent state
  }));

  const messages: Message[] = initialMessages.map((m) => ({
    id: m.id || `msg-${m.timestamp}`,
    type: m.role === 'user' ? 'human' : 'agent',
    senderId: m.role === 'user' ? users[0].id : m.agent_id || 'unknown',
    senderName: m.role === 'user' ? users[0].name : m.agent_id || 'Agent',
    senderAvatar: m.role === 'user' ? users[0].avatar : undefined,
    content: m.content,
    timestamp: new Date(m.timestamp),
    status: 'sent', // You can enhance this based on message status
  }));

  // Mock history data - replace with actual data
  const permissionHistory: PermissionHistoryItem[] = [];
  const conversationHistory: ConversationHistoryItem[] = [];
  const agentHistory: AgentHistoryItem[] = [];

  const [isGenerating, setIsGenerating] = useState(false);

  // --- Event Handlers ---
  const handleSendMessage = (
    content: string,
    targetAgent: string,
    attachments: any[]
  ) => {
    addChatMessage({
      role: 'user',
      content,
      timestamp: new Date(),
      // You might want to add targetAgent to your ChatMessage type
    });
    // Here you would typically trigger the agent logic
    // For now, we'll just simulate a thinking state
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const handleStop = () => {
    setIsGenerating(false);
  };

  return (
    <WorkspaceChatWithPermissions
      workspaceName={activeWorkspace?.name || 'AI Workbench'}
      users={users}
      agents={agents}
      messages={messages}
      permissionHistory={permissionHistory}
      conversationHistory={conversationHistory}
      agentHistory={agentHistory}
      onSendMessage={handleSendMessage}
      isGenerating={isGenerating}
      onStop={handleStop}
      showAgentPanel={true}
      showConversationPanel={true}
      showHistoryPanel={true}
    />
  );
};
