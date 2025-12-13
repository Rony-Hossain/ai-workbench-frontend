import { z } from 'zod';
import { fileSystemApi } from '@ai-workbench/feature-files';
import { gbnfGenerator } from '@ai-workbench/shared/ai-engine';
import { chatDb } from '@ai-workbench/shared/database/client';
import { getLLMProvider } from '@ai-workbench/shared/llm-provider';
import { workbenchStore } from '@ai-workbench/state-workbench';

const AgentActionSchema = z.object({
  thought: z.string(),
  tool: z.enum(['read_file', 'write_file', 'run_command', 'final_answer']),
  parameters: z.object({
    path: z.string().optional(),
    content: z.string().optional(),
    command: z.string().optional(),
  }),
});

class PermissionRequiredError extends Error {
  constructor(public permissionId: string) {
    super('Permission Required');
  }
}

export const agentService = {
  processMessage: async (userMessage: string, agentId: string = 'planner') => {
    const store = workbenchStore.getState();
    const {
      activeConversationId,
      addChatMessage,
      requestPermission,
      setAgentStatus,
      setStreaming,
      profile,
    } = store;

    if (!activeConversationId) return;

    const workspaceId = store.activeWorkspaceId;
    if (!workspaceId) return;

    let providerId = profile.activeProvider || 'openai';
    let modelName = profile.config?.[providerId]?.model || 'gpt-4o';

    const currentMapping = store.roleMappings[workspaceId]?.[agentId];

    if (currentMapping) {
      providerId = currentMapping.providerId;
      modelName = currentMapping.modelId;
      console.log(`🤖 Role [${agentId}] mapped to [${modelName}] via Provider [${providerId}]`);
    } else {
      console.warn(`⚠️ No mapping found for role [${agentId}], using default.`);
    }

    const provider = getLLMProvider(providerId);
    const providerConfig = profile.config?.[providerId];
    const apiKey = providerConfig?.apiKey;

    setStreaming(true);
    setAgentStatus(agentId, 'running');

    try {
      const history = await chatDb.listMessages(activeConversationId, 10);
      const grammar = gbnfGenerator.generate(AgentActionSchema);

      const systemPrompt = `
You are an autonomous AI developer working inside AI Workbench.
You MUST respond with valid JSON matching the schema provided.
Do not use markdown or prose.

TOOLS:
- read_file(path)
- write_file(path, content)
- run_command(command)
- final_answer (respond to the user)
`;

      const historyText = history
        .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
        .join('\n');

      const response = await provider.generate({
        model: modelName,
        apiKey,
        systemPrompt,
        userPrompt: `History:\n${historyText}\n\nUser: ${userMessage}`,
        grammar,
      });

      let action = AgentActionSchema.parse(JSON.parse(response.content));

      if (action.tool === 'final_answer') {
        addChatMessage({
          role: 'assistant',
          content: action.thought,
          timestamp: new Date(),
        });
        return;
      }

      if (action.tool === 'read_file') {
        if (!action.parameters.path) {
          throw new Error('read_file requires parameters.path');
        }
        addChatMessage({
          role: 'assistant',
          content: `📖 Reading ${action.parameters.path}...`,
          timestamp: new Date(),
        });

        const content = await fileSystemApi.readFile(action.parameters.path);

        addChatMessage({
          role: 'tool',
          content: `FILE CONTENT (${action.parameters.path}):\n${content}`,
          timestamp: new Date(),
        });
        return;
      }

      if (action.tool === 'write_file') {
        if (!action.parameters.path || !action.parameters.content) {
          throw new Error('write_file requires path and content');
        }

        setAgentStatus(agentId, 'queued');
        const permissionId = requestPermission({
          type: 'file_write',
          operation: `Write to ${action.parameters.path}`,
          riskLevel: 'medium',
          details: {
            path: action.parameters.path,
            preview: action.parameters.content.slice(0, 200),
          },
        });

        addChatMessage({
          role: 'assistant',
          content: `I prepared code for ${action.parameters.path}. Please approve the permission request to apply it.`,
          timestamp: new Date(),
        });

        throw new PermissionRequiredError(permissionId);
      }

      if (action.tool === 'run_command') {
        if (!action.parameters.command) {
          throw new Error('run_command requires parameters.command');
        }

        setAgentStatus(agentId, 'queued');
        const permissionId = requestPermission({
          type: 'run_command',
          operation: action.parameters.command,
          riskLevel: 'high',
          details: { command: action.parameters.command },
        });

        addChatMessage({
          role: 'assistant',
          content: `I need to run \`${action.parameters.command}\`. Please approve the permission card.`,
          timestamp: new Date(),
        });

        throw new PermissionRequiredError(permissionId);
      }
    } catch (error: unknown) {
      if (error instanceof PermissionRequiredError) {
        console.log('Agent paused pending permission', error.permissionId);
      } else {
        const err = error as Error;
        console.error('Agent Error:', err);
        setAgentStatus(agentId, 'failed');
        addChatMessage({
          role: 'system',
          content: `Error: ${err.message}`,
          timestamp: new Date(),
        });
      }
    } finally {
      const latestStatus =
        workbenchStore.getState().agentStatuses[agentId]?.state;
      setStreaming(false);
      if (latestStatus !== 'queued') {
        setAgentStatus(agentId, 'idle');
      }
    }
  },
};
