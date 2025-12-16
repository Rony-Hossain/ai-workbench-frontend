import type Database from 'better-sqlite3';
import { getRagServices } from './rag-services';
import { buildRagContext } from '@ai-workbench/rag-core';

export async function buildPlannerRagInjection(params: {
  rawDb: Database.Database;
  conversationId: string;
  query: string;
  workspaceRootAbsPath: string;
  topK?: number;
  maxChars?: number;
}): Promise<string> {
  const { rawDb, query, workspaceRootAbsPath, topK = 10, maxChars = 10_000 } = params;

  try {
    const normalized = workspaceRootAbsPath.replace(/\\/g, '/').replace(/\/$/, '');
    const sourcePrefix = `repo:${normalized}/`;

    const { retriever } = getRagServices(rawDb);

    const results = await retriever.search(query, topK, {
      sourcePrefix,
      documentTypes: ['code', 'doc'],
    });

    const built = buildRagContext(results, maxChars);

    if (!built.citations.length) return '';

    return `\n\n[RAG_CONTEXT]\n${built.contextText}\n[/RAG_CONTEXT]\n\n`;
  } catch (e) {
    console.error('[RAG] Planner augmentation failed:', e);
    return '';
  }
}
