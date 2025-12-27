import { pgTable, pgEnum, serial, text, timestamp, varchar, boolean, jsonb, integer } from "drizzle-orm/pg-core";

// Define PostgreSQL enums
export const userRoleEnum = pgEnum("role", ["user", "admin"]);
export const platformEnum = pgEnum("platform", ["notion", "google_drive", "github", "slack", "railway", "docker", "zapier", "mcp", "gamma", "docsautomator"]);
export const integrationStatusEnum = pgEnum("integration_status", ["connected", "disconnected", "error"]);
export const workflowTypeEnum = pgEnum("workflow_type", ["n8n", "zapier", "mcp"]);
export const workflowStatusEnum = pgEnum("workflow_status", ["active", "paused", "error", "disabled"]);
export const sourceEnum = pgEnum("source", ["notion", "google_drive", "github", "railway"]);
export const notificationTypeEnum = pgEnum("notification_type", ["info", "success", "warning", "error"]);
export const entityTypeEnum = pgEnum("entity_type", ["Consulting", "ExecutiveAI", "Agents", "Content", "Technology", "ClientIntelligence"]);
export const semanticStateEnum = pgEnum("semantic_state", ["RAW", "DRAFT", "COOKED", "CANONICAL"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Platform integrations - stores connection status and metadata
 */
export const platformIntegrations = pgTable("platform_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  platform: platformEnum("platform").notNull(),
  status: integrationStatusEnum("status").default("disconnected").notNull(),
  lastSynced: timestamp("lastSynced"),
  metadata: jsonb("metadata"), // Store platform-specific config
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PlatformIntegration = typeof platformIntegrations.$inferSelect;
export type InsertPlatformIntegration = typeof platformIntegrations.$inferInsert;

/**
 * LLM performance metrics - tracks LLM usage and performance
 */
export const llmMetrics = pgTable("llm_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  llmProvider: varchar("llmProvider", { length: 100 }).notNull(), // e.g., "openai", "anthropic", "google"
  modelName: varchar("modelName", { length: 100 }).notNull(), // e.g., "gpt-4", "claude-3"
  requestCount: integer("requestCount").default(0).notNull(),
  successCount: integer("successCount").default(0).notNull(),
  errorCount: integer("errorCount").default(0).notNull(),
  totalTokens: integer("totalTokens").default(0).notNull(),
  totalCost: integer("totalCost").default(0).notNull(), // Store in cents to avoid decimal
  avgResponseTime: integer("avgResponseTime").default(0).notNull(), // milliseconds
  date: timestamp("date").notNull(), // Daily aggregation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LLMMetric = typeof llmMetrics.$inferSelect;
export type InsertLLMMetric = typeof llmMetrics.$inferInsert;

/**
 * Workflow automations - tracks n8n and Zapier workflows
 */
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  workflowType: workflowTypeEnum("workflowType").notNull(),
  workflowId: varchar("workflowId", { length: 255 }).notNull(), // External workflow ID
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: workflowStatusEnum("status").default("active").notNull(),
  lastRun: timestamp("lastRun"),
  runCount: integer("runCount").default(0).notNull(),
  successCount: integer("successCount").default(0).notNull(),
  errorCount: integer("errorCount").default(0).notNull(),
  metadata: jsonb("metadata"), // Store workflow-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Knowledge Lake items - cached references to knowledge base content
 */
export const knowledgeItems = pgTable("knowledge_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  source: sourceEnum("source").notNull(),
  sourceId: varchar("sourceId", { length: 255 }).notNull(), // External item ID
  title: varchar("title", { length: 500 }).notNull(),
  contentPreview: text("contentPreview"), // First 500 chars
  url: varchar("url", { length: 1000 }),
  itemType: varchar("itemType", { length: 100 }), // e.g., "document", "page", "repository"
  lastModified: timestamp("lastModified"),
  metadata: jsonb("metadata"), // Store source-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type InsertKnowledgeItem = typeof knowledgeItems.$inferInsert;

/**
 * System notifications - internal notifications for the dashboard
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  source: varchar("source", { length: 100 }), // e.g., "slack", "github", "workflow"
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Knowledge Graph Entities - core nodes in the semantic network
 */
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  entityType: entityTypeEnum("entityType").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  semanticState: semanticStateEnum("semanticState").default("RAW").notNull(),
  properties: jsonb("properties"), // Entity-specific metadata
  sourceType: varchar("sourceType", { length: 100 }), // e.g., "transcript", "notion_page", "github_issue"
  sourceId: varchar("sourceId", { length: 255 }), // External ID in source system
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Entity = typeof entities.$inferSelect;
export type InsertEntity = typeof entities.$inferInsert;

/**
 * Knowledge Graph Relationships - edges connecting entities
 */
export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  fromEntityId: integer("fromEntityId").notNull(),
  toEntityId: integer("toEntityId").notNull(),
  relationshipType: varchar("relationshipType", { length: 100 }).notNull(), // e.g., "mentions", "depends_on", "created_by", "related_to"
  weight: integer("weight").default(1).notNull(), // Relationship strength (1-10)
  semanticState: semanticStateEnum("semanticState").default("RAW").notNull(),
  properties: jsonb("properties"), // Relationship-specific metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = typeof relationships.$inferInsert;

/**
 * Semantic History - audit trail of semantic state transitions
 */
export const semanticHistory = pgTable("semantic_history", {
  id: serial("id").primaryKey(),
  entityId: integer("entityId"),
  relationshipId: integer("relationshipId"),
  previousState: semanticStateEnum("previousState").notNull(),
  newState: semanticStateEnum("newState").notNull(),
  changedBy: integer("changedBy").notNull(), // userId who made the change
  reason: text("reason"), // Why the transition occurred
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SemanticHistory = typeof semanticHistory.$inferSelect;
export type InsertSemanticHistory = typeof semanticHistory.$inferInsert;
