import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  createProject,
  getProjectsByUserId,
  getProjectById,
  updateProject,
  deleteProject,
  insertHealthCheck,
  getHealthChecksByProjectId,
  getLatestHealthChecksByProject,
  getHealthChecksSince,
  createIncident,
  getIncidentsByProjectId,
  getOpenIncidents,
  updateIncident,
  resolveIncident
} from "../db";
import axios from "axios";

/**
 * Projects Router - Manage PWAs and commercial projects with health monitoring
 */
export const projectsRouter = router({
  /**
   * List all projects for the authenticated user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id || 1;
    return getProjectsByUserId(userId);
  }),

  /**
   * Get a single project by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getProjectById(input.id);
    }),

  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["pwa_app", "pwa_course", "api_service", "other"]),
        status: z.enum(["planning", "development", "testing", "production", "maintenance", "archived"]).default("development"),
        description: z.string().optional(),
        productionUrl: z.string().url().optional(),
        stagingUrl: z.string().url().optional(),
        repositoryUrl: z.string().url().optional(),
        knowledgeLakeEnabled: z.boolean().default(true),
        neraAIEnabled: z.boolean().default(true),
        healthCheckUrl: z.string().url().optional(),
        healthCheckInterval: z.number().min(60).max(3600).default(300), // 1 min to 1 hour
        techStack: z.array(z.string()).optional(),
        platform: z.string().optional(),
        launchDate: z.date().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1;

      return createProject({
        userId,
        name: input.name,
        type: input.type,
        status: input.status,
        description: input.description,
        productionUrl: input.productionUrl,
        stagingUrl: input.stagingUrl,
        repositoryUrl: input.repositoryUrl,
        knowledgeLakeEnabled: input.knowledgeLakeEnabled,
        neraAIEnabled: input.neraAIEnabled,
        healthCheckUrl: input.healthCheckUrl,
        healthCheckInterval: input.healthCheckInterval,
        techStack: input.techStack,
        platform: input.platform,
        launchDate: input.launchDate,
        metadata: input.metadata,
        currentHealthStatus: "unknown",
      });
    }),

  /**
   * Update an existing project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        type: z.enum(["pwa_app", "pwa_course", "api_service", "other"]).optional(),
        status: z.enum(["planning", "development", "testing", "production", "maintenance", "archived"]).optional(),
        description: z.string().optional(),
        productionUrl: z.string().url().optional(),
        stagingUrl: z.string().url().optional(),
        repositoryUrl: z.string().url().optional(),
        knowledgeLakeEnabled: z.boolean().optional(),
        neraAIEnabled: z.boolean().optional(),
        healthCheckUrl: z.string().url().optional(),
        healthCheckInterval: z.number().min(60).max(3600).optional(),
        currentHealthStatus: z.enum(["healthy", "degraded", "down", "unknown"]).optional(),
        techStack: z.array(z.string()).optional(),
        platform: z.string().optional(),
        launchDate: z.date().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return updateProject(id, updates);
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteProject(input.id);
      return { success: true };
    }),

  /**
   * Run health check on a project manually
   */
  runHealthCheck: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const project = await getProjectById(input.projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      const checks = [];

      // 1. Uptime check
      if (project.productionUrl) {
        try {
          const start = Date.now();
          const response = await axios.get(project.productionUrl, {
            timeout: 10000,
            validateStatus: () => true, // Accept any status code
          });
          const responseTime = Date.now() - start;

          await insertHealthCheck({
            projectId: project.id,
            checkType: "uptime",
            status: response.status >= 200 && response.status < 400 ? "healthy" : "down",
            responseTime,
            statusCode: response.status,
            testDetails: { url: project.productionUrl },
          });

          checks.push({ type: "uptime", status: "completed" });
        } catch (error: any) {
          await insertHealthCheck({
            projectId: project.id,
            checkType: "uptime",
            status: "down",
            errorMessage: error.message,
            testDetails: { url: project.productionUrl, error: error.message },
          });

          checks.push({ type: "uptime", status: "failed", error: error.message });
        }
      }

      // 2. Knowledge Lake Read check
      if (project.knowledgeLakeEnabled && project.productionUrl) {
        try {
          const healthUrl = project.healthCheckUrl || `${project.productionUrl}/api/health/knowledge-lake`;
          const start = Date.now();
          const response = await axios.get(healthUrl, { timeout: 10000 });
          const responseTime = Date.now() - start;

          const status = response.data?.knowledgeLake?.canRead ? "healthy" : "degraded";

          await insertHealthCheck({
            projectId: project.id,
            checkType: "knowledge_lake_read",
            status,
            responseTime,
            statusCode: response.status,
            testDetails: response.data,
          });

          checks.push({ type: "knowledge_lake_read", status: "completed" });
        } catch (error: any) {
          await insertHealthCheck({
            projectId: project.id,
            checkType: "knowledge_lake_read",
            status: "down",
            errorMessage: error.message,
            testDetails: { error: error.message },
          });

          checks.push({ type: "knowledge_lake_read", status: "failed", error: error.message });
        }
      }

      // 3. Knowledge Lake Write check
      if (project.knowledgeLakeEnabled && project.productionUrl) {
        try {
          const healthUrl = project.healthCheckUrl || `${project.productionUrl}/api/health/knowledge-lake`;
          const start = Date.now();
          const response = await axios.get(healthUrl, { timeout: 10000 });
          const responseTime = Date.now() - start;

          const status = response.data?.knowledgeLake?.canWrite ? "healthy" : "degraded";

          await insertHealthCheck({
            projectId: project.id,
            checkType: "knowledge_lake_write",
            status,
            responseTime,
            statusCode: response.status,
            testDetails: response.data,
          });

          checks.push({ type: "knowledge_lake_write", status: "completed" });
        } catch (error: any) {
          await insertHealthCheck({
            projectId: project.id,
            checkType: "knowledge_lake_write",
            status: "down",
            errorMessage: error.message,
            testDetails: { error: error.message },
          });

          checks.push({ type: "knowledge_lake_write", status: "failed", error: error.message });
        }
      }

      // 4. Nera AI availability check
      if (project.neraAIEnabled && project.productionUrl) {
        try {
          const healthUrl = project.healthCheckUrl || `${project.productionUrl}/api/health/nera-ai`;
          const start = Date.now();
          const response = await axios.get(healthUrl, { timeout: 10000 });
          const responseTime = Date.now() - start;

          const status = response.data?.neraAI?.available ? "healthy" : "down";

          await insertHealthCheck({
            projectId: project.id,
            checkType: "nera_ai_availability",
            status,
            responseTime,
            statusCode: response.status,
            testDetails: response.data,
          });

          checks.push({ type: "nera_ai_availability", status: "completed" });
        } catch (error: any) {
          await insertHealthCheck({
            projectId: project.id,
            checkType: "nera_ai_availability",
            status: "down",
            errorMessage: error.message,
            testDetails: { error: error.message },
          });

          checks.push({ type: "nera_ai_availability", status: "failed", error: error.message });
        }
      }

      // Update project's last health check and overall status
      const latestChecks = await getLatestHealthChecksByProject(project.id);
      const hasDown = latestChecks.some(check => check.status === "down");
      const hasDegraded = latestChecks.some(check => check.status === "degraded");

      const overallStatus = hasDown ? "down" : hasDegraded ? "degraded" : "healthy";

      await updateProject(project.id, {
        lastHealthCheck: new Date(),
        currentHealthStatus: overallStatus,
      });

      return {
        success: true,
        checks,
        overallStatus,
        totalChecks: checks.length,
      };
    }),

  /**
   * Get health check history for a project
   */
  getHealthChecks: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        limit: z.number().min(1).max(500).default(50),
      })
    )
    .query(async ({ input }) => {
      return getHealthChecksByProjectId(input.projectId, input.limit);
    }),

  /**
   * Get latest health status for a project
   */
  getLatestHealth: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return getLatestHealthChecksByProject(input.projectId);
    }),

  /**
   * Get health checks for a time range
   */
  getHealthChecksSince: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        since: z.date(),
      })
    )
    .query(async ({ input }) => {
      return getHealthChecksSince(input.projectId, input.since);
    }),

  /**
   * Get all incidents for a project
   */
  getIncidents: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return getIncidentsByProjectId(input.projectId);
    }),

  /**
   * Get all open incidents across all projects
   */
  getOpenIncidents: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id || 1;
    return getOpenIncidents(userId);
  }),

  /**
   * Create a new incident
   */
  createIncident: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        severity: z.enum(["critical", "high", "medium", "low"]),
        affectedFeatures: z.array(z.string()).optional(),
        impactedUsers: z.number().optional(),
        relatedHealthCheckId: z.number().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createIncident({
        ...input,
        status: "open",
      });
    }),

  /**
   * Update an incident
   */
  updateIncident: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["open", "investigating", "identified", "resolved", "closed"]).optional(),
        acknowledgedAt: z.date().optional(),
        rootCause: z.string().optional(),
        resolution: z.string().optional(),
        preventionSteps: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return updateIncident(id, updates);
    }),

  /**
   * Resolve an incident
   */
  resolveIncident: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        resolution: z.string().min(1),
        rootCause: z.string().optional(),
        preventionSteps: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return resolveIncident(
        input.id,
        input.resolution,
        input.rootCause,
        input.preventionSteps
      );
    }),
});
