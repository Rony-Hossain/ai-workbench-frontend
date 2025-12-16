import type { RagScope, RagSearchResult, UpsertDocumentInput } from '../types';

export interface RagStore {
  transaction<T>(fn: (store: RagStore) => T): T;

  upsertDocument(doc: UpsertDocumentInput): Promise<void>;
  deleteEmbeddingsByDocument(documentId: string): Promise<void>;

  insertEmbeddingChunk(args: {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    embedding: Float32Array;
  }): Promise<void>;

  searchByEmbedding(args: {
    queryEmbedding: Float32Array;
    k: number;
    scope?: RagScope;
  }): Promise<RagSearchResult[]>;
}
