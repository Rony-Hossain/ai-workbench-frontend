import { BaseEntity, SoftDeletable } from '../common/base.types';
import { TaskStatus, TaskPriority } from '../common/enums';

/**
 * Task entity type
 */
export interface Task extends BaseEntity, SoftDeletable {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToAgentId?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  completedAt?: Date;
}

/**
 * Task with project info
 */
export interface TaskWithProject extends Task {
  project: {
    id: string;
    name: string;
  };
}

/**
 * Task statistics
 */
export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  blocked: number;
  done: number;
  overdue: number;
}
