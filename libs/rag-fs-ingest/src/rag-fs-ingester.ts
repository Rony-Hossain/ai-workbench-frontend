import fg from 'fast-glob';
import * as path from 'path';
import { readTextFileSafe, sha256 } from './fs-utils';
import { getDocumentHash } from './sqlite-doc-meta';
import type { RagIndexer, RagDocumentType } from '@ai-workbench/rag-core';

export interface FsIngestConfig {
  rootDir: string;
  sourcePrefix: string;
  globs: string[];
  ignore?: string[];
  maxBytes?: number;
  typeByExt?: (ext: string) => RagDocumentType;
}

export class RagFsIngester {
  constructor(
    private readonly rawDb: any,
    private readonly indexer: RagIndexer
  ) {}

  async ingestAll(cfg: FsIngestConfig): Promise<{ indexed: number; skipped: number; total: number }> {
    const entries = await fg(cfg.globs, {
      cwd: cfg.rootDir,
      dot: true,
      ignore: cfg.ignore ?? [],
      onlyFiles: true,
      unique: true,
    });

    let indexed = 0;
    let skipped = 0;

    for (const rel of entries) {
      const abs = path.join(cfg.rootDir, rel);
      const { text, skipped: s } = readTextFileSafe(abs, cfg.maxBytes ?? 1_500_000);
      if (s) { skipped++; continue; }

      const hash = sha256(text);
      const docId = `${cfg.sourcePrefix}${rel}`;
      const prevHash = getDocumentHash(this.rawDb, docId);

      if (prevHash && prevHash === hash) {
        skipped++;
        continue;
      }

      const ext = path.extname(rel).toLowerCase();
      const type: RagDocumentType =
        cfg.typeByExt?.(ext) ??
        (ext === '.md' ? 'doc' : 'code');

      await this.indexer.indexDocument({
        id: docId,
        type,
        source: docId,
        title: rel,
        content: text,
        metadata: { path: rel, hash },
      });

      indexed++;
    }

    return { indexed, skipped, total: entries.length };
  }
}
