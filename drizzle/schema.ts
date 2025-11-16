import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Platform integrations - stores connection status and metadata
 */
export const platformIntegrations = mysqlTable("platform_integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["notion", "google_drive", "github", "slack", "railway", "docker", "zapier", "mcp"]).notNull(),
  status: mysqlEnum("status", ["connected", "disconnected", "error"]).default("disconnected").notNull(),
  lastSynced: timestamp("lastSynced"),
  metadata: json("metadata"), // Store platform-specific config
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformIntegration = typeof platformIntegrations.$inferSelect;
export type InsertPlatformIntegration = typeof platformIntegrations.$inferInsert;

/**
 * LLM performance metrics - tracks LLM usage and performance
 */
export const llmMetrics = mysqlTable("llm_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  llmProvider: varchar("llmProvider", { length: 100 }).notNull(), // e.g., "openai", "anthropic", "google"
  modelName: varchar("modelName", { length: 100 }).notNull(), // e.g., "gpt-4", "claude-3"
  requestCount: int("requestCount").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  errorCount: int("errorCount").default(0).notNull(),
  totalTokens: int("totalTokens").default(0).notNull(),
  totalCost: int("totalCost").default(0).notNull(), // Store in cents to avoid decimal
  avgResponseTime: int("avgResponseTime").default(0).notNull(), // milliseconds
  date: timestamp("date").notNull(), // Daily aggregation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LLMMetric = typeof llmMetrics.$inferSelect;
export type InsertLLMMetric = typeof llmMetrics.$inferInsert;

/**
 * Workflow automations - tracks n8n and Zapier workflows
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workflowType: mysqlEnum("workflowType", ["n8n", "zapier", "mcp"]).notNull(),
  workflowId: varchar("workflowId", { length: 255 }).notNull(), // External workflow ID
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "paused", "error", "disabled"]).default("active").notNull(),
  lastRun: timestamp("lastRun"),
  runCount: int("runCount").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  errorCount: int("errorCount").default(0).notNull(),
  metadata: json("metadata"), // Store workflow-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Knowledge Lake items - cached references to knowledge base content
 */
export const knowledgeItems = mysqlTable("knowledge_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  source: mysqlEnum("source", ["notion", "google_drive", "github", "railway"]).notNull(),
  sourceId: varchar("sourceId", { length: 255 }).notNull(), // External item ID
  title: varchar("title", { length: 500 }).notNull(),
  contentPreview: text("contentPreview"), // First 500 chars
  url: varchar("url", { length: 1000 }),
  itemType: varchar("itemType", { length: 100 }), // e.g., "document", "page", "repository"
  lastModified: timestamp("lastModified"),
  metadata: json("metadata"), // Store source-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type InsertKnowledgeItem = typeof knowledgeItems.$inferInsert;

/**
 * System notifications - internal notifications for the dashboard
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  source: varchar("source", { length: 100 }), // e.g., "slack", "github", "workflow"
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
