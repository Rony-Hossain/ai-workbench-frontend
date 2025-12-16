PRAGMA foreign_keys=OFF;
BEGIN;

-- 1) tasks: rebuild without agents_old reference
CREATE TABLE tasks_new (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  trigger_message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' NOT NULL,
  priority INTEGER DEFAULT 0 NOT NULL,
  attempt INTEGER DEFAULT 0 NOT NULL,
  max_attempts INTEGER DEFAULT 2 NOT NULL,
  run_after INTEGER,
  started_at INTEGER,
  finished_at INTEGER,
  last_error TEXT,
  trace_id TEXT,
  locked_by TEXT,
  locked_at INTEGER,
  lock_expires_at INTEGER,
  lease_ms INTEGER DEFAULT 30000 NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO tasks_new
SELECT
  id, conversation_id, agent_id, trigger_message_id, status, priority, attempt, max_attempts,
  run_after, started_at, finished_at, last_error, trace_id, locked_by, locked_at, lock_expires_at,
  lease_ms, created_at, updated_at
FROM tasks;

DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;

-- 2) permissions: rebuild without agents_old reference
CREATE TABLE permissions_new (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' NOT NULL,
  permission_type TEXT NOT NULL,
  request TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolved_by TEXT,
  decision_reason TEXT
);

INSERT INTO permissions_new
SELECT
  id, task_id, conversation_id, agent_id, status, permission_type, request,
  created_at, resolved_at, resolved_by, decision_reason
FROM permissions;

DROP TABLE permissions;
ALTER TABLE permissions_new RENAME TO permissions;

-- 3) project_agents: rebuild without agents_old reference
CREATE TABLE project_agents_new (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'contributor' NOT NULL,
  assigned_at INTEGER NOT NULL,
  hours_worked REAL DEFAULT 0 NOT NULL,
  metadata TEXT,
  PRIMARY KEY(agent_id, project_id)
);

INSERT INTO project_agents_new
SELECT project_id, agent_id, role, assigned_at, hours_worked, metadata
FROM project_agents;

DROP TABLE project_agents;
ALTER TABLE project_agents_new RENAME TO project_agents;

COMMIT;
PRAGMA foreign_keys=ON;
