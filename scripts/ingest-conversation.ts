/**
 * CLI script to ingest conversations into knowledge graph via tRPC
 * Implements DUAL-WRITE strategy:
 *   1. D1 Database (dashboard cache)
 *   2. Knowledge Lake API (centralized source of truth)
 *
 * Usage: npx tsx scripts/ingest-conversation.ts <file-path> [--dry-run] [--auto-promote]
 */

import { appRouter } from '../server/routers';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

/**
 * Send conversation data to Knowledge Lake API
 * Knowledge Lake will do its own entity extraction using mem0
 */
async function sendToKnowledgeLake(
  filePath: string,
  d1Result: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    // Extract metadata from file
    const agent = lines.find(l => l.startsWith('Agent:'))?.split(':')[1]?.trim() || 'Unknown';
    const dateMatch = lines.find(l => l.startsWith('Date:'))?.split(':')[1]?.trim();
    const date = dateMatch ? new Date(dateMatch).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const topic = lines.find(l => l.startsWith('Topic:'))?.split(':')[1]?.trim() || path.basename(filePath);

    // For now, send minimal payload - Knowledge Lake will extract entities using mem0
    // TODO: Enhance to send D1-extracted entities once we expose them from tRPC
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
        processingAgent: 'AAE-Dashboard',
        priority: 'Medium',
        d1Stats: {
          entitiesCreated: d1Result.entitiesCreated,
          relationshipsCreated: d1Result.relationshipsCreated
        }
      }
    };

    console.log(`\n🌊 Sending to Knowledge Lake API: ${KNOWLEDGE_LAKE_URL}/api/conversations/ingest`);

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

    const result = await response.json();
    console.log(`✅ Knowledge Lake ingestion successful: ${result.entitiesCreated || 0} entities, ${result.relationshipsCreated || 0} relationships`);

    return { success: true };
  } catch (error: any) {
    console.warn(`⚠️  Knowledge Lake ingestion failed: ${error.message}`);
    console.warn(`   (D1 ingestion still succeeded - data is in local cache)`);
    return { success: false, error: error.message };
  }
}

async function ingestConversation() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: No file path provided');
    console.log('\nUsage: npx tsx scripts/ingest-conversation.ts <file-path> [--dry-run] [--auto-promote] [--force]');
    console.log('\nExample: npx tsx scripts/ingest-conversation.ts "C:\\path\\to\\conversation.md"');
    console.log('         npx tsx scripts/ingest-conversation.ts "C:\\path\\to\\conversation.md" --dry-run');
    process.exit(1);
  }

  const filePath = args[0];
  const dryRun = args.includes('--dry-run');
  const autoPromote = args.includes('--auto-promote');
  const forceReingest = args.includes('--force');

  console.log('📥 Knowledge Graph Ingestion');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📄 File: ${filePath}`);
  console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE INGESTION'}`);
  console.log(`📊 Auto-promote: ${autoPromote ? 'Yes (RAW → DRAFT)' : 'No (stay in RAW)'}`);
  console.log(`🔄 Force re-ingest: ${forceReingest ? 'Yes' : 'No'}`);
  console.log('');

  try {
    // Create tRPC caller with mock user context
    const caller = appRouter.createCaller({
      user: { id: 1, role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    console.log('⏳ Starting ingestion...\n');
    const startTime = Date.now();

    const result = await caller.knowledgeGraph.ingestConversation({
      filePath,
      dryRun,
      autoPromote,
      forceReingest,
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error('❌ Ingestion failed:');
      console.error(`   ${result.message}`);
      if (result.error) {
        console.error(`\n   Stage: ${result.error.stage}`);
        console.error(`   Code: ${result.error.code}`);
        console.error(`   Details: ${result.error.message}`);
      }
      process.exit(1);
    }

    console.log('✅ Ingestion successful!\n');
    console.log('📊 Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (dryRun && result.preview) {
      console.log(`   Would create: ${result.wouldCreate} entities`);
      console.log(`   Would skip: ${result.wouldSkip} duplicates`);
      console.log(`   Would relate: ${result.wouldRelate} relationships`);
      console.log('');

      if (result.preview.entities.length > 0) {
        console.log('   Preview - First 10 entities:');
        result.preview.entities.slice(0, 10).forEach((e: any) => {
          console.log(`     • ${e.name} (${e.entityType}, confidence: ${e.confidence.toFixed(2)})`);
        });
      }

      if (result.preview.relationships.length > 0) {
        console.log('\n   Preview - First 10 relationships:');
        result.preview.relationships.slice(0, 10).forEach((r: any) => {
          console.log(`     • ${r.fromEntityName} --[${r.relationshipType}]--> ${r.toEntityName}`);
        });
      }
    } else {
      console.log(`   ✅ Entities created: ${result.entitiesCreated || 0}`);
      console.log(`   ⏭️  Entities skipped: ${result.entitiesSkipped || 0} (duplicates)`);
      console.log(`   🔗 Relationships created: ${result.relationshipsCreated || 0}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Duration: ${duration}ms\n`);
    console.log(`💬 ${result.message}\n`);

    if (dryRun) {
      console.log('ℹ️  This was a dry run. Run without --dry-run to actually ingest.\n');
    } else {
      console.log('✨ Entities are now in D1 knowledge graph!\n');

      // DUAL-WRITE: Also send to Knowledge Lake API
      console.log('📡 Initiating Knowledge Lake API sync...');
      const knowledgeLakeResult = await sendToKnowledgeLake(filePath, result);

      if (knowledgeLakeResult.success) {
        console.log('✅ DUAL-WRITE COMPLETE: Data synced to both D1 and Knowledge Lake\n');
      } else {
        console.log('⚠️  PARTIAL SUCCESS: Data in D1, Knowledge Lake sync failed\n');
        console.log('   You can retry Knowledge Lake sync by setting KNOWLEDGE_LAKE_URL and re-running ingestion\n');
      }

      console.log('Next steps:');
      console.log('  - Query entities: npx tsx scripts/query-entities.ts');
      console.log('  - View in dashboard: npm run dev');
      console.log(`  - Check Knowledge Lake: curl "${KNOWLEDGE_LAKE_URL}/api/stats?userId=1"\n`);
    }

  } catch (error: any) {
    console.error('💥 Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run ingestion
ingestConversation();
