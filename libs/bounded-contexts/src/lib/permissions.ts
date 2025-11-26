export type PermissionType =
  | 'file_write'
  | 'file_delete'
  | 'file_read_sensitive'
  | 'network_request'
  | 'shell_command'
  | 'env_variable_access'
  | 'package_install'
  | 'database_mutation';

export type PermissionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PermissionDecision = 'pending' | 'approved' | 'rejected' | 'timeout';

export interface PermissionRequest {
  id: string;
  type: PermissionType;
  riskLevel: PermissionRiskLevel;
  operation: string; // human summary: "Update config/app.json"
  details?: Record<string, unknown>; // optional structured info
  requestedBy?: string; // e.g. "Lead Engineer"
  reason?: string; // why the agent wants to do this
  createdAt: number;
}

export interface PermissionRecord extends PermissionRequest {
  decision: PermissionDecision;
  decidedAt: number;
  executionResult?: {
    success: boolean;
    message?: string;
  };
}