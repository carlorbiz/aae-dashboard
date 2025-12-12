CREATE TYPE "public"."entity_type" AS ENUM('Consulting', 'ExecutiveAI', 'Agents', 'Content', 'Technology', 'ClientIntelligence');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'error');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('notion', 'google_drive', 'github', 'slack', 'railway', 'docker', 'zapier', 'mcp');--> statement-breakpoint
CREATE TYPE "public"."semantic_state" AS ENUM('RAW', 'DRAFT', 'COOKED', 'CANONICAL');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('notion', 'google_drive', 'github', 'railway');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('active', 'paused', 'error', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."workflow_type" AS ENUM('n8n', 'zapier', 'mcp');--> statement-breakpoint
CREATE TABLE "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"entityType" "entity_type" NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" text,
	"semanticState" "semantic_state" DEFAULT 'RAW' NOT NULL,
	"properties" json,
	"sourceType" varchar(100),
	"sourceId" varchar(255),
	"sourceUrl" varchar(1000),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"source" "source" NOT NULL,
	"sourceId" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"contentPreview" text,
	"url" varchar(1000),
	"itemType" varchar(100),
	"lastModified" timestamp,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"llmProvider" varchar(100) NOT NULL,
	"modelName" varchar(100) NOT NULL,
	"requestCount" integer DEFAULT 0 NOT NULL,
	"successCount" integer DEFAULT 0 NOT NULL,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"totalTokens" integer DEFAULT 0 NOT NULL,
	"totalCost" integer DEFAULT 0 NOT NULL,
	"avgResponseTime" integer DEFAULT 0 NOT NULL,
	"date" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"source" varchar(100),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"platform" "platform" NOT NULL,
	"status" "integration_status" DEFAULT 'disconnected' NOT NULL,
	"lastSynced" timestamp,
	"metadata" json,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromEntityId" integer NOT NULL,
	"toEntityId" integer NOT NULL,
	"relationshipType" varchar(100) NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"semanticState" "semantic_state" DEFAULT 'RAW' NOT NULL,
	"properties" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semantic_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"entityId" integer,
	"relationshipId" integer,
	"previousState" "semantic_state" NOT NULL,
	"newState" "semantic_state" NOT NULL,
	"changedBy" integer NOT NULL,
	"reason" text,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"workflowType" "workflow_type" NOT NULL,
	"workflowId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "workflow_status" DEFAULT 'active' NOT NULL,
	"lastRun" timestamp,
	"runCount" integer DEFAULT 0 NOT NULL,
	"successCount" integer DEFAULT 0 NOT NULL,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
