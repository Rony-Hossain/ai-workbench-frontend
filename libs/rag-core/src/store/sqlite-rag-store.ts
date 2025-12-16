import type { RagStore } from './rag-store';
import type { RagScope, RagSearchResult, UpsertDocumentInput } from '../types';

function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export class SqliteRagStore implements RagStore {
  constructor(
    private readonly rawDb: any,
    private readonly opts?: { candidateLimit?: number }
  ) {}

  transaction<T>(fn: (store: RagStore) => T): T {
    return this.rawDb.transaction(() => fn(this))();
  }

  async upsertDocument(doc: UpsertDocumentInput): Promise<void> {
    const stmt = this.rawDb.prepare(`
      INSERT INTO documents (id, type, source, title, metadata, created_at, updated_at)
      VALUES (@id, @type, @source, @title, @metadata, @created_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        type=excluded.type,
        source=excluded.source,
        title=excluded.title,
        metadata=excluded.metadata,
        updated_at=excluded.updated_at
    `);

    const now = Date.now();
    stmt.run({
      id: doc.id,
      type: doc.type,
      source: doc.source,
      title: doc.title ?? null,
      metadata: doc.metadata ? JSON.stringify(doc.metadata) : null,
      created_at: (doc.createdAt ?? new Date()).getTime(),
      updated_at: now,
    });
  }

  async deleteEmbeddingsByDocument(documentId: string): Promise<void> {
    this.rawDb.prepare(`DELETE FROM embeddings WHERE document_id = ?`).run(documentId);
  }

  async insertEmbeddingChunk(args: {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    embedding: Float32Array;
  }): Promise<void> {
    const stmt = this.rawDb.prepare(`
      INSERT INTO embeddings (id, document_id, chunk_index, content, embedding)
      VALUES (?, ?, ?, ?, ?)
    `);

    const buf = Buffer.from(args.embedding.buffer);
    stmt.run(args.id, args.documentId, args.chunkIndex, args.content, buf);
  }

  async searchByEmbedding(args: {
    queryEmbedding: Float32Array;
    k: number;
    scope?: RagScope;
  }): Promise<RagSearchResult[]> {
    const { scope } = args;

    const clauses: string[] = [];
    const params: any[] = [];

    if (scope?.documentTypes?.length) {
      clauses.push(`d.type IN (${scope.documentTypes.map(() => '?').join(',')})`);
      params.push(...scope.documentTypes);
    }
    if (scope?.sourcePrefix) {
      clauses.push(`d.source LIKE ?`);
      params.push(scope.sourcePrefix + '%');
    }
    if (scope?.conversationId) {
      clauses.push(`d.source = ?`);
      params.push(scope.conversationId);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const CANDIDATE_LIMIT = this.opts?.candidateLimit ?? 10000;

    const rows = this.rawDb.prepare(`
      SELECT
        e.document_id as documentId,
        e.chunk_index as chunkIndex,
        e.content as content,
        e.embedding as embedding,
        d.source as source,
        d.title as title,
        d.metadata as metadata
      FROM embeddings e
      JOIN documents d ON d.id = e.document_id
      ${where}
      LIMIT ${CANDIDATE_LIMIT}
    `).all(...params);

    const scored: RagSearchResult[] = rows.map((r: any) => {
      const buf: Buffer = r.embedding;
      const emb = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
      const score = cosineSim(args.queryEmbedding, emb);
      return {
        documentId: r.documentId,
        chunkIndex: r.chunkIndex,
        content: r.content,
        source: r.source,
        title: r.title,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, args.k);
  }
}
