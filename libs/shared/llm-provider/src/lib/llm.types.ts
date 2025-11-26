export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string; // e.g. "gpt-4o" or "llama3"
  apiKey?: string;
}

export interface LLMResponse {
  content: string;
  usage?: { input: number; output: number };
}

export interface LLMProvider {
  id: string;
  name: string;
  generate: (request: LLMRequest) => Promise<LLMResponse>;
  // We will add streaming later, let's get one-shot working first
}