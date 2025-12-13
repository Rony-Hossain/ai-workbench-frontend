import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev'; // <--- USE THIS

let dbInstance: Database.Database | null = null;

export const initDatabase = () => {
  if (dbInstance) return dbInstance;

  let dbPath = '';

  // 1. RELIABLE PATH SELECTION
  if (isDev) {
    // In Dev: Use the project root (where you run npm run db:push)
    // We assume the process is running from the workspace root
    dbPath = path.resolve(process.cwd(), 'workbench.db');
    console.log('\n🔵 [DATABASE] MODE: DEVELOPMENT');
    console.log(`🔵 [DATABASE] PATH: ${dbPath}`);
  } else {
    // In Prod: Use the safe OS User Data folder
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    dbPath = path.join(userDataPath, 'workbench.db');
    console.log('\n🟢 [DATABASE] MODE: PRODUCTION');
    console.log(`🟢 [DATABASE] PATH: ${dbPath}`);
  }

  // 2. CONNECT
  try {
    dbInstance = new Database(dbPath);
  } catch (e) {
    console.error(`🔥 [DATABASE] FAILED to open: ${dbPath}`, e);
    throw e;
  }
  
  // 3. LOAD EXTENSIONS
  try {
    sqliteVec.load(dbInstance);
    console.log('✅ [DATABASE] Vectors Loaded');
  } catch (e) {
    console.warn('⚠️ [DATABASE] Vectors Disabled (Load Failed)');
  }

  // 4. CHECK INTEGRITY (Quick Sanity Check)
  try {
    const tableCheck = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='providers'").get();
    if (!tableCheck) {
      console.error('❌ [DATABASE] CRITICAL: Table "providers" not found!');
      console.error('   -> Run "npm run db:push" to fix the schema.');
    } else {
      console.log('✅ [DATABASE] Schema Verified (Providers table exists)');
    }
  } catch (e) { /* ignore */ }

  dbInstance.pragma('journal_mode = WAL');
  
  return dbInstance;
};

export const db = initDatabase();