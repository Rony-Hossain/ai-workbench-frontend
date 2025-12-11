import type { FileNode } from '@ai-workbench/bounded-contexts';
import type { TerminalSession } from '@ai-workbench/feature-terminal';

// 1. Define the methods the frontend can call
export interface BridgeApi {
  files: {
    readDir: (path: string) => Promise<FileNode>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
  };
  dialog: {
    openDirectory: () => Promise<string | null>;
  };
  terminal: {
    create: () => Promise<string>; // Returns session ID
    write: (id: string, data: string) => Promise<void>;
    resize: (id: string, cols: number, rows: number) => Promise<void>;
  };
  app: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
}

export interface TerminalAgentEventPayload {
  sessionId: string;
  agentId: string;
}

export interface CreateTerminalSessionPayload {
  projectId: string;
  name: string;
  agentId: string;
  cols?: number;
  rows?: number;
}

export interface TerminalSessionFilter {
  projectId?: string;
}

export interface TerminalBridgeApi {
  listSessions: (
    filter?: TerminalSessionFilter,
  ) => Promise<{ success: boolean; sessions: TerminalSession[] }>;
  createSession: (
    payload: CreateTerminalSessionPayload,
  ) => Promise<{ success: boolean; sessionId?: string; pid?: number }>;
  joinSession: (
    payload: TerminalAgentEventPayload,
  ) => Promise<{ success: boolean }>;
  leaveSession: (
    payload: TerminalAgentEventPayload,
  ) => Promise<{ success: boolean }>;
  kill: (sessionId: string, agentId: string) => Promise<void>;
  write: (sessionId: string, agentId: string, data: string) => Promise<void>;
  resize: (
    sessionId: string,
    agentId: string,
    cols: number,
    rows: number,
  ) => Promise<void>;
  onData: (callback: (sessionId: string, data: string) => void) => () => void;
  onSessionCreated: (callback: (session: TerminalSession) => void) => () => void;
  onAgentJoined: (
    callback: (payload: TerminalAgentEventPayload) => void,
  ) => () => void;
  onAgentLeft: (
    callback: (payload: TerminalAgentEventPayload) => void,
  ) => () => void;
}

// 2. Extend the global window object
declare global {
  interface Window {
    electron: BridgeApi;
    terminalAPI?: TerminalBridgeApi;
  }
}
