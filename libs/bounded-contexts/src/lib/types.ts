// Workspace a.k.a. "Project"
export interface Workspace {
  id: string;
  name: string;
  path: string;
}

// File System
export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  status?: 'modified' | 'new' | 'deleted' | 'ignored';
}

// Chat
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
}

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
  // Secrets (In a real app, these might be encrypted)
  openAiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
  // Preferences
  theme: 'cyberpunk' | 'dark' | 'light';
  fontSize: number;
  preferredModel: 'gpt-4o' | 'claude-3-5-sonnet' | 'llama3';
}