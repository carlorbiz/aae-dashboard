import { pgTable, pgEnum, serial, text, timestamp, varchar, boolean, json, integer } from "drizzle-orm/pg-core";

// Define PostgreSQL enums
export const userRoleEnum = pgEnum("role", ["user", "admin"]);
export const platformEnum = pgEnum("platform", ["notion", "google_drive", "github", "slack", "railway", "docker", "zapier", "mcp"]);
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
  metadata: json("metadata"), // Store platform-specific config
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
  metadata: json("metadata"), // Store workflow-specific data
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
  metadata: json("metadata"), // Store source-specific data
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
  metadata: json("metadata"),
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
  properties: json("properties"), // Entity-specific metadata
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
  properties: json("properties"), // Relationship-specific metadata
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
  metadata: json("metadata"), // Additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SemanticHistory = typeof semanticHistory.$inferSelect;
export type InsertSemanticHistory = typeof semanticHistory.$inferInsert;

/**
 * Projects - Commercial PWAs (apps and courses)
 */
export const projectTypeEnum = pgEnum("project_type", ["pwa_app", "pwa_course", "api_service", "other"]);
export const projectStatusEnum = pgEnum("project_status", ["planning", "development", "testing", "production", "maintenance", "archived"]);
export const healthStatusEnum = pgEnum("health_status", ["healthy", "degraded", "down", "unknown"]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: projectTypeEnum("type").notNull(),
  status: projectStatusEnum("status").default("development").notNull(),
  description: text("description"),

  // URLs and endpoints
  productionUrl: varchar("productionUrl", { length: 1000 }),
  stagingUrl: varchar("stagingUrl", { length: 1000 }),
  repositoryUrl: varchar("repositoryUrl", { length: 1000 }),

  // Critical integrations
  knowledgeLakeEnabled: boolean("knowledgeLakeEnabled").default(true).notNull(),
  neraAIEnabled: boolean("neraAIEnabled").default(true).notNull(),

  // Health monitoring
  healthCheckUrl: varchar("healthCheckUrl", { length: 1000 }), // /health or /api/health endpoint
  healthCheckInterval: integer("healthCheckInterval").default(300), // seconds (5 min default)
  lastHealthCheck: timestamp("lastHealthCheck"),
  currentHealthStatus: healthStatusEnum("currentHealthStatus").default("unknown").notNull(),

  // Metadata
  techStack: json("techStack"), // Array of technologies
  platform: varchar("platform", { length: 100 }), // e.g., "Vercel", "Railway", "Cloudflare Pages"
  launchDate: timestamp("launchDate"),
  metadata: json("metadata"), // Flexible additional data

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Health Checks - Results of automated health monitoring
 */
export const checkTypeEnum = pgEnum("check_type", [
  "uptime",                    // Basic HTTP uptime check
  "knowledge_lake_read",       // Can read from Knowledge Lake
  "knowledge_lake_write",      // Can write to Knowledge Lake
  "nera_ai_availability",      // Nera/Aurelia AI responding
  "nera_ai_quality",          // AI response quality check
  "authentication",            // Auth flow working
  "api_latency",              // Response time check
  "database_connection",       // DB connectivity
  "full_integration"          // End-to-end test
]);

export const healthChecks = pgTable("health_checks", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  checkType: checkTypeEnum("checkType").notNull(),
  status: healthStatusEnum("status").notNull(),

  // Test results
  responseTime: integer("responseTime"), // milliseconds
  statusCode: integer("statusCode"), // HTTP status code
  errorMessage: text("errorMessage"),

  // Detailed results
  testDetails: json("testDetails"), // Store test-specific data

  // Timestamps
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
});

export type HealthCheck = typeof healthChecks.$inferSelect;
export type InsertHealthCheck = typeof healthChecks.$inferInsert;

/**
 * Incidents - Track problems and downtime
 */
export const incidentSeverityEnum = pgEnum("incident_severity", ["critical", "high", "medium", "low"]);
export const incidentStatusEnum = pgEnum("incident_status", ["open", "investigating", "identified", "resolved", "closed"]);

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  severity: incidentSeverityEnum("severity").notNull(),
  status: incidentStatusEnum("status").default("open").notNull(),

  // Impact tracking
  affectedFeatures: json("affectedFeatures"), // Array of feature names
  impactedUsers: integer("impactedUsers"), // Estimated number

  // Timeline
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),

  // Resolution
  rootCause: text("rootCause"),
  resolution: text("resolution"),
  preventionSteps: text("preventionSteps"),

  // Related data
  relatedHealthCheckId: integer("relatedHealthCheckId"),
  metadata: json("metadata"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;
