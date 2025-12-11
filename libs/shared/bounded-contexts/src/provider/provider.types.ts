import { z } from 'zod';
import type { BaseEntity } from '../common/base.types';

// --- ENUMS ---
export const ProviderTypeEnum = z.enum(['cloud', 'local', 'docker']);
export type ProviderType = z.infer<typeof ProviderTypeEnum>;

export const ProviderStatusEnum = z.enum(['running', 'offline', 'error', 'auth_error']);
export type ProviderStatus = z.infer<typeof ProviderStatusEnum>;

export const WorkspaceScopeEnum = z.enum(['global', 'specific']);
export type WorkspaceScope = z.infer<typeof WorkspaceScopeEnum>;

// --- SUB-SCHEMAS ---
export const ModelCapabilityEnum = z.enum(['chat', 'code', 'vision', 'embedding', 'tools']);
export type ModelCapability = z.infer<typeof ModelCapabilityEnum>;

export const AIModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  capabilities: z.array(ModelCapabilityEnum),
  contextWindow: z.number().optional(),
  maxTokens: z.number().optional(),
  status: z.enum(['available', 'downloading', 'error']).default('available'),
});
export type AIModel = z.infer<typeof AIModelSchema>;

// --- MAIN ENTITIES ---
export const ProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  label: z.string().optional(),
  type: ProviderTypeEnum,
  endpoint: z.string().url().optional(),
  isConfigured: z.boolean(),
  models: z.array(AIModelSchema),
  workspaceScope: z.union([z.literal('global'), z.array(z.string().uuid())]),
  status: ProviderStatusEnum,
  lastChecked: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Provider = z.infer<typeof ProviderSchema> & BaseEntity;

export const CreateProviderInputSchema = z.object({
  type: ProviderTypeEnum,
  name: z.string().min(1),
  label: z.string().optional(),
  endpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
  workspaceScope: z.union([z.literal('global'), z.array(z.string().uuid())]).default('global'),
});
export type CreateProviderInput = z.infer<typeof CreateProviderInputSchema>;

export const RoleMappingSchema = z.object({
  workspaceId: z.string().uuid(),
  role: z.enum(['planner', 'coder', 'reviewer', 'architect', 'debugger']),
  providerId: z.string().uuid(),
  modelId: z.string(),
  fallbackModelId: z.string().optional(),
});
export type RoleMapping = z.infer<typeof RoleMappingSchema>;

export interface ProviderConnectionTest {
  success: boolean;
  latency?: number;
  error?: string;
}

export interface ProviderStats {
  totalAgents: number;
  activeAgents: number;
  totalModels: number;
}
