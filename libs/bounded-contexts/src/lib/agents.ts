export type AgentKind = 'planner' | 'lead_engineer' | 'reviewer';

export interface Agent {
  id: string;
  name: string;
  model: string;
  kind?: AgentKind;
  systemPrompt?: string;
}

export type AgentStatusState = 'idle' | 'thinking' | 'blocked' | 'done';

export interface AgentStatus {
  agentId: string;
  kind: AgentKind;
  label: string;
  state: AgentStatusState;
  lastUpdated: number;
}

export type TaskStage = 'planning' | 'implementing' | 'reviewing';

export interface WorkbenchTask {
  id: string;
  stage: TaskStage;
  description: string;
  createdAt: number;
  createdBy: AgentKind;
  relatedPlanId?: string;
  permissionRequestId?: string;
  status: 'queued' | 'active' | 'blocked' | 'completed' | 'cancelled';
}