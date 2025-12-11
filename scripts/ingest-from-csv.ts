/**
 * CSV Conversation Ingestion Script
 * Implements DUAL-WRITE strategy:
 *   1. D1 Database (dashboard cache)
 *   2. Knowledge Lake API (centralized source of truth)
 *
 * Usage:
 *   npx tsx scripts/ingest-from-csv.ts <csv-file.csv> [options]
 *   npx tsx scripts/ingest-from-csv.ts conversations-export.csv --dry-run
 *   npx tsx scripts/ingest-from-csv.ts conversations-export.csv --auto-promote
 *
 * Google Sheets Export Format:
 *   Columns: Date, Agent, Topic, Prompt, Response, Priority, Project, Tags, Ingested
 *
 * This script:
 * 1. Reads CSV export from Google Sheets
 * 2. Groups rows by conversation (Date + Agent + Topic)
 * 3. Constructs conversation content from Prompt/Response pairs
 * 4. Ingests into both D1 and Knowledge Lake
 * 5. Tracks which rows have been processed
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { appRouter } from '../server/routers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set DATABASE_URL for local D1 SQLite database
if (!process.env.DATABASE_URL) {
  const dbPath = path.join(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e9a6f632ee12195517b4a68b9a533bc1eaaf7e3be6ca4229fab89dc8a2bdecbe.sqlite');
  process.env.DATABASE_URL = dbPath;
  console.log('[Database] Using local D1 database at:', dbPath);
}

// Knowledge Lake API configuration
const KNOWLEDGE_LAKE_URL = process.env.KNOWLEDGE_LAKE_URL || 'http://localhost:5002';

interface CSVRow {
  date: string;
  agent: string;
  topic: string;
  prompt: string;
  response: string;
  priority?: string;
  project?: string;
  tags?: string;
  ingested?: string;
  rowNumber: number;
}

interface Conversation {
  date: string;
  agent: string;
  topic: string;
  priority?: string;
  project?: string;
  tags?: string;
  exchanges: Array<{ prompt: string; response: string }>;
  rowNumbers: number[];
}

interface IngestResult {
  conversation: string;
  success: boolean;
  entities?: number;
  relationships?: number;
  duration?: number;
  error?: string;
  rowNumbers: number[];
  knowledgeLakeSuccess?: boolean;
  knowledgeLakeError?: string;
}

/**
 * Parse CSV file
 */
async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  // Validate required columns
  const required = ['date', 'agent', 'topic', 'prompt', 'response'];
  const missing = required.filter(col => !header.includes(col));
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }

  // Parse data rows
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parser (handles quoted fields)
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Last value

    // Create row object
    const row: any = { rowNumber: i + 1 };
    header.forEach((col, idx) => {
      row[col] = values[idx] || '';
    });

    // Skip rows already ingested
    if (row.ingested?.toLowerCase() === 'yes') {
      console.log(`  ⏭️  Row ${i + 1} already ingested, skipping`);
      continue;
    }

    // Skip rows with missing required fields
    if (!row.date || !row.agent || !row.topic || !row.prompt || !row.response) {
      console.log(`  ⚠️  Row ${i + 1} missing required fields, skipping`);
      continue;
    }

    rows.push(row as CSVRow);
  }

  return rows;
}

/**
 * Group CSV rows into conversations
 */
function groupConversations(rows: CSVRow[]): Conversation[] {
  const conversations = new Map<string, Conversation>();

  for (const row of rows) {
    // Create unique key: date + agent + topic
    const key = `${row.date}_${row.agent}_${row.topic}`;

    if (!conversations.has(key)) {
      conversations.set(key, {
        date: row.date,
        agent: row.agent,
        topic: row.topic,
        priority: row.priority,
        project: row.project,
        tags: row.tags,
        exchanges: [],
        rowNumbers: [],
      });
    }

    const convo = conversations.get(key)!;
    convo.exchanges.push({
      prompt: row.prompt,
      response: row.response,
    });
    convo.rowNumbers.push(row.rowNumber);
  }

  return Array.from(conversations.values());
}

/**
 * Generate markdown content from conversation
 */
function generateMarkdown(convo: Conversation): string {
  const header = `# Conversation with ${convo.agent}
**Date**: ${convo.date}
**Topic**: ${convo.topic}
${convo.priority ? `**Priority**: ${convo.priority}` : ''}
${convo.project ? `**Project**: ${convo.project}` : ''}
${convo.tags ? `**Tags**: ${convo.tags}` : ''}
**Source**: Google Sheets CSV (rows ${convo.rowNumbers.join(', ')})

---

`;

  const exchanges = convo.exchanges.map((ex, idx) => {
    return `user: ${ex.prompt}\n\n${convo.agent.toLowerCase()}: ${ex.response}`;
  }).join('\n\n===\n\n');

  return header + exchanges;
}

/**
 * Send conversation data to Knowledge Lake API
 */
async function sendToKnowledgeLake(
  convo: Conversation,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      userId: 1,
      agent: convo.agent,
      date: convo.date,
      topic: convo.topic,
      content,
      entities: [], // Knowledge Lake will extract these
      relationships: [], // Knowledge Lake will infer these
      metadata: {
        sourceFile: 'Google Sheets CSV',
        processingAgent: 'AAE-Dashboard-CSV',
        priority: convo.priority || 'Medium',
        project: convo.project,
        tags: convo.tags,
        csvRows: convo.rowNumbers.join(', ')
      }
    };

    const response = await fetch(`${KNOWLEDGE_LAKE_URL}/api/conversations/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API responded with ${response.status}: ${errorText}`);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Ingest a single conversation
 */
async function ingestConversation(
  convo: Conversation,
  userId: number,
  autoPromote: boolean,
  dryRun: boolean
): Promise<IngestResult> {
  const conversationId = `${convo.agent}_${convo.date}_${convo.topic}`;
  const startTime = Date.now();

  try {
    console.log(`\n  📄 Processing: ${conversationId}`);
    console.log(`     Rows: ${convo.rowNumbers.join(', ')}`);
    console.log(`     Exchanges: ${convo.exchanges.length}`);

    // Generate markdown content
    const content = generateMarkdown(convo);

    if (dryRun) {
      console.log(`     ✓ Generated markdown (${(content.length / 1024).toFixed(2)} KB)`);
      return {
        conversation: conversationId,
        success: true,
        duration: Date.now() - startTime,
        rowNumbers: convo.rowNumbers,
      };
    }

    // Create temporary file for ingestion
    const tempDir = path.join(__dirname, '../.temp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempFile = path.join(tempDir, `${conversationId.replace(/[^a-zA-Z0-9]/g, '_')}.md`);
    await fs.writeFile(tempFile, content, 'utf-8');

    try {
      // Ingest via tRPC
      const caller = appRouter.createCaller({ user: { id: userId } });
      const result = await caller.knowledge.ingestConversation({
        filePath: tempFile,
        autoPromote,
      });

      const duration = Date.now() - startTime;

      console.log(`     ✅ D1 Success in ${duration}ms`);
      console.log(`        Entities: ${result.entitiesCreated}`);
      console.log(`        Relationships: ${result.relationshipsCreated}`);

      // DUAL-WRITE: Also send to Knowledge Lake API
      const knowledgeLakeResult = await sendToKnowledgeLake(convo, content);

      if (knowledgeLakeResult.success) {
        console.log(`     🌊 Knowledge Lake synced`);
      } else {
        console.log(`     ⚠️  Knowledge Lake failed: ${knowledgeLakeResult.error}`);
      }

      // Clean up temp file
      await fs.unlink(tempFile);

      return {
        conversation: conversationId,
        success: true,
        entities: result.entitiesCreated,
        relationships: result.relationshipsCreated,
        duration,
        rowNumbers: convo.rowNumbers,
        knowledgeLakeSuccess: knowledgeLakeResult.success,
        knowledgeLakeError: knowledgeLakeResult.error,
      };

    } catch (ingestError: any) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempFile);
      } catch {}
      throw ingestError;
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`     ❌ Failed in ${duration}ms: ${error.message}`);

    return {
      conversation: conversationId,
      success: false,
      duration,
      error: error.message,
      rowNumbers: convo.rowNumbers,
    };
  }
}

/**
 * Update CSV file to mark rows as ingested
 */
async function updateCSV(filePath: string, processedRows: Set<number>): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Find or add "Ingested" column
  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  let ingestedColIdx = header.findIndex(h => h.toLowerCase() === 'ingested');

  if (ingestedColIdx === -1) {
    // Add "Ingested" column to header
    lines[0] = lines[0].trim() + ',Ingested';
    ingestedColIdx = header.length;
  }

  // Mark processed rows as "Yes"
  for (let i = 1; i < lines.length; i++) {
    if (processedRows.has(i + 1)) {
      const values = lines[i].split(',');

      // Ensure array is long enough
      while (values.length <= ingestedColIdx) {
        values.push('');
      }

      values[ingestedColIdx] = 'Yes';
      lines[i] = values.join(',');
    }
  }

  // Write back to file
  await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Main CSV ingestion function
 */
async function ingestFromCSV(options: {
  csvPath: string;
  userId: number;
  autoPromote: boolean;
  dryRun: boolean;
  updateFile: boolean;
}) {
  const { csvPath, userId, autoPromote, dryRun, updateFile } = options;

  console.log('📊 CSV Conversation Ingestion\n');
  console.log(`📄 CSV File: ${csvPath}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`🎯 Auto-promote: ${autoPromote ? 'Yes (RAW → DRAFT)' : 'No (stay RAW)'}`);
  console.log(`🧪 Dry run: ${dryRun ? 'Yes (validation only)' : 'No (actual ingestion)'}`);
  console.log(`📝 Update CSV: ${updateFile ? 'Yes (mark as ingested)' : 'No'}\n`);

  const summary = {
    totalRows: 0,
    skippedRows: 0,
    conversations: 0,
    successful: 0,
    failed: 0,
    totalEntities: 0,
    totalRelationships: 0,
    totalDuration: 0,
    knowledgeLakeSynced: 0,
    knowledgeLakeFailed: 0,
    results: [] as IngestResult[],
  };

  try {
    // Parse CSV
    console.log('📖 Parsing CSV file...');
    const rows = await parseCSV(csvPath);
    summary.totalRows = rows.length;
    console.log(`✅ Parsed ${rows.length} valid rows\n`);

    if (rows.length === 0) {
      console.log('⚠️  No rows to process. All rows may already be ingested or missing required fields.\n');
      return summary;
    }

    // Group into conversations
    console.log('🔗 Grouping rows into conversations...');
    const conversations = groupConversations(rows);
    summary.conversations = conversations.length;
    console.log(`✅ Found ${conversations.length} unique conversations\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Process each conversation
    const processedRows = new Set<number>();

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];

      console.log(`[${i + 1}/${conversations.length}]`);

      const result = await ingestConversation(convo, userId, autoPromote, dryRun);
      summary.results.push(result);

      if (result.success) {
        summary.successful++;
        if (result.entities) summary.totalEntities += result.entities;
        if (result.relationships) summary.totalRelationships += result.relationships;

        // Track Knowledge Lake sync results
        if (result.knowledgeLakeSuccess) {
          summary.knowledgeLakeSynced++;
        } else {
          summary.knowledgeLakeFailed++;
        }

        // Track processed rows
        result.rowNumbers.forEach(r => processedRows.add(r));
      } else {
        summary.failed++;
      }

      if (result.duration) {
        summary.totalDuration += result.duration;
      }
    }

    // Update CSV file to mark rows as ingested
    if (!dryRun && updateFile && processedRows.size > 0) {
      console.log('\n📝 Updating CSV file...');
      await updateCSV(csvPath, processedRows);
      console.log(`✅ Marked ${processedRows.size} rows as ingested`);
    }

    // Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 CSV Ingestion Summary\n');
    console.log(`   Total CSV Rows: ${summary.totalRows}`);
    console.log(`   Conversations: ${summary.conversations}`);
    console.log(`   ✅ Successful: ${summary.successful}`);
    console.log(`   ❌ Failed: ${summary.failed}`);

    if (!dryRun) {
      console.log(`\n   📊 Knowledge Graph Impact:`);
      console.log(`   Entities Created: ${summary.totalEntities}`);
      console.log(`   Relationships Created: ${summary.totalRelationships}`);

      console.log(`\n   🌊 Knowledge Lake Sync:`);
      console.log(`   ✅ Synced: ${summary.knowledgeLakeSynced}`);
      console.log(`   ⚠️  Failed: ${summary.knowledgeLakeFailed}`);
    }

    console.log(`\n   ⏱️  Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`   ⏱️  Avg per Conversation: ${(summary.totalDuration / summary.conversations).toFixed(0)}ms`);

    // Show failures if any
    if (summary.failed > 0) {
      console.log('\n   ❌ Failed Conversations:');
      summary.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`      - ${r.conversation}: ${r.error}`);
        });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Next steps
    if (!dryRun && summary.successful > 0) {
      console.log('✨ Next Steps:\n');
      console.log('   1. View entities in database:');
      console.log('      wsl wrangler d1 execute aae-dashboard-db --command "SELECT COUNT(*) FROM entities"\n');
      console.log('   2. Open Google Sheet and verify "Ingested" column shows "Yes"\n');
      console.log('   3. Continue adding new conversations to the sheet\n');
    } else if (dryRun) {
      console.log('✨ Dry Run Complete!\n');
      console.log('   Remove --dry-run flag to perform actual ingestion:\n');
      console.log(`   npx tsx scripts/ingest-from-csv.ts "${csvPath}"\n`);
    }

  } catch (error: any) {
    console.error('\n💥 CSV ingestion failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }

  return summary;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  return {
    csvPath: args.find(a => !a.startsWith('--')),
    dryRun: args.includes('--dry-run'),
    autoPromote: args.includes('--auto-promote'),
    noUpdate: args.includes('--no-update'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
CSV Conversation Ingestion Script

Usage:
  npx tsx scripts/ingest-from-csv.ts <csv-file.csv> [options]

Options:
  --dry-run        Validate CSV without ingesting (default: false)
  --auto-promote   Promote entities to DRAFT state (default: false, stays RAW)
  --no-update      Don't mark rows as ingested in CSV (default: false, will update)
  --help, -h       Show this help message

Examples:
  # Dry run to validate CSV
  npx tsx scripts/ingest-from-csv.ts conversations-export.csv --dry-run

  # Actual ingestion (entities stay RAW, CSV updated)
  npx tsx scripts/ingest-from-csv.ts conversations-export.csv

  # Ingest and auto-promote to DRAFT
  npx tsx scripts/ingest-from-csv.ts conversations-export.csv --auto-promote

  # Ingest without updating CSV
  npx tsx scripts/ingest-from-csv.ts conversations-export.csv --no-update

CSV Format (Google Sheets):
  Required columns: Date, Agent, Topic, Prompt, Response
  Optional columns: Priority, Project, Tags, Ingested

  Example:
  Date,Agent,Topic,Prompt,Response,Priority,Project,Tags,Ingested
  2024-11-15,Claude,Database Schema,How do I design entities?,Use these columns...,High,AAE Dashboard,database schema,No
  2024-11-15,Claude,Database Schema,What about relationships?,Create a relationships table...,High,AAE Dashboard,database schema,No

Workflow:
  1. Create Google Sheet with required columns
  2. Paste conversations (one exchange per row)
  3. Export: File → Download → CSV
  4. Run: npx tsx scripts/ingest-from-csv.ts path/to/export.csv
  5. Re-import updated CSV to Google Sheets (rows marked "Yes" in Ingested column)
`);
}

// Main execution
const options = parseArgs();

if (options.help || !options.csvPath) {
  showHelp();
  process.exit(options.help ? 0 : 1);
}

const userId = 1; // Carla's user ID

ingestFromCSV({
  csvPath: options.csvPath,
  userId,
  autoPromote: options.autoPromote,
  dryRun: options.dryRun,
  updateFile: !options.noUpdate,
}).then((summary) => {
  process.exit(summary.failed > 0 ? 1 : 0);
});
