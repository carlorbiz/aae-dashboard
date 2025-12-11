CREATE TABLE `entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('Consulting','ExecutiveAI','Agents','Content','Technology','ClientIntelligence') NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`semanticState` enum('RAW','DRAFT','COOKED','CANONICAL') NOT NULL DEFAULT 'RAW',
	`properties` json,
	`sourceType` varchar(100),
	`sourceId` varchar(255),
	`sourceUrl` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromEntityId` int NOT NULL,
	`toEntityId` int NOT NULL,
	`relationshipType` varchar(100) NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`semanticState` enum('RAW','DRAFT','COOKED','CANONICAL') NOT NULL DEFAULT 'RAW',
	`properties` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semantic_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityId` int,
	`relationshipId` int,
	`previousState` enum('RAW','DRAFT','COOKED','CANONICAL') NOT NULL,
	`newState` enum('RAW','DRAFT','COOKED','CANONICAL') NOT NULL,
	`changedBy` int NOT NULL,
	`reason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `semantic_history_id` PRIMARY KEY(`id`)
);
