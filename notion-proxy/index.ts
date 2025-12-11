#!/usr/bin/env ts-node
/**
 * Notion Proxy Server for AAE Dashboard
 *
 * Provides HTTP endpoints to access Notion databases via Notion REST API
 * Uses NOTION_N8N_AI_ROUTER_INTEGRATION_TOKEN from .env
 *
 * Architecture:
 * Dashboard (tRPC) → HTTP → Notion Proxy (this server) → Notion REST API
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const NOTION_TOKEN = process.env.NOTION_N8N_AI_ROUTER_INTEGRATION_TOKEN;
const ACRRM_DATABASE_ID = 'd431098f-103a-4d3e-9cb5-82143e42d75b';
const NOTION_VERSION = '2022-06-28';

if (!NOTION_TOKEN) {
  console.error('❌ NOTION_N8N_AI_ROUTER_INTEGRATION_TOKEN not found in .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.NOTION_PROXY_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Types matching Notion database structure
interface ACRRMEntry {
  id: string;
  content_title: string;
  analysis_status: string;
  assigned_agent: string;
  primary_audience: string;
  output_formats: string[];
  ntcer_relevance: string;
  production_priority: string;
  complexity_level: string;
  handbook_part: string;
  notes: string;
  source_section: string;
  regulatory_references: string;
  research_check_required: boolean;
  pm_version_status: string | null;
  tpa_version_status: string | null;
  video_url: string | null;
  gamma_url: string | null;
  url: string;
}

/**
 * GET /acrrm/entries
 * Query ACRRM Resource Development Pipeline database via Notion REST API
 */
app.get('/acrrm/entries', async (req, res) => {
  try {
    console.log('[Notion Proxy] Querying ACRRM database from Notion...');

    const response = await fetch(
      `https://api.notion.com/v1/databases/${ACRRM_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page_size: 100 // Get all entries
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Transform Notion page objects to our ACRRMEntry format
    const entries: ACRRMEntry[] = data.results.map((page: any) => {
      const props = page.properties;

      // Helper to extract text from rich_text or title properties
      const getText = (prop: any): string => {
        if (!prop) return '';
        const arr = prop.title || prop.rich_text;
        return arr?.[0]?.plain_text || '';
      };

      // Helper to extract select value
      const getSelect = (prop: any): string => prop?.select?.name || '';

      // Helper to extract multi-select values
      const getMultiSelect = (prop: any): string[] =>
        prop?.multi_select?.map((s: any) => s.name) || [];

      // Helper to extract checkbox
      const getCheckbox = (prop: any): boolean => prop?.checkbox || false;

      // Helper to extract URL
      const getUrl = (prop: any): string | null => prop?.url || null;

      return {
        id: page.id,
        content_title: getText(props['Content Title']),
        analysis_status: getSelect(props['Analysis Status']),
        assigned_agent: getSelect(props['Assigned Agent']),
        primary_audience: getSelect(props['Primary Audience']),
        output_formats: getMultiSelect(props['Output Formats']),
        ntcer_relevance: getSelect(props['NTCER Relevance']),
        production_priority: getSelect(props['Production Priority']),
        complexity_level: getSelect(props['Complexity Level']),
        handbook_part: getSelect(props['Handbook Part']),
        notes: getText(props['Notes']),
        source_section: getText(props['Source Section']),
        regulatory_references: getText(props['Regulatory References']),
        research_check_required: getCheckbox(props['Research Check Required']),
        pm_version_status: getSelect(props['PM Version Status']) || null,
        tpa_version_status: getSelect(props['TPA Version Status']) || null,
        video_url: getUrl(props['Video URL']),
        gamma_url: getUrl(props['Gamma URL']),
        url: page.url
      };
    });

    console.log(`[Notion Proxy] ✓ Retrieved ${entries.length} entries from Notion`);

    res.json({
      success: true,
      entries,
      total: entries.length
    });
  } catch (error) {
    console.error('[Notion Proxy] Error querying ACRRM database:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /acrrm/entries/:id/status
 * Update Analysis Status for an ACRRM entry via Notion REST API
 */
app.patch('/acrrm/entries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    console.log(`[Notion Proxy] Updating entry ${id.substring(0, 8)}... to status: ${status}`);

    // Update the Notion page via REST API
    const response = await fetch(
      `https://api.notion.com/v1/pages/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            'Analysis Status': {
              select: {
                name: status
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const updatedPage = await response.json();
    console.log(`[Notion Proxy] ✓ Entry updated successfully in Notion`);

    res.json({
      success: true,
      message: `Entry updated to ${status}`,
      updatedAt: updatedPage.last_edited_time
    });
  } catch (error) {
    console.error('[Notion Proxy] Error updating entry status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'notion-proxy',
    timestamp: new Date().toISOString(),
    notion_database_id: ACRRM_DATABASE_ID,
    token_configured: !!NOTION_TOKEN
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Notion Proxy Server running on http://localhost:${PORT}`);
  console.log(`📊 ACRRM Database ID: ${ACRRM_DATABASE_ID}`);
  console.log(`🔑 Token: ${NOTION_TOKEN!.substring(0, 10)}...${NOTION_TOKEN!.substring(NOTION_TOKEN!.length - 4)}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /acrrm/entries          - Query ACRRM database`);
  console.log(`  PATCH /acrrm/entries/:id/status - Update entry status`);
  console.log(`  GET  /health                 - Health check\n`);
});

export default app;
