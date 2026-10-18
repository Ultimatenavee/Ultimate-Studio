CREATE TABLE `topology_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`project_json` text NOT NULL,
	`device_count` integer NOT NULL,
	`link_count` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_topology_templates_created` ON `topology_templates` (`created_at`);