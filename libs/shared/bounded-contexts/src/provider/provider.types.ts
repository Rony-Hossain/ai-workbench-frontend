import { BaseEntity } from '../common/base.types';
import { ProviderType } from '../common/enums';

/**
 * Model information
 */
export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  maxTokens?: number;
}

/**
 * Provider entity type
 */
export interface Provider extends BaseEntity {
  name: string;
  type: ProviderType;
  endpoint?: string;
  apiKey?: string;
  models: ModelInfo[];
  metadata?: Record<string, any>;
}

/**
 * Provider connection test result
 */
export interface ProviderConnectionTest {
  success: boolean;
  latency?: number;
  error?: string;
}

/**
 * Provider statistics
 */
export interface ProviderStats {
  totalAgents: number;
  activeAgents: number;
  totalModels: number;
}
