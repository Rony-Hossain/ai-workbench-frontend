import { SqliteRagStore, RagIndexer, RagRetriever, TeiEmbeddingClient } from '@ai-workbench/rag-core';
import { RagFsIngester } from '@ai-workbench/rag-fs-ingest';
import type Database from 'better-sqlite3';

let _rag:
  | {
      store: SqliteRagStore;
      indexer: RagIndexer;
      retriever: RagRetriever;
      ingester: RagFsIngester;
    }
  | null = null;

export type RagServices = NonNullable<typeof _rag>;

/**
 * Lazily instantiate RAG services so we reuse the same connections and config.
 */
export function getRagServices(rawDb: Database.Database): RagServices {
  if (_rag) return _rag;

  // 1. Embeddings (TEI)
  const embedder = new TeiEmbeddingClient('http://10.0.0.110:8092');

  // 2. Vector store
  const store = new SqliteRagStore(rawDb, { candidateLimit: 10000 });

  // 3. Indexer
  const indexer = new RagIndexer(embedder, store, {
    maxChunkChars: 2400,
    chunkOverlapChars: 300,
  });

  // 4. Retriever
  const retriever = new RagRetriever(embedder, store);

  // 5. Filesystem ingester
  const ingester = new RagFsIngester(rawDb, indexer);

  _rag = { store, indexer, retriever, ingester };
  return _rag;
}
