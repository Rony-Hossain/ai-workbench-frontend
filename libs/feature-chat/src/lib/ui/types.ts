"use client"

// Shared UI types for chat/workspace views

export type AgentStatus = "online" | "offline" | "thinking"

export interface Agent {
  id: string
  name: string
  model: string
  status: AgentStatus
  avatar?: string
}

export interface User {
  id: string
  name: string
  avatar?: string
}

export type AttachmentType = "file" | "image"

export interface Attachment {
  id: string
  name: string
  type: AttachmentType
  size: number
  url: string
}

export type MessageStatus =
  | "sent"
  | "sending"
  | "failed"
  | "agent_thinking"
  | "agent_unavailable"

export interface Message {
  id: string
  type: "human" | "agent"
  senderId: string
  senderName: string
  senderAvatar?: string
  model?: string
  content: string
  timestamp: Date
  status?: MessageStatus
  targetAgent?: string
  attachments?: Attachment[]
}

export type ActionType = "file_modify" | "file_create" | "command" | "network" | "secret"

export interface PermissionAction {
  id: string
  type: ActionType
  description: string
  detail?: string
  checked?: boolean
  risk?: "low" | "medium" | "high"
}

export interface PermissionCardData {
  id: string
  title: string
  agent: Agent
  status: "pending" | "approved_once" | "approved_with_rule" | "denied" | "failed"
  riskLevel: "low" | "medium" | "high"
  ruleName?: string
  summary?: string
  context?: {
    files?: string[]
    command?: string
    model?: string
    network?: string
  }
  actions: PermissionAction[]
}

export interface PermissionHistoryItem {
  id: string
  agent: Agent
  status: PermissionCardData["status"]
  timestamp: Date
  summary: string
}

export interface ConversationHistoryItem {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
}

export interface AgentHistoryItem {
  id: string
  agentName: string
  action: string
  status: "completed" | "failed" | "in_progress"
  timestamp: Date
}
