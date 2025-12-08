import { BaseEntity } from '../common/base.types';
import { AgentRole } from '../common/enums';

/**
 * Agent entity type
 */
export interface Agent extends BaseEntity {
  name: string;
  role: AgentRole;
  modelId: string; // Foreign key to Provider
  systemPrompt: string;
  temperature: number;
  maxTokens?: number;
  tools: string[];
  metadata?: Record<string, any>;
  isActive: boolean;
  kind?: string; // Add kind for graph/status representation
}

/**
 * Agent with provider info
 */
export interface AgentWithProvider extends Agent {
  provider: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Agent statistics
 */
export interface AgentStats {
  totalTasks: number;
  completedTasks: number;
  activeProjects: number;
  completionRate: number;
  workloadLevel: 'light' | 'moderate' | 'heavy' | 'overloaded';
}

/**
 * Agent Status states for graph nodes
 */
export type AgentStatusState = 'idle' | 'busy' | 'success' | 'failed' | 'running' | 'queued';

/**
 * Agent Status interface
 */
export interface AgentStatus {
  agentId: string;
  kind: string; // e.g., 'planner', 'coder'
  label: string; // Display name
  state: AgentStatusState;
  lastUpdated: number; // Timestamp
  metadata?: Record<string, any>;
}

/**
 * Agent Graph Node
 */
export interface AgentGraphNode {
  id: string;
  label: string;
  status: AgentStatusState; // Corresponds to AgentStatusState
  kind: string;
  position?: { x: number; y: number };
  data?: Record<string, any>;
}

/**
 * Agent Graph Edge
 */
export interface AgentGraphEdge {
  id?: string; // Optional ID for the edge
  source: string;
  target: string;
  status: AgentStatusState; // Status of the connection/flow
  label?: string;
  type?: string;
  data?: Record<string, any>;
}