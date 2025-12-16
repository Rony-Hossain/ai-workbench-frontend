import type Database from 'better-sqlite3';
import { migrateSqliteRag } from '@ai-workbench/rag-core';

/**
 * Run RAG migrations against a better-sqlite3 instance.
 * Call immediately after initializing the DB.
 */
export function migrateRag(rawDb: Database.Database) {
  // Prefer library-provided migration runner
  migrateSqliteRag(rawDb);
}
