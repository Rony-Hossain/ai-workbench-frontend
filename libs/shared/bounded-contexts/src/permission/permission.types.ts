export type PermissionDecision = 'pending' | 'approved' | 'rejected';

export interface PermissionRequest {
  id: string;
  createdAt: number;
  type: string;
  operation: string;
  riskLevel?: 'low' | 'medium' | 'high';
  requestedBy?: string;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface PermissionRecord extends PermissionRequest {
  decision: PermissionDecision;
  decidedAt: number;
}
