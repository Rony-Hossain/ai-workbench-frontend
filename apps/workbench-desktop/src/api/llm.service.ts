import { createWriteStream } from 'fs';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMService {
  private baseUrl = 'http://localhost:11434/api/chat'; // Ollama Default
  private model = 'llama3'; // Or 'mistral', 'deepseek-coder'

  async streamResponse(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<string> {
    const body = {
      model: this.model,
      messages: messages,
      stream: true,
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Ollama sends JSON objects per line
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.done) break;
            
            const content = json.message?.content || '';
            if (content) {
              fullText += content;
              onChunk(content); // <--- Real-time callback
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
      return fullText;
    } catch (e) {
      console.error("LLM Connection Failed:", e);
      return "Error: Could not connect to AI Brain. Is Ollama running?";
    }
  }
}

export const llm = new LLMService();