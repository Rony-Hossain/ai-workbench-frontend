import { DatabaseClient } from '@ai-workbench-frontend/database';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  console.log('Applying migration manually...');
  const dbClient = DatabaseClient.getInstance();
  
  try {
    const migrationFile = path.join(__dirname, 'migrations', '0001_manual_fix.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    const statements = sql.split('--> statement-breakpoint');
    
    for (const stmt of statements) {
      const trimmedStmt = stmt.trim();
      if (trimmedStmt) {
        console.log('Executing:', trimmedStmt.substring(0, 100) + '...');
        dbClient.execute(trimmedStmt);
      }
    }
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    dbClient.close();
  }
}

applyMigration();
