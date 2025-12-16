import type { BuiltContext, RagSearchResult } from '../types';

export function buildRagContext(
  results: RagSearchResult[],
  maxContextChars = 12000
): BuiltContext {
  let used = 0;
  const lines: string[] = [];
  const citations: BuiltContext['citations'] = [];

  results.forEach((r, i) => {
    const ref = `doc:${r.documentId}#chunk:${r.chunkIndex}`;
    const header = `[${i + 1}] ${r.title ?? r.source} (${ref}) score=${r.score.toFixed(4)}`;
    const block = `${header}
${r.content}
`;

    if (used + block.length > maxContextChars) return;

    lines.push(block);
    used += block.length;

    citations.push({
      ref,
      documentId: r.documentId,
      chunkIndex: r.chunkIndex,
      source: r.source,
      title: r.title ?? null,
      score: r.score,
    });
  });

  return {
    contextText: lines.length
      ? `RETRIEVED CONTEXT:\n\n${lines.join('\n')}`
      : `RETRIEVED CONTEXT:\n\n<EMPTY>`,
    citations,
  };
}
