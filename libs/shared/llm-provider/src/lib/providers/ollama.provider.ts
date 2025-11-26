import { LLMProvider, LLMRequest } from '../llm.types';

export const OllamaProvider: LLMProvider = {
  id: 'ollama',
  name: 'Ollama (Local)',

  generate: async (req: LLMRequest) => {
    // Ollama runs locally, usually no key needed
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.model || 'llama3',
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userPrompt }
        ],
        stream: false // Simple one-shot for now
      })
    });

    if (!response.ok) throw new Error("Ollama is not running or model is missing.");

    const data = await response.json();
    return {
      content: data.message.content,
    };
  }
};