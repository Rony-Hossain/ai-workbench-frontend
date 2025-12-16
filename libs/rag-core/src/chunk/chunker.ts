export interface Chunk {
  index: number;
  content: string;
}

export function chunkText(text: string, maxChars = 2400, overlapChars = 300): Chunk[] {
  if (!text) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let idx = 0;

  while (start < text.length) {
    const end = Math.min(text.length, start + maxChars);
    const content = text.slice(start, end);
    chunks.push({ index: idx++, content });

    if (end >= text.length) break;
    start = Math.max(0, end - overlapChars);
  }

  return chunks;
}
