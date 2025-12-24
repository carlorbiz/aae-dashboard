# Knowledge Lake API - Up-to-Date Status Document

**Last Updated:** December 24, 2025 01:10 UTC
**Status:** 🟢 OPERATIONAL
**Version:** 2.1.0 (with classification extensions)

---

## 🌐 Production Deployment

### Primary Endpoint
```
https://knowledge-lake-api-production.up.railway.app
```

### Health Check
```bash
curl -s https://knowledge-lake-api-production.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "2.1.0_database_persistence"
}
```

---

## 📊 Current Database Status

**As of:** 2025-12-24 01:00 UTC

| Metric | Count |
|--------|-------|
| **Total Conversations** | 169 |
| **Total Entities** | 133 |
| **Total Relationships** | 0 |
| **Complex Conversations** | 7 (flagged for multi-pass) |
| **Simple Conversations** | 162 |

**Growth Timeline:**
- **Session Start (Dec 22):** 152 conversations
- **After Markdown Batch:** 164 (+12)
- **After JSONL Batch:** 169 (+5)
- **Total Growth:** +17 conversations (+11.2%)

---

## 🔧 API Endpoints

### 1. Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. Statistics
```bash
GET /api/stats
```

**Response:**
```json
{
  "totalConversations": 169,
  "totalEntities": 133,
  "totalRelationships": 0
}
```

### 3. Query Conversations
```bash
POST /api/query
Content-Type: application/json

{
  "userId": 1,
  "query": "search term",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "user_id": 1,
      "topic": "Conversation Title",
      "date": "2025-12-22",
      "content": "Full conversation content...",
      "created_at": "2025-12-22T21:43:00Z",
      "complexity_classification": "complex",
      "complexity_score": 85.0,
      "word_count": 10672,
      "topic_shift_count": 5,
      "breakthrough_moment_count": 3,
      "requires_multipass": true,
      "multipass_extracted": false
    }
  ]
}
```

### 4. Search Conversations (Alternative Endpoint)
```bash
POST /api/conversations/search
Content-Type: application/json

{
  "query": "search term",
  "limit": 5
}
```

### 5. Ingest Conversation
```bash
POST /api/conversations
Content-Type: application/json

{
  "userId": 1,
  "topic": "Conversation Title",
  "content": "Full conversation markdown...",
  "conversationDate": "2025-12-24",
  "entities": [],
  "relationships": [],
  "metadata": {
    "agent": "claude_code",
    "complexity_classification": "complex",
    "complexity_score": 85.0,
    "word_count": 10672,
    "topic_shift_count": 5,
    "requires_multipass": true
  }
}
```

---

## 🗄️ Database Schema

### PostgreSQL Database (Railway)

**Database:** `railway`
**Connection:** Via `$DATABASE_URL` environment variable

### Conversations Table

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    topic VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Classification Columns (Added Day 1)
    complexity_classification VARCHAR(20),  -- 'simple', 'complex', 'manual_review'
    complexity_score DECIMAL(5,2),          -- 0-100
    word_count INTEGER,
    topic_shift_count INTEGER,
    breakthrough_moment_count INTEGER,
    requires_multipass BOOLEAN DEFAULT FALSE,
    multipass_extracted BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_date ON conversations(date);
CREATE INDEX idx_conversations_complexity ON conversations(complexity_classification);
```

### Entities Table

```sql
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entities_conversation_id ON entities(conversation_id);
```

### Relationships Table

```sql
CREATE TABLE relationships (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    from_entity TEXT NOT NULL,
    to_entity TEXT NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_relationships_conversation_id ON relationships(conversation_id);
```

---

## 🚀 Recent Updates (Day 1-3 Sprint)

### Day 1: Database Migration ✅
**Date:** December 22, 2025

**Changes:**
- Added 7 classification columns to `conversations` table
- Created 3 new indexes for query optimization
- Migrated existing 152 conversations with default values

**Migration SQL:** [scripts/migrations/001_add_classification_columns.sql](../scripts/migrations/001_add_classification_columns.sql)

### Day 2: Classification Integration ✅
**Date:** December 23, 2025

**Changes:**
- Classification algorithm integrated into ingestion pipeline
- Automatic flagging of complex conversations (`requires_multipass: true`)
- Classification metadata stored for all new conversations

### Day 3: Batch Ingestion ✅
**Date:** December 24, 2025

**Changes:**
- 17 new conversations ingested with classification
- 7 complex conversations flagged for multi-pass extraction
- Knowledge Lake grew from 152 → 169 conversations

---

## 📖 Classification System

### Complexity Detection Rules

**Simple Conversations:**
- Word count < 5,000 words
- Topic shifts < 3
- Breakthrough moments < 2
- `requires_multipass: false`

**Complex Conversations:**
- Word count >= 5,000 words OR
- Topic shifts >= 3 OR
- Breakthrough moments >= 2
- `requires_multipass: true`

**Manual Review:**
- Edge cases that don't clearly fit
- Unusual conversation patterns

### Classification Algorithm

**Implemented in:** [scripts/classify_conversation.py](../scripts/classify_conversation.py)

**Metrics Calculated:**
1. **Word Count:** Total words in conversation
2. **Topic Shifts:** Number of major topic changes
3. **Breakthrough Moments:** Key insights or discoveries
4. **Complexity Score:** Weighted combination (0-100)

**Scoring Formula:**
```python
complexity_score = (
    (word_count / 100) * 0.4 +
    (topic_shift_count * 10) * 0.3 +
    (breakthrough_moment_count * 10) * 0.3
)
```

---

## 🔌 Client Integration

### Python Client (Knowledge Lake MCP)

**Location:** `agent-conversations/claude/claude-knowledge-lake-mcp/claude-knowledge-lake-mcp/knowledge_lake.py`

**Usage:**
```python
from knowledge_lake import KnowledgeLakeClient

client = KnowledgeLakeClient()

# Ingest conversation
await client.ingest_conversation(
    topic="Conversation Title",
    content="Full conversation...",
    conversation_date="2025-12-24",
    entities=[],
    relationships=[],
    metadata={
        "agent": "claude_code",
        "complexity_classification": "complex",
        "requires_multipass": true
    }
)

# Query conversations
results = await client.query_conversations(
    query="search term",
    limit=10
)
```

### Direct API Access (Jan/External Agents)

**Script:** [scripts/jan_query_knowledge_lake.py](../scripts/jan_query_knowledge_lake.py)

```bash
python scripts/jan_query_knowledge_lake.py "search query"
```

**Example:**
```bash
python scripts/jan_query_knowledge_lake.py "hybrid architecture" --limit 5
```

---

## 🛠️ Batch Ingestion Tools

### 1. Batch Ingest Conversations

**Script:** [scripts/batch_ingest_conversations.py](../scripts/batch_ingest_conversations.py)

**Usage:**
```bash
# Scan and ingest markdown files
python scripts/batch_ingest_conversations.py agent-conversations/ --yes

# Dry run (preview only)
python scripts/batch_ingest_conversations.py agent-conversations/ --dry-run

# Custom pattern
python scripts/batch_ingest_conversations.py conversations/ --pattern "*.txt"
```

**Features:**
- Automatic classification
- Duplicate detection
- Multi-pass flagging
- UTF-8 encoding support (Windows)

### 2. Export JSONL Conversations

**Script:** [scripts/export_jsonl_conversations.py](../scripts/export_jsonl_conversations.py)

**Usage:**
```bash
# Export all conversations from Claude Code local storage
python scripts/export_jsonl_conversations.py --min-words 500

# Export everything
python scripts/export_jsonl_conversations.py --all
```

**What it does:**
- Parses Claude Code's local JSONL storage
- Extracts user/assistant messages
- Converts to markdown format
- Ready for batch ingestion

---

## 📊 Known Complex Conversations (Flagged for Multi-Pass)

| ID | Topic | Words | Date | Status |
|----|-------|-------|------|---------|
| ? | 2025-12-06 Hybrid Architecture | 184,304 | 2025-12-06 | ✅ Extracted |
| ? | 2025-11-17 Knowledge Lake | 97,626 | 2025-11-17 | ✅ Extracted |
| ? | 2025-12-03 Knowledge Graph | 18,937 | 2025-12-03 | ✅ Extracted |
| ? | Embed AI Avatar PWA | 5,988 | 2025-??-?? | ✅ Extracted |
| ? | Hybrid Architecture Plan | 3,808 | 2025-12-22 | ✅ Extracted |
| ? | CC Task Multipass System | 2,602 | 2025-12-22 | ✅ Extracted |
| ? | 2025-12-22 Architecture Evolution | 10,672 | 2025-12-22 | ✅ Extracted |

**Total Complex:** 7 conversations
**Extracted:** 7/7 (100%)
**Pending Multi-Pass:** 0

---

## 🎓 Multi-Pass Extraction System

### Extraction Tool

**Script:** [scripts/multipass_extract.py](../scripts/multipass_extract.py)

**5-Pass System:**
1. **Pass 1:** Segmentation (identify topic threads)
2. **Pass 2:** Connection Mapping (relationships between threads)
3. **Pass 3:** Per-Thread Learning (extract insights)
4. **Pass 4:** Cross-Thread Insights (emergent patterns)
5. **Pass 5:** Thinking Pattern Analysis (meta-learning)

**Usage:**
```bash
python scripts/multipass_extract.py conversation.md --output extraction-report.md
```

**Output:**
- Markdown extraction report
- JSON data file with all extracted data
- Saved to Google Drive for archival

### Extraction Results (Day 3)

**Total Extractions:** 7 conversations
**Total Words Processed:** 324,745 words
**Total Threads Identified:** 111
**Total Connections Mapped:** 2,466
**Total Learnings Extracted:** 178
**Total Cross-Thread Insights:** 71

---

## 🚦 System Health & Monitoring

### Current Status: 🟢 Healthy

**Last Verified:** 2025-12-24 01:00 UTC

**Health Checks:**
```bash
# API Health
curl -s https://knowledge-lake-api-production.up.railway.app/health

# Database Stats
curl -s https://knowledge-lake-api-production.up.railway.app/api/stats

# Test Query
curl -X POST https://knowledge-lake-api-production.up.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "query": "test", "limit": 1}'
```

### Known Issues

**None currently**

### Recent Fixes (Day 2-3)

1. **UTF-8 Encoding:** Fixed Windows console emoji/unicode errors
2. **CORS Configuration:** API accessible from all origins
3. **Duplicate Detection:** Fixed attribute error in duplicate checking
4. **Git Secrets:** Excluded conversation exports with API keys from version control

---

## 📝 Configuration

### Environment Variables (Railway)

```bash
# Database
DATABASE_URL=postgresql://postgres:...@...railway.app/railway

# API Configuration
PORT=5000
HOST=0.0.0.0

# Optional: OpenAI API (for future LLM features)
OPENAI_API_KEY=sk-...
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python api_server.py
```

**Local URL:** `http://localhost:5000`

---

## 🔄 Integration Points

### AAE Council Agents

**Agents with Knowledge Lake Access:**
1. **Claude Code (CC)** - MCP client via `knowledge_lake.py`
2. **Claude GUI** - Direct API access
3. **Jan (Genspark)** - Direct API via `jan_query_knowledge_lake.py`
4. **Manus** - MCP client + direct API
5. **Fred (ChatGPT)** - Future integration planned
6. **Gemini** - Future integration planned

### Notion Integration

**Multi-Pass Queue Database (Day 4):**
- Track extraction status
- Priority management
- Link to Knowledge Lake conversations
- Automated status updates

---

## 📚 Related Documentation

1. **CLAUDE.md** - CC Context Sync Protocol (outdated API info - use this doc instead)
2. **docs/BATCH_INGESTION_COMPLETE.md** - Complete Day 2-3 session summary
3. **docs/JSONL_EXPORT_GUIDE.md** - JSONL conversation export guide
4. **scripts/DAY_1_PROGRESS.md** - Database migration details
5. **scripts/DAY_2_COMPLETE.md** - Multi-pass extraction tool completion
6. **scripts/DAY_3_COMPLETE.md** - Extraction results and archive

---

## 🎯 Roadmap

### Day 4 (Next)
- [ ] Notion Multi-Pass Queue database
- [ ] Automation scripts for queue updates
- [ ] GUI delegation workflow testing
- [ ] Production deployment of auto-classification

### Future Enhancements
- [ ] LLM-powered learning extraction refinement
- [ ] Entity relationship extraction
- [ ] Timeline reconstruction
- [ ] Sentiment analysis
- [ ] Real-time conversation streaming
- [ ] GraphQL API layer

---

## 💡 Quick Reference Commands

### Health Check
```bash
curl -s https://knowledge-lake-api-production.up.railway.app/health | python -m json.tool
```

### Get Stats
```bash
curl -s https://knowledge-lake-api-production.up.railway.app/api/stats | python -m json.tool
```

### Query Conversations
```bash
curl -X POST https://knowledge-lake-api-production.up.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "query": "architecture", "limit": 5}' | python -m json.tool
```

### Batch Ingest
```bash
python scripts/batch_ingest_conversations.py agent-conversations/ --yes
```

### Export JSONL
```bash
python scripts/export_jsonl_conversations.py --min-words 500
```

### Multi-Pass Extract
```bash
python scripts/multipass_extract.py conversation.md --output report.md
```

---

*Document Created: 2025-12-24 01:10 UTC*
*Maintained by: Claude Code (CC)*
*Update Frequency: After major changes*
*Next Update: After Day 4 completion*
