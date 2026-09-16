CREATE TABLE `inference_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`investigation_id` text NOT NULL,
	`source_revision` integer NOT NULL,
	`day` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`result` text
);
--> statement-breakpoint
CREATE INDEX `idx_jobs_owner_day` ON `inference_jobs` (`owner_id`,`day`);--> statement-breakpoint
CREATE INDEX `idx_jobs_day` ON `inference_jobs` (`day`);--> statement-breakpoint
CREATE INDEX `idx_jobs_investigation_status` ON `inference_jobs` (`investigation_id`,`status`);