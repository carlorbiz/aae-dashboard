import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  platformIntegrations,
  InsertPlatformIntegration,
  PlatformIntegration,
  llmMetrics,
  InsertLLMMetric,
  LLMMetric,
  workflows,
  InsertWorkflow,
  Workflow,
  knowledgeItems,
  InsertKnowledgeItem,
  KnowledgeItem,
  notifications,
  InsertNotification,
  Notification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= PLATFORM INTEGRATION FUNCTIONS =============

export async function getPlatformIntegrations(userId: number): Promise<PlatformIntegration[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(platformIntegrations).where(eq(platformIntegrations.userId, userId));
}

export async function upsertPlatformIntegration(integration: InsertPlatformIntegration): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(platformIntegrations).values(integration).onDuplicateKeyUpdate({
    set: {
      status: integration.status,
      lastSynced: integration.lastSynced,
      metadata: integration.metadata,
      errorMessage: integration.errorMessage,
      updatedAt: new Date(),
    }
  });
}

// ============= LLM METRICS FUNCTIONS =============

export async function getLLMMetrics(userId: number, days: number = 30): Promise<LLMMetric[]> {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.select()
    .from(llmMetrics)
    .where(
      and(
        eq(llmMetrics.userId, userId),
        sql`${llmMetrics.date} >= ${startDate}`
      )
    )
    .orderBy(desc(llmMetrics.date));
}

export async function insertLLMMetric(metric: InsertLLMMetric): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(llmMetrics).values(metric);
}

export async function getLLMSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    totalRequests: sql<number>`SUM(${llmMetrics.requestCount})`,
    totalTokens: sql<number>`SUM(${llmMetrics.totalTokens})`,
    totalCost: sql<number>`SUM(${llmMetrics.totalCost})`,
    avgResponseTime: sql<number>`AVG(${llmMetrics.avgResponseTime})`,
  })
  .from(llmMetrics)
  .where(eq(llmMetrics.userId, userId));
  
  return result[0];
}

// ============= WORKFLOW FUNCTIONS =============

export async function getWorkflows(userId: number): Promise<Workflow[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(workflows)
    .where(eq(workflows.userId, userId))
    .orderBy(desc(workflows.updatedAt));
}

export async function upsertWorkflow(workflow: InsertWorkflow): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(workflows).values(workflow).onDuplicateKeyUpdate({
    set: {
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      lastRun: workflow.lastRun,
      runCount: workflow.runCount,
      successCount: workflow.successCount,
      errorCount: workflow.errorCount,
      metadata: workflow.metadata,
      updatedAt: new Date(),
    }
  });
}

export async function getWorkflowStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    totalWorkflows: sql<number>`COUNT(*)`,
    activeWorkflows: sql<number>`SUM(CASE WHEN ${workflows.status} = 'active' THEN 1 ELSE 0 END)`,
    totalRuns: sql<number>`SUM(${workflows.runCount})`,
    totalSuccess: sql<number>`SUM(${workflows.successCount})`,
    totalErrors: sql<number>`SUM(${workflows.errorCount})`,
  })
  .from(workflows)
  .where(eq(workflows.userId, userId));
  
  return result[0];
}

// ============= KNOWLEDGE ITEM FUNCTIONS =============

export async function getKnowledgeItems(userId: number, limit: number = 50): Promise<KnowledgeItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(knowledgeItems)
    .where(eq(knowledgeItems.userId, userId))
    .orderBy(desc(knowledgeItems.lastModified))
    .limit(limit);
}

export async function searchKnowledgeItems(userId: number, searchTerm: string): Promise<KnowledgeItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.userId, userId),
        sql`${knowledgeItems.title} LIKE ${`%${searchTerm}%`}`
      )
    )
    .orderBy(desc(knowledgeItems.lastModified))
    .limit(50);
}

export async function upsertKnowledgeItem(item: InsertKnowledgeItem): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(knowledgeItems).values(item).onDuplicateKeyUpdate({
    set: {
      title: item.title,
      contentPreview: item.contentPreview,
      url: item.url,
      itemType: item.itemType,
      lastModified: item.lastModified,
      metadata: item.metadata,
      updatedAt: new Date(),
    }
  });
}

// ============= NOTIFICATION FUNCTIONS =============

export async function getNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({
    count: sql<number>`COUNT(*)`
  })
  .from(notifications)
  .where(
    and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    )
  );
  
  return result[0]?.count || 0;
}

export async function insertNotification(notification: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(notifications).values(notification);
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
