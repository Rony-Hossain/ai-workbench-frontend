export enum ProviderType {
  LOCAL = 'local',
  CLOUD = 'cloud',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export enum AgentRole {
  PLANNER = 'planner',
  CODER = 'coder',
  REVIEWER = 'reviewer',
  TESTER = 'tester',
  RESEARCHER = 'researcher',
  COORDINATOR = 'coordinator',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}
