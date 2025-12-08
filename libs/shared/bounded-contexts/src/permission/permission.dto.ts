import { z } from 'zod';
import type { PermissionDecision } from './permission.types';

export const RequestPermissionSchema = z.object({
  agentId: z.string().uuid().optional(),
  type: z.string(),
  operation: z.string(),
  details: z.record(z.unknown()).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
});
export type RequestPermissionDto = z.infer<typeof RequestPermissionSchema>;

export const ResolvePermissionSchema = z.object({
  permissionId: z.string(),
  decision: z.custom<Exclude<PermissionDecision, 'pending'>>(),
});
export type ResolvePermissionDto = z.infer<typeof ResolvePermissionSchema>;
