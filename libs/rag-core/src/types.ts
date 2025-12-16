export type RagDocumentType = 'code' | 'doc' | 'chat' | 'custom';

export interface RagScope {
  documentTypes?: RagDocumentType[];
  sourcePrefix?: string; // e.g. "repo:/home/rony/ai-workbench/"
  conversationId?: string; // for chat-scoped documents
}

export interface RagSearchResult {
  documentId: string;
  chunkIndex: number;
  content: string;
  source: string;
  title: string | null;
  metadata: Record<string, any> | null;
  score: number;
}

export interface IndexDocumentInput {
  id: string;
  type: RagDocumentType;
  source: string;
  title?: string | null;
  content: string;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
}

export interface UpsertDocumentInput {
  id: string;
  type: RagDocumentType;
  source: string;
  title?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
}

export interface RetrievalInput {
  query: string;
  k?: number;
  scope?: RagScope;
}

export interface BuiltContextCitation {
  ref: string;
  documentId: string;
  chunkIndex: number;
  source: string;
  title: string | null;
  score: number;
}

export interface BuiltContext {
  contextText: string;
  citations: BuiltContextCitation[];
}
