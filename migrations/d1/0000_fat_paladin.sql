CREATE TABLE `knowledge_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`source` text NOT NULL,
	`sourceId` text NOT NULL,
	`title` text NOT NULL,
	`contentPreview` text,
	`url` text,
	`itemType` text,
	`lastModified` integer,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `llm_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`llmProvider` text NOT NULL,
	`modelName` text NOT NULL,
	`requestCount` integer DEFAULT 0 NOT NULL,
	`successCount` integer DEFAULT 0 NOT NULL,
	`errorCount` integer DEFAULT 0 NOT NULL,
	`totalTokens` integer DEFAULT 0 NOT NULL,
	`totalCost` integer DEFAULT 0 NOT NULL,
	`avgResponseTime` integer DEFAULT 0 NOT NULL,
	`date` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`isRead` integer DEFAULT false NOT NULL,
	`source` text,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`platform` text NOT NULL,
	`status` text DEFAULT 'disconnected' NOT NULL,
	`lastSynced` integer,
	`metadata` text,
	`errorMessage` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`workflowType` text NOT NULL,
	`workflowId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`lastRun` integer,
	`runCount` integer DEFAULT 0 NOT NULL,
	`successCount` integer DEFAULT 0 NOT NULL,
	`errorCount` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
