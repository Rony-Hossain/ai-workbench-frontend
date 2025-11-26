export type AgentNodeStatus = 'idle' | 'running' | 'success' | 'error' | 'pending';

export interface AgentGraphNode {
  id: string;
  label: string;
  status: AgentNodeStatus;
  // Added for UI compatibility
  kind: 'user' | 'permission' | 'planner' | 'lead_engineer' | 'reviewer'; 
}

export type EdgeStatus = 'idle' | 'running' | 'blocked' | 'success';

export interface AgentGraphEdge {
  source: string;
  target: string;
  label?: string;
  status: EdgeStatus;
}

export interface AgentGraphState {
  nodes: AgentGraphNode[];
  edges: AgentGraphEdge[];
}