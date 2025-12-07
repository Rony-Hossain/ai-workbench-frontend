import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

export class DatabaseClient {
  private static instance: DatabaseClient;
  private sqlite: Database.Database;
  public db: ReturnType<typeof drizzle<typeof schema>>;

  private constructor(dbPath: string = 'workbench.db') {
    this.sqlite = new Database(dbPath);
    this.sqlite.pragma('foreign_keys = ON');
    this.db = drizzle(this.sqlite, { schema });
  }

  static getInstance(dbPath?: string): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient(dbPath);
    }
    return DatabaseClient.instance;
  }

  close(): void {
    this.sqlite.close();
  }

  // Helper to execute raw SQL
  execute(sql: string): void {
    this.sqlite.exec(sql);
  }
}

export const db = DatabaseClient.getInstance().db;
