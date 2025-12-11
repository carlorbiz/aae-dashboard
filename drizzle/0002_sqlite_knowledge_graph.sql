-- SQLite-compatible migration for D1
-- Converted from MySQL enums to TEXT with CHECK constraints

CREATE TABLE `entities` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` INTEGER NOT NULL,
	`entityType` TEXT NOT NULL CHECK (`entityType` IN ('Consulting','ExecutiveAI','Agents','Content','Technology','ClientIntelligence')),
	`name` TEXT NOT NULL,
	`description` TEXT,
	`semanticState` TEXT NOT NULL DEFAULT 'RAW' CHECK (`semanticState` IN ('RAW','DRAFT','COOKED','CANONICAL')),
	`properties` TEXT,
	`sourceType` TEXT,
	`sourceId` TEXT,
	`sourceUrl` TEXT,
	`createdAt` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
	`updatedAt` INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE `relationships` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fromEntityId` INTEGER NOT NULL,
	`toEntityId` INTEGER NOT NULL,
	`relationshipType` TEXT NOT NULL,
	`weight` INTEGER NOT NULL DEFAULT 1,
	`semanticState` TEXT NOT NULL DEFAULT 'RAW' CHECK (`semanticState` IN ('RAW','DRAFT','COOKED','CANONICAL')),
	`properties` TEXT,
	`createdAt` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
	`updatedAt` INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE `semantic_history` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entityId` INTEGER,
	`relationshipId` INTEGER,
	`previousState` TEXT NOT NULL CHECK (`previousState` IN ('RAW','DRAFT','COOKED','CANONICAL')),
	`newState` TEXT NOT NULL CHECK (`newState` IN ('RAW','DRAFT','COOKED','CANONICAL')),
	`changedBy` INTEGER NOT NULL,
	`reason` TEXT,
	`metadata` TEXT,
	`createdAt` INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for common queries
CREATE INDEX idx_entities_userId ON entities(userId);
CREATE INDEX idx_entities_entityType ON entities(entityType);
CREATE INDEX idx_entities_semanticState ON entities(semanticState);
CREATE INDEX idx_relationships_fromEntityId ON relationships(fromEntityId);
CREATE INDEX idx_relationships_toEntityId ON relationships(toEntityId);
CREATE INDEX idx_semantic_history_entityId ON semantic_history(entityId);
CREATE INDEX idx_semantic_history_relationshipId ON semantic_history(relationshipId);
