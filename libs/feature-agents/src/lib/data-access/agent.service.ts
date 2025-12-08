import { fileSystemApi } from '@ai-workbench/feature-files';
import { workbenchStore } from '@ai-workbench/state-workbench';
import { getLLMProvider, LLMProvider } from '@ai-workbench/shared/llm-provider';
import { chatDb, workspaceDb } from '@ai-workbench/shared/database/client';
import type { ChatMessage } from '@ai-workbench/bounded-contexts';


async function getActiveConversationId(workspacePath: string): Promise<string> {
  // 1. Try to find existing threads
  const threads = await chatDb.listByWorkspace(workspacePath);
  if (threads.length > 0) return threads[0].id;

  // 2. Create new if none exist
  return await chatDb.create(workspacePath, "General Discussion");
}

export const agentService = {
  processMessage: async (input: string) => {
    const store = workbenchStore.getState();
    const { 
      addChatMessage, requestPermission, setStreaming, setAgentStatus, profile, activeWorkspaceId 
    } = store;

    // 1. RESOLVE PROVIDER & KEY (Defensively)
    const activeId = profile.activeProvider || 'openai';
    
    // FIX: Ensure config object exists before accessing it
    const safeConfig = profile.config || {}; 
    
    // FIX: Now safely access the provider config
    // @ts-ignore - Typescript might complain about indexing, but this is safe at runtime
    const providerConfig = safeConfig[activeId] || {}; 
    
    // Validation: Do we have what we need?
    if (activeId !== 'ollama' && !providerConfig.apiKey) {
       addChatMessage({
        id: `sys-${Date.now()}`,
        role: 'system',
        content: `⚠️ **Configuration Error**: No API Key found for **${activeId}**. Please open Settings and configure the provider.`,
        timestamp: new Date(),
      });
      return;
    }

    const modelName = providerConfig.model || 'gpt-4o';
    const provider: LLMProvider = getLLMProvider(activeId);

    setStreaming(true);
    setAgentStatus('planner', 'thinking');

    try {
      // --- TOOL: READ FILE ---
      if (input.toLowerCase().startsWith('read ')) {
        const filename = input.split(' ')[1];
        try {
          const content = await fileSystemApi.readFile(filename);
          
          const response = await provider.generate({
            model: modelName,
            apiKey: providerConfig.apiKey, 
            systemPrompt: "You are a Senior Engineer. Analyze the code. Be concise.",
            userPrompt: `File: ${filename}\n\nCode:\n${content}\n\nRequest: ${input}`
          });

          addChatMessage({
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: response.content,
            timestamp: new Date(),
          });
        } catch (e: any) {
          addChatMessage({
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Error reading file: ${e.message}`,
            timestamp: new Date(),
          });
        }
      }

      // --- TOOL: WRITE CODE ---
      else if (input.toLowerCase().startsWith('write ') || input.toLowerCase().startsWith('create ')) {
        const parts = input.split(' ');
        const filename = parts[1];
        
        const response = await provider.generate({
          model: modelName,
          apiKey: providerConfig.apiKey,
          systemPrompt: "You are a Code Generator. Output ONLY the code for the file requested. No markdown fences, no chatter.",
          userPrompt: `Request: ${input}`
        });

        const permId = requestPermission({
          type: 'file_write',
          riskLevel: 'medium',
          operation: `Write code to ${filename}`,
          requestedBy: 'Lead Engineer',
          reason: 'User requested code generation via Chat.',
          details: { 
            path: filename, 
            contentPreview: response.content 
          }
        });

        addChatMessage({
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `I have generated code for **${filename}**. Review the Permission Card to save it.`,
          timestamp: new Date(),
        });
      }

      // --- DEFAULT CHAT ---
      else {
        const response = await provider.generate({
          model: modelName,
          apiKey: providerConfig.apiKey,
          systemPrompt: "You are a helpful AI assistant in a Cyberpunk IDE.",
          userPrompt: input
        });

        addChatMessage({
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        });
      }

    } catch (err: any) {
      addChatMessage({
        id: `sys-${Date.now()}`,
        role: 'system',
        content: `AI Error: ${err.message}`,
        timestamp: new Date(),
      });
    } finally {
      setStreaming(false);
      setAgentStatus('planner', 'idle');
    }
  }
};
