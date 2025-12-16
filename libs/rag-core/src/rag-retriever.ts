import type { EmbeddingClient } from './embed/embedding-client';
import type { RagStore } from './store/rag-store';
import type { RagScope, RagSearchResult, RetrievalInput } from './types';

export class RagRetriever {
  constructor(
    private readonly embedder: EmbeddingClient,
    private readonly store: RagStore
  ) {}

  async search(query: string, k = 8, scope?: RagScope): Promise<RagSearchResult[]> {
    const [vec] = await this.embedder.embed([query]);
    const q = new Float32Array(vec);
    return this.store.searchByEmbedding({ queryEmbedding: q, k, scope });
  }

  async retrieve(input: RetrievalInput): Promise<RagSearchResult[]> {
    return this.search(input.query, input.k ?? 8, input.scope);
  }
}
