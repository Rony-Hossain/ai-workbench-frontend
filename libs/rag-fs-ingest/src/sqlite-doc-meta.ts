export function getDocumentHash(rawDb: any, documentId: string): string | null {
  const row = rawDb.prepare(`SELECT metadata FROM documents WHERE id = ?`).get(documentId);
  if (!row?.metadata) return null;
  try {
    const meta = JSON.parse(row.metadata);
    return meta?.hash ?? null;
  } catch {
    return null;
  }
}
