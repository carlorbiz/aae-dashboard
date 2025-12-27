import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { chatRouter } from "./routers/chat";
import { knowledgeRouter } from "./routers/knowledge";
import { acrmRouter } from "./routers/acrrm";

export const appRouter = router({
  system: systemRouter,
  chat: chatRouter,
  knowledgeGraph: knowledgeRouter,
  acrrm: acrmRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Platform Integrations
  platforms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPlatformIntegrations(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        platform: z.enum(["notion", "google_drive", "github", "slack", "railway", "docker", "zapier", "mcp", "gamma", "docsautomator"]),
        status: z.enum(["connected", "disconnected", "error"]),
        lastSynced: z.date().optional(),
        metadata: z.any().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPlatformIntegration({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // LLM Metrics
  llm: router({
    metrics: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
      }))
      .query(async ({ ctx, input }) => {
        return db.getLLMMetrics(ctx.user.id, input.days);
      }),
    
    summary: protectedProcedure.query(async ({ ctx }) => {
      return db.getLLMSummary(ctx.user.id);
    }),
    
    addMetric: protectedProcedure
      .input(z.object({
        llmProvider: z.string(),
        modelName: z.string(),
        requestCount: z.number().default(0),
        successCount: z.number().default(0),
        errorCount: z.number().default(0),
        totalTokens: z.number().default(0),
        totalCost: z.number().default(0),
        avgResponseTime: z.number().default(0),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.insertLLMMetric({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Workflows
  workflows: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getWorkflows(ctx.user.id);
    }),
    
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getWorkflowStats(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        workflowType: z.enum(["n8n", "zapier", "mcp"]),
        workflowId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        status: z.enum(["active", "paused", "error", "disabled"]),
        lastRun: z.date().optional(),
        runCount: z.number().default(0),
        successCount: z.number().default(0),
        errorCount: z.number().default(0),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertWorkflow({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Knowledge Lake
  knowledge: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return db.getKnowledgeItems(ctx.user.id, input.limit);
      }),
    
    search: protectedProcedure
      .input(z.object({
        searchTerm: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return db.searchKnowledgeItems(ctx.user.id, input.searchTerm);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        source: z.enum(["notion", "google_drive", "github", "railway"]),
        sourceId: z.string(),
        title: z.string(),
        contentPreview: z.string().optional(),
        url: z.string().optional(),
        itemType: z.string().optional(),
        lastModified: z.date().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertKnowledgeItem({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return db.getNotifications(ctx.user.id, input.limit);
      }),
    
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({
        notificationId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        message: z.string(),
        type: z.enum(["info", "success", "warning", "error"]).default("info"),
        source: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.insertNotification({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
