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
/*
 SQLite does not support "Dropping foreign key" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
/*
 SQLite does not support "Set default to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
/*
 SQLite does not support "Drop default from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
/*
 SQLite does not support "Drop not null from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE providers ADD `label` text;--> statement-breakpoint
ALTER TABLE providers ADD `workspace_scope` text DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE providers ADD `status` text DEFAULT 'offline';--> statement-breakpoint
ALTER TABLE providers ADD `last_checked` integer;--> statement-breakpoint
ALTER TABLE conversations ADD `workspace_path` text;--> statement-breakpoint
ALTER TABLE messages ADD `metadata` text;--> statement-breakpoint
CREATE INDEX `idx_messages_conversation` ON `messages` (`conversation_id`);--> statement-breakpoint
ALTER TABLE `providers` DROP COLUMN `metadata`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `tool_call_id`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `parent_message_id`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `tokens`;