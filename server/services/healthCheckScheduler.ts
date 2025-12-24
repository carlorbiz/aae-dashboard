import cron from 'node-cron';
import axios from 'axios';
import {
  getProjectsByUserId,
  getProjectById,
  updateProject,
  insertHealthCheck,
  getLatestHealthChecksByProject,
  createIncident,
  getOpenIncidents
} from '../db';

/**
 * Health Check Scheduler
 *
 * Automatically runs health checks on all projects based on their configured intervals.
 * Runs every minute and checks if any projects are due for a health check.
 */

let schedulerTask: cron.ScheduledTask | null = null;
let isRunning = false;

/**
 * Run health check for a single project
 */
async function runHealthCheckForProject(projectId: number) {
  try {
    const project = await getProjectById(projectId);
    if (!project) {
      console.error(`[Health Scheduler] Project ${projectId} not found`);
      return;
    }

    console.log(`[Health Scheduler] Running health check for project: ${project.name}`);

    const checks = [];

    // 1. Uptime check
    if (project.productionUrl) {
      try {
        const start = Date.now();
        const response = await axios.get(project.productionUrl, {
          timeout: 10000,
          validateStatus: () => true,
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

        // Create incident for uptime failure
        await createIncidentIfNeeded(project.id, "uptime", error.message);
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

        if (status === "degraded") {
          await createIncidentIfNeeded(project.id, "knowledge_lake_read", "Knowledge Lake read capability degraded");
        }
      } catch (error: any) {
        await insertHealthCheck({
          projectId: project.id,
          checkType: "knowledge_lake_read",
          status: "down",
          errorMessage: error.message,
          testDetails: { error: error.message },
        });

        checks.push({ type: "knowledge_lake_read", status: "failed", error: error.message });
        await createIncidentIfNeeded(project.id, "knowledge_lake_read", error.message);
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

        if (status === "degraded") {
          await createIncidentIfNeeded(project.id, "knowledge_lake_write", "Knowledge Lake write capability degraded");
        }
      } catch (error: any) {
        await insertHealthCheck({
          projectId: project.id,
          checkType: "knowledge_lake_write",
          status: "down",
          errorMessage: error.message,
          testDetails: { error: error.message },
        });

        checks.push({ type: "knowledge_lake_write", status: "failed", error: error.message });
        await createIncidentIfNeeded(project.id, "knowledge_lake_write", error.message);
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

        if (status === "down") {
          await createIncidentIfNeeded(project.id, "nera_ai_availability", "Nera AI is not available");
        }
      } catch (error: any) {
        await insertHealthCheck({
          projectId: project.id,
          checkType: "nera_ai_availability",
          status: "down",
          errorMessage: error.message,
          testDetails: { error: error.message },
        });

        checks.push({ type: "nera_ai_availability", status: "failed", error: error.message });
        await createIncidentIfNeeded(project.id, "nera_ai_availability", error.message);
      }
    }

    // Update project's overall health status
    const latestChecks = await getLatestHealthChecksByProject(project.id);
    const hasDown = latestChecks.some(check => check.status === "down");
    const hasDegraded = latestChecks.some(check => check.status === "degraded");

    const overallStatus = hasDown ? "down" : hasDegraded ? "degraded" : "healthy";

    await updateProject(project.id, {
      lastHealthCheck: new Date(),
      currentHealthStatus: overallStatus,
    });

    console.log(`[Health Scheduler] Completed health check for ${project.name}: ${overallStatus}`);

    return {
      success: true,
      checks,
      overallStatus,
    };
  } catch (error: any) {
    console.error(`[Health Scheduler] Error running health check for project ${projectId}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create an incident if one doesn't already exist for this check type
 */
async function createIncidentIfNeeded(projectId: number, checkType: string, errorMessage: string) {
  try {
    const project = await getProjectById(projectId);
    if (!project) return;

    // Check if there's already an open incident for this check type
    const openIncidents = await getOpenIncidents(project.userId);
    const existingIncident = openIncidents.find(
      (i: any) => i.incident.projectId === projectId &&
      i.incident.metadata?.checkType === checkType &&
      i.incident.status === "open"
    );

    if (existingIncident) {
      console.log(`[Health Scheduler] Incident already exists for ${checkType} on project ${projectId}`);
      return;
    }

    // Create new incident
    const severityMap: Record<string, "critical" | "high" | "medium" | "low"> = {
      uptime: "critical",
      knowledge_lake_read: "high",
      knowledge_lake_write: "high",
      nera_ai_availability: "high",
      knowledge_lake_connection: "high",
      database_connection: "critical",
    };

    const severity = severityMap[checkType] || "medium";

    const titleMap: Record<string, string> = {
      uptime: "Service Downtime Detected",
      knowledge_lake_read: "Knowledge Lake Read Failure",
      knowledge_lake_write: "Knowledge Lake Write Failure",
      nera_ai_availability: "Nera AI Unavailable",
    };

    const title = titleMap[checkType] || `Health Check Failed: ${checkType}`;

    await createIncident({
      projectId,
      title,
      description: errorMessage,
      severity,
      status: "open",
      affectedFeatures: [checkType],
      metadata: { checkType, autoCreated: true },
    });

    console.log(`[Health Scheduler] Created incident for ${checkType} on project ${projectId}`);
  } catch (error: any) {
    console.error(`[Health Scheduler] Error creating incident:`, error.message);
  }
}

/**
 * Check all projects and run health checks for those that are due
 */
async function checkAllProjects() {
  if (isRunning) {
    console.log('[Health Scheduler] Previous run still in progress, skipping...');
    return;
  }

  isRunning = true;

  try {
    // Get all users - in a production system, you'd want to iterate through all users
    // For now, we'll just check user ID 1's projects
    const userId = 1;
    const projects = await getProjectsByUserId(userId);

    if (!projects || projects.length === 0) {
      console.log('[Health Scheduler] No projects to check');
      isRunning = false;
      return;
    }

    console.log(`[Health Scheduler] Checking ${projects.length} projects`);

    const now = Date.now();

    for (const project of projects) {
      // Skip archived projects
      if (project.status === 'archived') {
        continue;
      }

      // Check if project is due for a health check
      const interval = (project.healthCheckInterval || 300) * 1000; // Convert seconds to ms
      const lastCheck = project.lastHealthCheck ? new Date(project.lastHealthCheck).getTime() : 0;
      const timeSinceLastCheck = now - lastCheck;

      if (timeSinceLastCheck >= interval) {
        console.log(`[Health Scheduler] Project ${project.name} is due for check (last: ${Math.floor(timeSinceLastCheck / 1000)}s ago)`);
        await runHealthCheckForProject(project.id);
      }
    }

    console.log('[Health Scheduler] Completed checking all projects');
  } catch (error: any) {
    console.error('[Health Scheduler] Error in checkAllProjects:', error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the health check scheduler
 * Runs every minute
 */
export function startHealthCheckScheduler() {
  if (schedulerTask) {
    console.log('[Health Scheduler] Scheduler already running');
    return;
  }

  console.log('[Health Scheduler] Starting automated health check scheduler');

  // Run every minute
  schedulerTask = cron.schedule('* * * * *', async () => {
    await checkAllProjects();
  });

  // Run an initial check after 10 seconds to verify it works
  setTimeout(async () => {
    console.log('[Health Scheduler] Running initial health check...');
    await checkAllProjects();
  }, 10000);

  console.log('[Health Scheduler] Scheduler started (runs every minute)');
}

/**
 * Stop the health check scheduler
 */
export function stopHealthCheckScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('[Health Scheduler] Scheduler stopped');
  }
}

/**
 * Manual trigger for health checks (for testing)
 */
export async function runSchedulerNow() {
  console.log('[Health Scheduler] Manual trigger requested');
  await checkAllProjects();
}
