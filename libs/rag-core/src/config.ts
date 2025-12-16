export type RagCoreConfig = {
  embeddingDim: number;          // must match your embeddings model output
  maxChunkChars?: number;        // default ~2400
  chunkOverlapChars?: number;    // default ~300
  maxContextChars?: number;      // default ~12000
};