import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class DBService {
  private db: Database.Database;

  constructor() {
    // 1. Ensure Directory Exists (WSL sometimes acts weird with missing folders)
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'workbench.db');
    console.log('🔌 Database Path:', dbPath);

    this.db = new Database(dbPath);
    
    // 2. Load Vector Extension
    try {
      sqliteVec.load(this.db);
      console.log('✅ sqlite-vec loaded successfully');
    } catch (e) {
      console.error('❌ Failed to load sqlite-vec:', e);
    }
    
    this.init();
  }

  private init() {
    this.db.pragma('journal_mode = WAL');
    
    console.log('🛠️ Initializing Database Schema...');

    // 3. Create Tables (One by one for safer debugging)
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT,
          config TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          title TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT,
          role TEXT,
          content TEXT,
          timestamp INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        );
      `);

      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_vec USING vec0(
          embedding float[768]
        );
      `);
      
      console.log('✅ Schema Initialization Complete.');
    } catch (error) {
      console.error('🔥 FATAL: Schema Migration Failed', error);
    }
  }

  get raw() {
    return this.db;
  }
}

// Export a singleton instance
export const db = new DBService().raw;