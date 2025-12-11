export interface TerminalSession {
  id: string;
  projectId: string;
  agentIds: string[];
  metadata: {
    name: string;
    cols: number;
    rows: number;
  };
  state: {
    isActive: boolean;
    isPaused: boolean;
  };
}

export interface CommandHistoryEntry {
  timestamp: string;
  agentId: string;
  command: string;
}

export const AGENT_COLORS: Record<string, string> = {
  'executor-agent': '#00ff9f',
  'planner-agent': '#00f0ff',
  'reviewer-agent': '#ff0080',
  'debugger-agent': '#fcee0a',
};
