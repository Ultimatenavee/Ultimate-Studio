CREATE TABLE `design_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`project_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`target` text NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `design_reviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_review_comments_review` ON `review_comments` (`review_id`);--> statement-breakpoint
ALTER TABLE `topology_templates` ADD `metadata_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `topology_templates` ADD `revision` integer DEFAULT 1 NOT NULL;