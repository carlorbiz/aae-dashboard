import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

/**
 * ACRRM Resource Development Pipeline Router
 * Integrates with Notion database via local proxy API
 *
 * Phase 1 (MVD): Read entries, display table, enable status updates
 */

const NOTION_PROXY_URL = process.env.NOTION_PROXY_URL || 'http://localhost:3001';

// Analysis Status enum matching Notion database
const analysisStatusEnum = z.enum([
  "Awaiting Analysis",
  "Claude Analysing",
  "Analysis Complete",
  "Human Review Required",
  "Approved for Output",
  "In Production",
  "Complete"
]);

// ACRRM Entry schema matching Notion structure
const acrmEntrySchema = z.object({
  id: z.string(),
  content_title: z.string(),
  analysis_status: analysisStatusEnum,
  assigned_agent: z.string(),
  primary_audience: z.string(),
  output_formats: z.array(z.string()),
  ntcer_relevance: z.string(),
  production_priority: z.string(),
  complexity_level: z.string(),
  handbook_part: z.string(),
  notes: z.string(),
  source_section: z.string(),
  regulatory_references: z.string(),
  research_check_required: z.boolean(),
  pm_version_status: z.string().nullable(),
  tpa_version_status: z.string().nullable(),
  video_url: z.string().nullable(),
  gamma_url: z.string().nullable(),
  url: z.string(),
});

export const acrmRouter = router({
  /**
   * List all ACRRM Resource Development Pipeline entries
   */
  listEntries: publicProcedure
    .input(
      z.object({
        status: analysisStatusEnum.optional(),
        priority: z.enum(["Urgent", "High", "Medium", "Low"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        // Call Notion proxy API
        const response = await fetch(`${NOTION_PROXY_URL}/acrrm/entries`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Notion proxy error: ${response.statusText}`);
        }

        const data = await response.json();

        // Apply filters
        let entries = data.entries || [];

        if (input.status) {
          entries = entries.filter((e: any) => e.analysis_status === input.status);
        }

        if (input.priority) {
          entries = entries.filter((e: any) => e.production_priority === input.priority);
        }

        entries = entries.slice(0, input.limit);

        return {
          success: true,
          entries,
          total: data.total || entries.length,
        };
      } catch (error) {
        console.error('Error fetching ACRRM entries:', error);
        throw new Error(`Failed to fetch ACRRM entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Get a single ACRRM entry by ID
   */
  getEntry: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(`${NOTION_PROXY_URL}/acrrm/entries`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Notion proxy error: ${response.statusText}`);
        }

        const data = await response.json();
        const entry = (data.entries || []).find((e: any) => e.id === input.id);

        if (!entry) {
          throw new Error('Entry not found');
        }

        return {
          success: true,
          entry,
        };
      } catch (error) {
        console.error('Error fetching ACRRM entry:', error);
        throw new Error(`Failed to fetch entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Update Analysis Status for an ACRRM entry
   * Writes back to Notion database
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: analysisStatusEnum,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id || 1;

        // Call Notion proxy API to update status
        const response = await fetch(
          `${NOTION_PROXY_URL}/acrrm/entries/${input.id}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: input.status }),
          }
        );

        if (!response.ok) {
          throw new Error(`Notion proxy error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          message: `Status updated to ${input.status}`,
          updatedAt: data.updatedAt,
        };
      } catch (error) {
        console.error('Error updating ACRRM entry status:', error);
        throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Get statistics about ACRRM pipeline
   */
  getStatistics: publicProcedure.query(async () => {
    try {
      const response = await fetch(`${NOTION_PROXY_URL}/acrrm/entries`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Notion proxy error: ${response.statusText}`);
      }

      const data = await response.json();
      const entries = data.entries || [];

      // Calculate statistics
      const stats = {
        total: entries.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byAgent: {} as Record<string, number>,
        byNTCER: {} as Record<string, number>,
      };

      entries.forEach((entry: any) => {
        // Count by status
        stats.byStatus[entry.analysis_status] =
          (stats.byStatus[entry.analysis_status] || 0) + 1;

        // Count by priority
        stats.byPriority[entry.production_priority] =
          (stats.byPriority[entry.production_priority] || 0) + 1;

        // Count by agent
        stats.byAgent[entry.assigned_agent] =
          (stats.byAgent[entry.assigned_agent] || 0) + 1;

        // Count by NTCER relevance
        stats.byNTCER[entry.ntcer_relevance] =
          (stats.byNTCER[entry.ntcer_relevance] || 0) + 1;
      });

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Error fetching ACRRM statistics:', error);
      throw new Error(`Failed to fetch statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),
});

export type ACRRMRouter = typeof acrmRouter;
