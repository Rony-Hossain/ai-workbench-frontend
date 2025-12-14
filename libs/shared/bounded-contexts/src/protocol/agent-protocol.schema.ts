import { z } from "zod";

export const AgentToolSchema = z.enum([
  "final_answer",
  "write_file",
  "run_command",
  "request_permission",
  "noop",
]);

export const AgentProtocolSchema = z
  .object({
    protocolVersion: z.literal(1),
    tool: AgentToolSchema,
    thought: z.string().nullable(),
    parameters: z
      .object({
        command: z.string().nullable(),
        path: z.string().nullable(),
        content: z.string().nullable(),
        reason: z.string().nullable(),
      })
      .strict(),
  })
  .strict();

export type AgentTool = z.infer<typeof AgentToolSchema>;
export type AgentProtocol = z.infer<typeof AgentProtocolSchema>;
