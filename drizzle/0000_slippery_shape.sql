CREATE TABLE `investigations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_investigations_owner_updated` ON `investigations` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `quotas` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
