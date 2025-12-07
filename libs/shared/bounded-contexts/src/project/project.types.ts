import { BaseEntity } from '../common/base.types';
import { ProjectStatus } from '../common/enums';
import { Agent } from '../agent/agent.types';

/**
 * Project entity type
 */
export interface Project extends BaseEntity {
  name: string;
  description: string;
  status: ProjectStatus;
  repositoryPath?: string;
  metadata?: Record<string, any>;
}

/**
 * Project-Agent relationship (many-to-many)
 */
export interface ProjectAgent {
  projectId: string;
  agentId: string;
  role: 'lead' | 'contributor' | 'reviewer';
  assignedAt: Date;
  hoursWorked: number;
  metadata?: Record<string, any>;
}

/**
 * Project with assigned agents
 */
export interface ProjectWithAgents extends Project {
  agents: Array<Agent & { role: string; hoursWorked: number }>;
}

/**
 * Project statistics
 */
export interface ProjectStats {
  totalAgents: number;
  totalHours: number;
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    blocked: number;
    done: number;
    overdue: number;
  };
}
