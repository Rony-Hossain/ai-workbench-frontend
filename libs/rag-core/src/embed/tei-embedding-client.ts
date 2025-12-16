import axios from 'axios';
import type { EmbeddingClient } from './embedding-client';

export class TeiEmbeddingClient implements EmbeddingClient {
  constructor(
    private readonly endpoint: string,
    private readonly modelName?: string
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const res = await axios.post(`${this.endpoint}/embed`, {
      inputs: texts,
      ...(this.modelName ? { model: this.modelName } : {}),
    });

    const data = res.data;
    if (Array.isArray(data) && Array.isArray(data[0])) return data as number[][];
    if (data?.embeddings && Array.isArray(data.embeddings)) return data.embeddings as number[][];

    throw new Error('Unexpected embedding response shape from TEI');
  }
}
