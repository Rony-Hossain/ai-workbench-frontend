import { LLMProvider, LLMRequest } from '../llm.types';

interface LocalProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
}

export const createLocalProvider = (config: LocalProviderConfig): LLMProvider => ({
  id: config.id,
  name: config.name,

  generate: async (req: LLMRequest) => {
    const base = config.baseUrl.replace(/\/$/, '');
    const url = `${base}/chat/completions`;

    console.log(
      `📡 [${config.name}] Sending prompt to ${url} (Grammar enforced: ${req.grammar ? 'yes' : 'no'})`,
    );

    const body: Record<string, unknown> = {
      model: req.model,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userPrompt },
      ],
      temperature: req.grammar ? 0.1 : 0.7,
      stream: false,
    };

    if (req.grammar) {
      body.grammar = req.grammar;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${req.apiKey || 'sk-local'}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(`Local provider error (${response.status}): ${errorPayload}`);
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content ?? '',
        usage: data.usage,
      };
    } catch (error) {
      console.error(`🔥 [${config.name}] Connection Failed`, error);
      throw new Error(`Failed to contact ${config.name} at ${config.baseUrl}`);
    }
  },
});
