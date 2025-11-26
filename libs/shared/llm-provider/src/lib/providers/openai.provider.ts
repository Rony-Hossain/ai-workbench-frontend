import { LLMProvider, LLMRequest } from '../llm.types';

export const OpenAIProvider: LLMProvider = {
  id: 'openai',
  name: 'OpenAI (Cloud)',
  
  generate: async (req: LLMRequest) => {
    if (!req.apiKey) throw new Error("OpenAI API Key is missing");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.apiKey}`
      },
      body: JSON.stringify({
        model: req.model || 'gpt-4o',
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'OpenAI Request Failed');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens
      }
    };
  }
};