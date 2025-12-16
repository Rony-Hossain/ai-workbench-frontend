// apps/workbench-desktop/src/api/database.ts
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@ai-workbench/shared/database';
import { migrateRag } from './rag/rag-migrate';

let dbInstance: Database.Database | null = null;

export const initDatabase = () => {
  if (dbInstance) return dbInstance;

  let dbPath = '';

  if (isDev) {
    dbPath = path.resolve(process.cwd(), 'workbench.db');
    console.log('\n🔵 [DATABASE] MODE: DEVELOPMENT');
    console.log(`🔵 [DATABASE] PATH: ${dbPath}`);
  } else {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
    dbPath = path.join(userDataPath, 'workbench.db');
    console.log('\n🟢 [DATABASE] MODE: PRODUCTION');
    console.log(`🟢 [DATABASE] PATH: ${dbPath}`);
  }

  dbInstance = new Database(dbPath);

  try {
    sqliteVec.load(dbInstance);
    console.log('✅ [DATABASE] Vectors Loaded');
  } catch {
    console.warn('⚠️ [DATABASE] Vectors Disabled (Load Failed)');
  }

  dbInstance.pragma('journal_mode = WAL');

  migrateRag(dbInstance);

  return dbInstance;
};

// ✅ rawDb = better-sqlite3
export const rawDb = initDatabase();

// ✅ db = Drizzle
export const db = drizzle(rawDb, { schema });
