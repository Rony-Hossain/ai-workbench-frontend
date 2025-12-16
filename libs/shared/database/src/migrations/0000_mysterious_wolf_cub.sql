CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`type` text NOT NULL,
	`endpoint` text,
	`api_key` text,
	`models` text DEFAULT '[]' NOT NULL,
	`workspace_scope` text DEFAULT '"global"' NOT NULL,
	`status` text DEFAULT 'offline',
	`last_checked` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `role_mappings` (
	`workspace_id` text NOT NULL,
	`role` text NOT NULL,
	`provider_id` text NOT NULL,
	`model_id` text NOT NULL,
	`fallback_model_id` text,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`role`, `workspace_id`),
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'executor' NOT NULL,
	`model_id` text NOT NULL,
	`system_prompt` text NOT NULL,
	`temperature` real DEFAULT 0.7 NOT NULL,
	`tools` text NOT NULL,
	`metadata` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `project_agents` (
	`project_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`role` text DEFAULT 'contributor' NOT NULL,
	`assigned_at` integer NOT NULL,
	`hours_worked` real DEFAULT 0 NOT NULL,
	`metadata` text,
	PRIMARY KEY(`agent_id`, `project_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`repository_path` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`trigger_message_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 2 NOT NULL,
	`run_after` integer,
	`started_at` integer,
	`finished_at` integer,
	`last_error` text,
	`trace_id` text,
	`locked_by` text,
	`locked_at` integer,
	`lock_expires_at` integer,
	`lease_ms` integer DEFAULT 30000 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trigger_message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`workspace_path` text DEFAULT null,
	`workspace_root` text DEFAULT null,
	`agent_ids` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`permission_type` text NOT NULL,
	`request` text NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	`decision_reason` text,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_status_run_after` ON `tasks` (`status`,`run_after`);--> statement-breakpoint
CREATE INDEX `idx_tasks_conversation` ON `tasks` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tasks_agent_status` ON `tasks` (`agent_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_lock_expires` ON `tasks` (`lock_expires_at`);--> statement-breakpoint
CREATE INDEX `idx_messages_conversation` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_permissions_status_created` ON `permissions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_permissions_conversation` ON `permissions` (`conversation_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_permissions_task` ON `permissions` (`task_id`);