import * as crypto from 'crypto';
import type { EmbeddingClient } from './embed/embedding-client';
import type { RagStore } from './store/rag-store';
import type { IndexDocumentInput } from './types';
import { chunkText } from './chunk/chunker';

export class RagIndexer {
  constructor(
    private readonly embedder: EmbeddingClient,
    private readonly store: RagStore,
    private readonly config?: { maxChunkChars?: number; chunkOverlapChars?: number }
  ) {}

  async indexDocument(input: IndexDocumentInput): Promise<void> {
    await this.store.upsertDocument({
      id: input.id,
      type: input.type,
      source: input.source,
      title: input.title ?? null,
      metadata: input.metadata ?? null,
      createdAt: input.createdAt ?? new Date(),
    });

    const chunks = chunkText(
      input.content,
      this.config?.maxChunkChars ?? 2400,
      this.config?.chunkOverlapChars ?? 300
    );

    const matrix = await this.embedder.embed(chunks.map(c => c.content));

    // Atomic replace: delete + all inserts in one transaction
    this.store.transaction((tx) => {
      void tx.deleteEmbeddingsByDocument(input.id);

      for (let i = 0; i < chunks.length; i++) {
        void tx.insertEmbeddingChunk({
          id: crypto.randomUUID(),
          documentId: input.id,
          chunkIndex: chunks[i].index,
          content: chunks[i].content,
          embedding: new Float32Array(matrix[i]),
        });
      }
    });
  }
}
