import { OpenAIProvider } from './lib/providers/openai.provider';
import { OllamaProvider } from './lib/providers/ollama.provider';
import { LLMProvider } from './lib/llm.types';

export * from './lib/llm.types';
export * from './lib/providers/local-generic.provider';

export function getLLMProvider(providerId: string): LLMProvider {
  switch (providerId) {
    case 'openai':
      return OpenAIProvider;
    case 'ollama':
      return OllamaProvider;
    // case 'anthropic': return AnthropicProvider; // (Implement later)
    default:
      console.warn(`Provider ${providerId} not found, defaulting to Ollama`);
      return OllamaProvider;
  }
}
