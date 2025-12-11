/**
 * Batch Conversation Ingestion Script
 * Implements DUAL-WRITE strategy:
 *   1. D1 Database (dashboard cache)
 *   2. Knowledge Lake API (centralized source of truth)
 *
 * Usage:
 *   npx tsx scripts/batch-ingest.ts [options]
 *   npx tsx scripts/batch-ingest.ts --dry-run
 *   npx tsx scripts/batch-ingest.ts --auto-promote
 *
 * This script:
 * 1. Scans conversations/processed/ directory
 * 2. Runs ingestion on all conversation files
 * 3. Syncs to both D1 and Knowledge Lake
 * 4. Tracks success/failure for each file
 * 5. Generates detailed summary report
 * 6. Archives successfully ingested files
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

interface IngestResult {
  filename: string;
  success: boolean;
  entities?: number;
  relationships?: number;
  duration?: number;
  error?: string;
  sourceFile?: string;
  archivePath?: string;
  knowledgeLakeSuccess?: boolean;
  knowledgeLakeError?: string;
}

interface BatchSummary {
  totalFiles: number;
  successful: number;
  failed: number;
  totalEntities: number;
  totalRelationships: number;
  totalDuration: number;
  knowledgeLakeSynced: number;
  knowledgeLakeFailed: number;
  results: IngestResult[];
}

/**
 * Send conversation data to Knowledge Lake API
 */
async function sendToKnowledgeLake(
  filePath: string,
  fileContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const lines = fileContent.split('\n');

    // Extract metadata from file
    const agent = lines.find(l => l.startsWith('Agent:'))?.split(':')[1]?.trim() || 'Unknown';
    const dateMatch = lines.find(l => l.startsWith('Date:'))?.split(':')[1]?.trim();
    const date = dateMatch ? new Date(dateMatch).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const topic = lines.find(l => l.startsWith('Topic:'))?.split(':')[1]?.trim() || path.basename(filePath);

    const payload = {
      userId: 1,
      agent,
      date,
      topic,
      content: fileContent,
      entities: [], // Knowledge Lake will extract these
      relationships: [], // Knowledge Lake will infer these
      metadata: {
        sourceFile: filePath,
        processingAgent: 'AAE-Dashboard-Batch',
        priority: 'Medium'
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
 * Ingest a single conversation file
 */
async function ingestConversation(
  filePath: string,
  userId: number,
  autoPromote: boolean,
  dryRun: boolean
): Promise<IngestResult> {
  const filename = path.basename(filePath);
  const startTime = Date.now();

  try {
    console.log(`\n  📄 Processing: ${filename}`);

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    if (dryRun) {
      // Dry run: just validate file
      console.log(`     ✓ File readable (${(content.length / 1024).toFixed(2)} KB)`);
      return {
        filename,
        success: true,
        duration: Date.now() - startTime,
      };
    }

    // Create caller and ingest
    const caller = appRouter.createCaller({ user: { id: userId } });
    const result = await caller.knowledge.ingestConversation({
      filePath,
      autoPromote,
    });

    const duration = Date.now() - startTime;

    console.log(`     ✅ D1 Success in ${duration}ms`);
    console.log(`        Entities: ${result.entitiesCreated}`);
    console.log(`        Relationships: ${result.relationshipsCreated}`);

    // DUAL-WRITE: Also send to Knowledge Lake API
    const knowledgeLakeResult = await sendToKnowledgeLake(filePath, content);

    if (knowledgeLakeResult.success) {
      console.log(`     🌊 Knowledge Lake synced`);
    } else {
      console.log(`     ⚠️  Knowledge Lake failed: ${knowledgeLakeResult.error}`);
    }

    return {
      filename,
      success: true,
      entities: result.entitiesCreated,
      relationships: result.relationshipsCreated,
      duration,
      sourceFile: filePath,
      knowledgeLakeSuccess: knowledgeLakeResult.success,
      knowledgeLakeError: knowledgeLakeResult.error,
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`     ❌ Failed in ${duration}ms: ${error.message}`);

    return {
      filename,
      success: false,
      duration,
      error: error.message,
      sourceFile: filePath,
    };
  }
}

/**
 * Archive successfully ingested file
 */
async function archiveFile(sourcePath: string, archiveDir: string): Promise<string> {
  const filename = path.basename(sourcePath);
  const archivePath = path.join(archiveDir, filename);

  // Ensure archive directory exists
  await fs.mkdir(archiveDir, { recursive: true });

  // Move file to archive
  await fs.rename(sourcePath, archivePath);

  return archivePath;
}

/**
 * Main batch ingestion function
 */
async function batchIngest(options: {
  sourceDir: string;
  archiveDir: string;
  userId: number;
  autoPromote: boolean;
  dryRun: boolean;
}) {
  const { sourceDir, archiveDir, userId, autoPromote, dryRun } = options;

  console.log('🔄 Batch Conversation Ingestion\n');
  console.log(`📂 Source: ${sourceDir}`);
  console.log(`📦 Archive: ${archiveDir}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`🎯 Auto-promote: ${autoPromote ? 'Yes (RAW → DRAFT)' : 'No (stay RAW)'}`);
  console.log(`🧪 Dry run: ${dryRun ? 'Yes (validation only)' : 'No (actual ingestion)'}\n`);

  const summary: BatchSummary = {
    totalFiles: 0,
    successful: 0,
    failed: 0,
    totalEntities: 0,
    totalRelationships: 0,
    totalDuration: 0,
    knowledgeLakeSynced: 0,
    knowledgeLakeFailed: 0,
    results: [],
  };

  try {
    // Check if source directory exists
    try {
      await fs.access(sourceDir);
    } catch {
      console.log(`⚠️  Source directory does not exist: ${sourceDir}`);
      console.log('   Run split-monthly-dump.ts first to generate conversation files.\n');
      return summary;
    }

    // Read all .md files from source directory
    const files = await fs.readdir(sourceDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    if (mdFiles.length === 0) {
      console.log('⚠️  No .md files found in source directory.');
      console.log('   Run split-monthly-dump.ts first to generate conversation files.\n');
      return summary;
    }

    summary.totalFiles = mdFiles.length;
    console.log(`📋 Found ${mdFiles.length} conversation files\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Process each file
    for (let i = 0; i < mdFiles.length; i++) {
      const filename = mdFiles[i];
      const filePath = path.join(sourceDir, filename);

      console.log(`[${i + 1}/${mdFiles.length}]`);

      const result = await ingestConversation(filePath, userId, autoPromote, dryRun);
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

        // Archive the file (unless dry run)
        if (!dryRun && result.sourceFile) {
          try {
            const archivePath = await archiveFile(result.sourceFile, archiveDir);
            result.archivePath = archivePath;
            console.log(`     📦 Archived to: ${path.basename(archivePath)}`);
          } catch (archiveError: any) {
            console.log(`     ⚠️  Archive failed: ${archiveError.message}`);
          }
        }
      } else {
        summary.failed++;
      }

      if (result.duration) {
        summary.totalDuration += result.duration;
      }
    }

    // Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Batch Ingestion Summary\n');
    console.log(`   Total Files: ${summary.totalFiles}`);
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
    console.log(`   ⏱️  Avg per File: ${(summary.totalDuration / summary.totalFiles).toFixed(0)}ms`);

    // Show failures if any
    if (summary.failed > 0) {
      console.log('\n   ❌ Failed Files:');
      summary.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`      - ${r.filename}: ${r.error}`);
        });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Next steps
    if (!dryRun && summary.successful > 0) {
      console.log('✨ Next Steps:\n');
      console.log('   1. View entities in database:');
      console.log('      wsl wrangler d1 execute aae-dashboard-db --command "SELECT COUNT(*) FROM entities"\n');
      console.log('   2. Query by entity type:');
      console.log('      wsl wrangler d1 execute aae-dashboard-db --command "SELECT entityType, COUNT(*) FROM entities GROUP BY entityType"\n');
      console.log('   3. Browse archived files:');
      console.log(`      explorer "${archiveDir}"\n`);
    } else if (dryRun) {
      console.log('✨ Dry Run Complete!\n');
      console.log('   Remove --dry-run flag to perform actual ingestion:\n');
      console.log('   npx tsx scripts/batch-ingest.ts\n');
    }

  } catch (error: any) {
    console.error('\n💥 Batch ingestion failed:', error.message);
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
    dryRun: args.includes('--dry-run'),
    autoPromote: args.includes('--auto-promote'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Batch Conversation Ingestion Script

Usage:
  npx tsx scripts/batch-ingest.ts [options]

Options:
  --dry-run        Validate files without ingesting (default: false)
  --auto-promote   Promote entities to DRAFT state (default: false, stays RAW)
  --help, -h       Show this help message

Examples:
  # Dry run to validate all files
  npx tsx scripts/batch-ingest.ts --dry-run

  # Actual ingestion (entities stay RAW)
  npx tsx scripts/batch-ingest.ts

  # Ingest and auto-promote to DRAFT
  npx tsx scripts/batch-ingest.ts --auto-promote

Directory Structure:
  Source:  conversations/processed/       (from split-monthly-dump.ts)
  Archive: conversations/exports/archive/ (successfully ingested files)

Prerequisites:
  1. Run split-monthly-dump.ts first to generate conversation files
  2. Database must be accessible (DATABASE_URL or wrangler dev)
  3. User ID 1 must exist in database

Workflow:
  1. Create monthly dump: conversations/monthly-dumps/claude/Claude_2024-11.md
  2. Split conversations: npx tsx scripts/split-monthly-dump.ts <monthly-file>
  3. Batch ingest: npx tsx scripts/batch-ingest.ts
  4. Verify: wsl wrangler d1 execute aae-dashboard-db --command "SELECT COUNT(*) FROM entities"
`);
}

// Main execution
const options = parseArgs();

if (options.help) {
  showHelp();
  process.exit(0);
}

const sourceDir = path.join(__dirname, '../conversations/processed');
const archiveDir = path.join(__dirname, '../conversations/exports/archive');
const userId = 1; // Carla's user ID

batchIngest({
  sourceDir,
  archiveDir,
  userId,
  autoPromote: options.autoPromote,
  dryRun: options.dryRun,
}).then((summary) => {
  process.exit(summary.failed > 0 ? 1 : 0);
});
