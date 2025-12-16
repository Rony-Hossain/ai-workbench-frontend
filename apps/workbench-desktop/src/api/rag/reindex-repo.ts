import type Database from 'better-sqlite3';
import { getRagServices } from './rag-services';

export async function reindexRepo(rawDb: Database.Database, repoRootAbsPath: string) {
  const { ingester } = getRagServices(rawDb);

  console.log(`[RAG] Starting reindex of: ${repoRootAbsPath}`);

  const normalizedPath = repoRootAbsPath.replace(/\\/g, '/').replace(/\/$/, '');
  const sourcePrefix = `repo:${normalizedPath}/`;

  return ingester.ingestAll({
    rootDir: repoRootAbsPath,
    sourcePrefix,
    globs: ['**/*'],
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/*.lock',
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif',
      '**/*.svg',
      '**/*.pdf',
      '**/*.zip',
    ],
    maxBytes: 1_500_000,
    typeByExt: (ext) => (ext === '.md' ? 'doc' : 'code'),
  });
}
