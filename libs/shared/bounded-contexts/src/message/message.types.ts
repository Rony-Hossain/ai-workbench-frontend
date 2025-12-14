import { BaseEntity } from '../common/base.types';

export type AgentTool = 'final_answer' | 'write_file' | 'run_command' | 'request_permission' | 'noop';

export interface AgentProtocol {
  protocolVersion: 1;
  tool: AgentTool;
  thought: string | null; // Reasoning trace
  parameters: {
    command: string | null;
    path: string | null;
    content: string | null;
    reason: string | null; // Added for permissions
  };
}

export interface MessageMetadata {
  // A. Identity (Always Required)
  senderType: 'user' | 'agent' | 'system';
  senderAgentId: string | null;
  senderName: string | null;

  // B. Protocol Payload (Structural, not optional bag)
  // Present for Agents, null for Users/System
  protocol: AgentProtocol | null;

  // C. Execution Telemetry (Critical for Async Task Runner)
  taskId: string | null;      // Links message to the Task that created it
  traceId: string | null;     // Links to a specific run loop
  modelId: string | null;
  latencyMs: number | null;
}

export interface Message extends BaseEntity {
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string; // Rendered / Display text ONLY
  metadata: MessageMetadata;
}
