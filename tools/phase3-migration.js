const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'workbench.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Applying Phase 3 Migration...');

try {
  console.log('Creating tasks table...');
  const createTasks = db.transaction(() => {
    db.exec("CREATE TABLE IF NOT EXISTS `tasks` (`id` text PRIMARY KEY NOT NULL, `conversation_id` text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, `agent_id` text NOT NULL REFERENCES agents(id) ON DELETE CASCADE, `trigger_message_id` text NOT NULL REFERENCES messages(id) ON DELETE CASCADE, `status` text DEFAULT 'pending' NOT NULL, `priority` integer DEFAULT 0 NOT NULL, `attempt` integer DEFAULT 0 NOT NULL, `max_attempts` integer DEFAULT 2 NOT NULL, `run_after` integer, `started_at` integer, `finished_at` integer, `last_error` text, `trace_id` text, `locked_by` text, `locked_at` integer, `lease_ms` integer DEFAULT 30000 NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL);");
    
    const tableInfo = db.prepare('PRAGMA table_info(tasks)').all();
    console.log('PRAGMA table_info(tasks):', tableInfo);

    db.exec("CREATE INDEX IF NOT EXISTS `idx_tasks_status_run_after` ON `tasks` (`status`, `run_after`);");
    db.exec("CREATE INDEX IF NOT EXISTS `idx_tasks_conversation` ON `tasks` (`conversation_id`, `created_at`);");
    db.exec("CREATE INDEX IF NOT EXISTS `idx_tasks_agent_status` ON `tasks` (`agent_id`, `status`);");
    db.exec("CREATE INDEX IF NOT EXISTS `idx_tasks_locked_at` ON `tasks` (`locked_at`);");
  });
  createTasks();
  console.log('Tasks table created successfully.');

  console.log('Re-creating permissions table...');
  const createPermissions = db.transaction(() => {
    db.exec("DROP TABLE IF EXISTS `permissions`;");
    db.exec("CREATE TABLE `permissions` (`id` text PRIMARY KEY NOT NULL, `task_id` text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, `conversation_id` text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, `agent_id` text NOT NULL REFERENCES agents(id) ON DELETE CASCADE, `status` text DEFAULT 'pending' NOT NULL, `permission_type` text NOT NULL, `request` text NOT NULL, `created_at` integer NOT NULL, `resolved_at` integer, `resolved_by` text, `decision_reason` text);");
    db.exec("CREATE INDEX IF NOT EXISTS `idx_permissions_status_created` ON `permissions` (`status`, `created_at`);");
    db.exec("CREATE INDEX IF NOT EXISTS `idx_permissions_conversation` ON `permissions` (`conversation_id`, `status`);");
    db.exec("CREATE INDEX IF NOT EXISTS `idx_permissions_task` ON `permissions` (`task_id`);");
  });
  createPermissions();
  console.log('Permissions table re-created successfully.');

  console.log('Migration complete!');
} catch (err) {
  console.error('Error during migration:', err.message);
  process.exit(1);
} finally {
  db.close();
}