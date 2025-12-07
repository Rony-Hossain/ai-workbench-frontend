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
