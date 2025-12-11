# Complete Conversation Ingestion Workflow

**Last Updated**: November 30, 2025
**Status**: ✅ Production Ready

---

## 🎯 Overview

This document describes the complete end-to-end workflow for capturing, processing, and ingesting LLM conversations into the AAE Dashboard Knowledge Graph.

### The Three-Step Process

```
Monthly Dumps → Split & Clean → Batch Ingest → Knowledge Graph
    (Manual)       (Automated)      (Automated)      (Queryable)
```

---

## 📋 Step 1: Create Monthly Dump Files

### File Naming Convention

```
conversations/monthly-dumps/{agent}/{Agent}_{YYYY-MM}.md
```

**Examples**:
- `conversations/monthly-dumps/claude/Claude_2024-11.md`
- `conversations/monthly-dumps/fred/Fred_2025-01.md`
- `conversations/monthly-dumps/gemini/Gemini_2024-12.md`

### File Format

Create a single `.md` file per agent per month with **minimal formatting**:

```markdown
Date: 2024-11-01
Topic: Notion Integration Setup

user: How do I set up the Notion integration?

claude: To set up Notion integration, you'll need to...

===

Date: 2024-11-05
Topic: Database Schema Design

user: What's the best way to design the entities table?

claude: For the entities table, I recommend...

===

Date: 2024-11-10

user: Can you help me debug the tRPC endpoint?

claude: Sure! Let's check the endpoint configuration...
```

### Key Requirements

1. **Separator Lines**: Use `===`, `---`, or `***` (at least 3 characters) to separate conversations
2. **Optional Metadata**: Include date/topic if available, but script will auto-extract if missing
3. **Natural Content**: Paste conversation content as-is, no special formatting needed
4. **Participant Names**: Use natural names (user, claude, fred, gemini, etc.)

### Where to Get Content

| Platform | Export Method |
|----------|---------------|
| **Claude Web** | Copy/paste from conversation history |
| **Claude Desktop** | File → Export Conversation |
| **ChatGPT** | Settings → Data Controls → Export |
| **Google AI Studio** | Copy conversation from history panel |
| **Grok (X.com)** | Copy from conversation thread |
| **Gemini CLI** | Already saved in `conversations/exports/` |

---

## ⚙️ Step 2: Split Monthly Dumps

### Command

```bash
cd github-projects/aae-dashboard
npx tsx scripts/split-monthly-dump.ts <monthly-file.md>
```

### Example

```bash
npx tsx scripts/split-monthly-dump.ts conversations/monthly-dumps/claude/Claude_2024-11.md
```

### What This Does

1. **Reads** the monthly dump file
2. **Detects** conversation boundaries using separator patterns
3. **Extracts** metadata:
   - Date (from headers or content)
   - Topic (from first user message or key technologies)
   - Participants (from message prefixes)
4. **Generates** individual conversation files with standardized headers
5. **Outputs** to `conversations/processed/` directory

### Output Format

Generated files follow this naming convention:
```
{Agent}_{YYYYMMDD}_{Topic}_{N}.md
```

**Example**: `Claude_20241101_NotionIntegrationSetup_1.md`

### Sample Output

```markdown
# Conversation with Claude
**Date**: 2024-11-01
**Participants**: Carla, Claude
**Topics**: Notion Integration Setup
**Source**: Claude_2024-11.md (lines 1-45)

---

user: How do I set up the Notion integration?

claude: To set up Notion integration, you'll need to...
```

### Expected Console Output

```
📥 Processing monthly conversation dump...

📄 Source: conversations/monthly-dumps/claude/Claude_2024-11.md

🤖 Agent: Claude
📏 File size: 24.50 KB

🔍 Detecting conversation boundaries...
✅ Found 12 conversations

📝 Creating individual conversation files...

  ✅ Created: Claude_20241101_NotionIntegrationSetup_1.md
     Date: 2024-11-01
     Topic: Notion Integration Setup
     Size: 3.20 KB

  ✅ Created: Claude_20241105_DatabaseSchemaDesign_2.md
     Date: 2024-11-05
     Topic: Database Schema Design
     Size: 2.80 KB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Processing Summary:
   ✅ Success: 12 files
   ❌ Failed: 0 files
   📁 Output: conversations/processed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Next steps:
   1. Review files in: conversations/processed
   2. Run batch ingestion: npx tsx scripts/batch-ingest.ts
```

---

## 🚀 Step 3: Batch Ingestion

### Command

```bash
cd github-projects/aae-dashboard
npx tsx scripts/batch-ingest.ts [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Validate files without ingesting | `false` |
| `--auto-promote` | Promote entities to DRAFT state | `false` (stays RAW) |
| `--help`, `-h` | Show help message | - |

### Examples

```bash
# Dry run to validate all files
npx tsx scripts/batch-ingest.ts --dry-run

# Actual ingestion (entities stay RAW)
npx tsx scripts/batch-ingest.ts

# Ingest and auto-promote to DRAFT
npx tsx scripts/batch-ingest.ts --auto-promote
```

### What This Does

1. **Scans** `conversations/processed/` directory for `.md` files
2. **Ingests** each file using the knowledge graph ingestion system
3. **Tracks** success/failure, entities created, relationships created
4. **Archives** successfully ingested files to `conversations/exports/archive/`
5. **Reports** comprehensive summary statistics

### Expected Console Output

```
🔄 Batch Conversation Ingestion

📂 Source: conversations/processed
📦 Archive: conversations/exports/archive
👤 User ID: 1
🎯 Auto-promote: No (stay RAW)
🧪 Dry run: No (actual ingestion)

📋 Found 12 conversation files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/12]
  📄 Processing: Claude_20241101_NotionIntegrationSetup_1.md
     ✅ Success in 45ms
        Entities: 8
        Relationships: 2
     📦 Archived to: Claude_20241101_NotionIntegrationSetup_1.md

[2/12]
  📄 Processing: Claude_20241105_DatabaseSchemaDesign_2.md
     ✅ Success in 52ms
        Entities: 12
        Relationships: 4
     📦 Archived to: Claude_20241105_DatabaseSchemaDesign_2.md

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Batch Ingestion Summary

   Total Files: 12
   ✅ Successful: 12
   ❌ Failed: 0

   📊 Knowledge Graph Impact:
   Entities Created: 87
   Relationships Created: 23

   ⏱️  Total Duration: 0.68s
   ⏱️  Avg per File: 57ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Next Steps:

   1. View entities in database:
      wsl wrangler d1 execute aae-dashboard-db --command "SELECT COUNT(*) FROM entities"

   2. Query by entity type:
      wsl wrangler d1 execute aae-dashboard-db --command "SELECT entityType, COUNT(*) FROM entities GROUP BY entityType"

   3. Browse archived files:
      explorer "conversations/exports/archive"
```

---

## 🔍 Step 4: Query the Knowledge Graph

### Total Entities

```bash
wsl wrangler d1 execute aae-dashboard-db --command "SELECT COUNT(*) FROM entities"
```

### Entities by Type

```bash
wsl wrangler d1 execute aae-dashboard-db --command "SELECT entityType, COUNT(*) as count FROM entities GROUP BY entityType ORDER BY count DESC"
```

**Example Output**:
```
┌───────────────────────┬───────┐
│ entityType            │ count │
├───────────────────────┼───────┤
│ Technology            │ 45    │
│ Agents                │ 18    │
│ Consulting            │ 12    │
│ ExecutiveAI           │ 8     │
│ Content               │ 3     │
│ ClientIntelligence    │ 1     │
└───────────────────────┴───────┘
```

### Top Entities by Confidence

```bash
wsl wrangler d1 execute aae-dashboard-db --command "SELECT name, entityType, JSON_EXTRACT(properties, '$.confidence') as confidence FROM entities ORDER BY confidence DESC LIMIT 20"
```

### All Relationships

```bash
wsl wrangler d1 execute aae-dashboard-db --command "SELECT COUNT(*) FROM relationships"
```

### Relationships by Type

```bash
wsl wrangler d1 execute aae-dashboard-db --command "SELECT relationshipType, COUNT(*) as count FROM relationships GROUP BY relationshipType ORDER BY count DESC"
```

### Specific Entity Details

```bash
wsl wrangler d1 execute aae-dashboard-db --command "SELECT * FROM entities WHERE name LIKE '%Notion%'"
```

### Entity Relationships

```bash
wsl wrangler d1 execute aae-dashboard-db --command "
SELECT
  e1.name as from_entity,
  r.relationshipType,
  e2.name as to_entity
FROM relationships r
JOIN entities e1 ON r.fromEntityId = e1.id
JOIN entities e2 ON r.toEntityId = e2.id
LIMIT 20
"
```

---

## 📁 Directory Structure

```
conversations/
├── monthly-dumps/          # Manual: Create monthly dump files here
│   ├── claude/
│   │   └── Claude_2024-11.md
│   ├── fred/
│   │   └── Fred_2025-01.md
│   └── gemini/
│       └── Gemini_2024-12.md
│
├── processed/              # Auto: Split script outputs here
│   ├── Claude_20241101_NotionIntegrationSetup_1.md
│   ├── Claude_20241105_DatabaseSchemaDesign_2.md
│   └── ...
│
└── exports/
    └── archive/            # Auto: Batch ingest moves files here
        ├── Claude_20241101_NotionIntegrationSetup_1.md
        └── ...
```

---

## 🎯 Complete Example Workflow

### 1. Create Monthly Dump

Create `conversations/monthly-dumps/claude/Claude_2024-11.md`:

```markdown
Date: 2024-11-01

user: How do I set up Notion?

claude: You'll need to create an integration...

===

Date: 2024-11-05

user: Database schema help needed

claude: Let's design the entities table...
```

### 2. Split Conversations

```bash
npx tsx scripts/split-monthly-dump.ts conversations/monthly-dumps/claude/Claude_2024-11.md
```

**Result**: 2 files created in `conversations/processed/`

### 3. Dry Run (Optional)

```bash
npx tsx scripts/batch-ingest.ts --dry-run
```

**Result**: Validation only, no database changes

### 4. Batch Ingest

```bash
npx tsx scripts/batch-ingest.ts
```

**Result**:
- 2 files ingested
- Entities created (e.g., "Notion", "Database", "Schema")
- Files moved to archive

### 5. Query Results

```bash
wsl wrangler d1 execute aae-dashboard-db --command "SELECT entityType, COUNT(*) FROM entities GROUP BY entityType"
```

**Result**: See entity distribution

---

## 🔧 Troubleshooting

### Issue: "No .md files found in source directory"

**Solution**: Run `split-monthly-dump.ts` first to generate conversation files.

### Issue: "Database not available"

**Solution**: Ensure `DATABASE_URL` is set or server is running with D1 bindings.

### Issue: "No conversations detected"

**Solution**: Check separator format in monthly dump file. Use `===`, `---`, or `***` (at least 3 chars).

### Issue: Duplicate entities created

**Solution**: The system uses fuzzy matching (85% similarity threshold). Highly similar entities are automatically skipped.

### Issue: Missing dates or topics

**Solution**: The script auto-extracts from content if metadata headers are missing. Add explicit date/topic headers for better accuracy.

---

## 📊 Performance Benchmarks

Based on initial testing:

| Metric | Value |
|--------|-------|
| File read speed | ~50 KB/s |
| Entity extraction | ~15-20 entities per conversation |
| Ingestion speed | ~50-70ms per file |
| Duplicate detection | 85% similarity threshold |
| Batch processing | ~1 file/second (including archiving) |

**Example**: A monthly dump with 30 conversations:
- Split time: ~2 seconds
- Ingest time: ~30 seconds
- Total entities: ~450-600
- Total time: <1 minute

---

## 🎓 Best Practices

### Creating Monthly Dumps

1. **Consistency**: Create dumps at the same time each month
2. **Naming**: Follow the `{Agent}_{YYYY-MM}.md` convention
3. **Separators**: Use consistent separator style (recommend `===`)
4. **Metadata**: Add date headers when available (reduces auto-extraction errors)
5. **Topics**: Optional but helpful for browsing archives

### Quality Control

1. **Dry Run First**: Always run `--dry-run` before actual ingestion
2. **Spot Check**: Review a few files in `conversations/processed/` before batch ingest
3. **Monitor Logs**: Watch for entity extraction patterns and adjust if needed
4. **Query After**: Run entity count queries to verify ingestion

### Ongoing Maintenance

1. **Monthly Rhythm**: Capture conversations at end of each month
2. **Archive Management**: Keep archives organized by agent and date
3. **Database Backups**: Regular backups of D1 database recommended
4. **Semantic Promotion**: Review RAW entities periodically, promote to DRAFT/COOKED as appropriate

---

## 🚀 Advanced Usage

### Custom User ID

The default user ID is `1` (Carla). To use a different user:

Edit `scripts/batch-ingest.ts`, line 280:
```typescript
const userId = 2; // Change to desired user ID
```

### Custom Directories

The default directories are:
- Source: `conversations/processed/`
- Archive: `conversations/exports/archive/`

To use custom directories, edit lines 278-279 in `batch-ingest.ts`.

### Entity Type Customization

The system detects 6 entity types:
1. **Agents**: AI assistants (Claude, Fred, Gemini, etc.)
2. **Technology**: Tools, platforms, frameworks
3. **ExecutiveAI**: Strategic concepts, systems
4. **Content**: Documents, courses, materials
5. **Consulting**: Projects, engagements, strategies
6. **ClientIntelligence**: Insights, patterns, knowledge

To modify extraction patterns, edit `lib/ingestion/entity-extraction.ts`.

---

## ✅ Validation Checklist

Before running batch ingestion:

- [ ] Monthly dump file created in `conversations/monthly-dumps/{agent}/`
- [ ] Separator lines (`===`) between conversations
- [ ] Database accessible (test with wrangler d1 execute)
- [ ] Split script run successfully (files in `conversations/processed/`)
- [ ] Dry run completed without errors
- [ ] Archive directory exists (`conversations/exports/archive/`)

After batch ingestion:

- [ ] All files successfully ingested (check summary)
- [ ] Files moved to archive
- [ ] Entity count increased (query database)
- [ ] No failed files in summary
- [ ] Relationship count matches expectations

---

## 🎯 Success Metrics

Track these metrics over time:

| Metric | Description | Query |
|--------|-------------|-------|
| **Total Entities** | All entities in knowledge graph | `SELECT COUNT(*) FROM entities` |
| **Entity Growth** | New entities per month | Track delta between monthly ingestions |
| **Entity Types** | Distribution across 6 types | `SELECT entityType, COUNT(*) ... GROUP BY` |
| **Relationships** | Total entity connections | `SELECT COUNT(*) FROM relationships` |
| **Semantic Maturity** | RAW → DRAFT → COOKED → CANONICAL progression | `SELECT semanticState, COUNT(*) ... GROUP BY` |
| **Conversation Coverage** | % of conversations ingested | Track files archived vs. total conversations |

---

## 📚 Related Documentation

- [LIVE_TESTING_STATUS.md](LIVE_TESTING_STATUS.md) - Initial testing results
- [DAY2_KNOWLEDGE_INGESTION_COMPLETE.md](DAY2_KNOWLEDGE_INGESTION_COMPLETE.md) - Implementation details
- [INGESTION_QUICKSTART.md](INGESTION_QUICKSTART.md) - Quick start guide
- [scripts/split-monthly-dump.ts](scripts/split-monthly-dump.ts) - Split script source
- [scripts/batch-ingest.ts](scripts/batch-ingest.ts) - Batch ingest script source

---

**The Intelligent Corporate Brain is ready to learn from your conversations! 🧠**

---

*Last updated: November 30, 2025*
*Version: 1.0.0*
*Status: Production Ready*
