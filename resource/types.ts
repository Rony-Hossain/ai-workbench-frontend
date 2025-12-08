export interface User {
    id: string;
    name: string;
    avatar?: string;
}

export interface Agent {
    id: string;
    name: string;
    model: string;
    status: 'online' | 'offline' | 'thinking' | 'error';
    avatar?: string;
}

export interface Message {
    id: string;
    type: 'human' | 'agent' | 'permission';
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'sending' | 'agent_thinking' | 'agent_unavailable';
    targetAgent?: string;
    model?: string;
    permissionData?: PermissionCardData;
}

export interface Attachment {
    id: string;
    name: string;
    type: 'image' | 'file';
    size: number;
    url: string;
}

export type ActionType = 'file_modify' | 'file_create' | 'command' | 'network' | 'secret';

export interface PermissionAction {
    id: string;
    type: ActionType;
    summary: string;
    details?: string;
    checked: boolean;
}

export interface PermissionCardData {
    id: string;
    status: 'pending' | 'approved_once' | 'approved_with_rule' | 'denied' | 'failed';
    agent: { name: string; model: string; role: string };
    requestedBy: { name: string };
    workspace: string;
    requestedAt: Date;
    actions: PermissionAction[];
    reason: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskTags: string[];
    ruleName?: string;
}

export interface AgentHistoryItem {
    id: string;
    agentName: string;
    model: string;
    action: string;
    details: string;
    status: 'completed' | 'in_progress' | 'failed';
    timestamp: Date;
    duration?: number;
}

export interface ConversationHistoryItem {
    id: string;
    title: string;
    lastMessage: string;
    messageCount: number;
    timestamp: Date;
    participants: string[];
    isActive: boolean;
}

export interface PermissionHistoryItem {
    id: string;
    summary: string;
    status: 'pending' | 'approved_once' | 'approved_with_rule' | 'denied' | 'failed';
    agent: { name: string; model: string };
    approver?: { name: string };
    timestamp: Date;
}