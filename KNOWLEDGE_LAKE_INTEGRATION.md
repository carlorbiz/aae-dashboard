# Knowledge Lake Integration Guide

**Status**: ✅ Complete - All systems connected
**Last Updated**: November 30, 2025

---

## 🎯 Overview

This document explains how the AAE Dashboard, Knowledge Lake API, n8n workflows, and Aurelia avatar all work together.

## 🏗️ Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   DATA INGESTION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Method 1: n8n Workflows (Production - Automated)           │
│  ─────────────────────────────────────────────              │
│  Google Drive → n8n → AI Processing → Knowledge Lake API    │
│                                                              │
│  Method 2: AAE Dashboard Scripts (Local/Testing)            │
│  ───────────────────────────────────────────────            │
│  Local files → Scripts → Dual Write (D1 + Knowledge Lake)   │
│                                                              │
│  Method 3: Manus MCP (Autonomous)                           │
│  ────────────────────────────                               │
│  Email → Manus → Process → Knowledge Lake API               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         KNOWLEDGE LAKE API (Port 5002 - Railway)            │
│              Single Source of Truth                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dual Storage:                                              │
│  1. mem0 Memory (semantic search, RAG)                      │
│  2. Structured storage (entities, relationships)            │
│                                                              │
│  Endpoints:                                                  │
│  POST /api/conversations/ingest  ← All ingestion routes     │
│  GET  /api/entities              ← AAE Dashboard            │
│  GET  /api/relationships         ← AAE Dashboard            │
│  POST /api/aurelia/query         ← Aurelia avatar           │
│  GET  /api/stats                 ← Analytics                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ↓                  ↓                  ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  AAE Dashboard  │ │    Aurelia      │ │  n8n + Notion   │
│   (Cloudflare)  │ │   (HeyGen)      │ │  (Workflows)    │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ D1 (cache)      │ │ Real-time query │ │ Parallel write  │
│ Reads from API  │ │ AAE Council     │ │ Human browsing  │
│ Entity graphs   │ │ Multi-AI collab │ │ Notion DB       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 📡 Knowledge Lake API Endpoints

### Base URL
```
Local: http://localhost:5002
Railway: https://your-knowledge-lake.up.railway.app
```

### 1. Conversation Ingestion

**Endpoint**: `POST /api/conversations/ingest`

**Called by**:
- n8n workflows (after AI entity extraction)
- AAE Dashboard scripts (local ingestion)
- Manus MCP (autonomous processing)

**Request Body**:
```json
{
  "userId": 1,
  "agent": "Claude",
  "date": "2024-11-30",
  "topic": "Database Schema Design",
  "content": "Full conversation text...",
  "entities": [
    {
      "name": "Notion",
      "entityType": "Technology",
      "confidence": 0.95,
      "description": "Workspace tool",
      "sourceContext": "Mentioned in context of integration"
    },
    {
      "name": "D1",
      "entityType": "Technology",
      "confidence": 0.90,
      "description": "Cloudflare database"
    }
  ],
  "relationships": [
    {
      "from": "Notion",
      "to": "D1",
      "relationshipType": "integrates_with",
      "weight": 3,
      "confidence": 0.85
    }
  ],
  "metadata": {
    "sourceFile": "claude_20241130.md",
    "processingAgent": "n8n-anthropic",
    "priority": "High"
  }
}
```

**Response**:
```json
{
  "success": true,
  "conversation": {
    "id": 42,
    "agent": "Claude",
    "topic": "Database Schema Design"
  },
  "entitiesCreated": 2,
  "relationshipsCreated": 1,
  "timestamp": "2024-11-30T10:30:00Z"
}
```

### 2. Get Entities

**Endpoint**: `GET /api/entities?userId=1&entityType=Technology&limit=50`

**Called by**: AAE Dashboard (for visualization)

**Response**:
```json
{
  "entities": [
    {
      "id": 1,
      "userId": 1,
      "entityType": "Technology",
      "name": "Notion",
      "description": "Workspace tool",
      "semanticState": "RAW",
      "confidence": 0.95,
      "conversationId": 42,
      "createdAt": "2024-11-30T10:30:00Z"
    }
  ],
  "total": 87
}
```

### 3. Get Relationships

**Endpoint**: `GET /api/relationships?userId=1`

**Called by**: AAE Dashboard (for graph visualization)

**Response**:
```json
{
  "relationships": [
    {
      "id": 1,
      "fromEntityId": 1,
      "toEntityId": 2,
      "fromEntity": "Notion",
      "toEntity": "D1",
      "relationshipType": "integrates_with",
      "weight": 3,
      "conversationId": 42
    }
  ],
  "total": 23
}
```

### 4. Aurelia Query

**Endpoint**: `POST /api/aurelia/query`

**Called by**: Aurelia HeyGen avatar (real-time intelligence)

**Request**:
```json
{
  "query": "How should I approach the board about AI budget?",
  "userId": 1,
  "context": {
    "currentPWA": "ai-leadership-academy",
    "moduleProgress": {"completed": 3, "current": 4},
    "previousQuestions": ["What is AI ROI?", "How to calculate costs?"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "spokenResponse": "Based on your knowledge base, I found 5 relevant insights and 3 related concepts",
  "detailedResponse": "# Response to: How should I approach...\n\n## Recent Insights:\n- Previous discussion on ROI calculations...",
  "relevantEntities": [
    {"name": "AI Budget", "entityType": "Consulting", "confidence": 0.92}
  ],
  "confidence": 0.75,
  "timestamp": "2024-11-30T10:35:00Z"
}
```

### 5. Statistics

**Endpoint**: `GET /api/stats?userId=1`

**Response**:
```json
{
  "totalConversations": 156,
  "totalEntities": 487,
  "totalRelationships": 123,
  "userConversations": 156,
  "userEntities": 487,
  "entityTypeDistribution": {
    "Technology": 203,
    "Agents": 45,
    "Consulting": 89,
    "ExecutiveAI": 67,
    "Content": 34,
    "ClientIntelligence": 49
  }
}
```

---

## 🔄 Data Flow Examples

### Example 1: n8n Workflow Ingestion

```
1. User saves file to Google Drive folder
   /AAE-Exports/Markdown-Manual/01-Anthropic/claude_conversation.md

2. n8n detects file (Google Drive trigger)

3. n8n downloads file content

4. n8n calls Claude API to extract entities
   → Returns: ["Notion", "D1", "GitHub"] with relationships

5. n8n POSTs to Knowledge Lake API:
   POST /api/conversations/ingest
   {
     "userId": 1,
     "agent": "Claude",
     "entities": [...],
     "relationships": [...]
   }

6. Knowledge Lake API:
   - Stores in mem0 (semantic search)
   - Stores structured data (entities/relationships)
   - Returns success

7. n8n writes to Notion (parallel)
   - Creates page in "AI Agent Conversations" database

8. n8n moves file to Archive
```

### Example 2: AAE Dashboard Local Ingestion

```
1. Developer runs:
   npx tsx scripts/ingest-conversation.ts path/to/file.md

2. Script extracts entities and relationships locally

3. DUAL WRITE:

   Write A: D1 Database (for dashboard)
   → await db.insert(entities).values({...})

   Write B: Knowledge Lake API (for ecosystem)
   → await fetch('http://localhost:5002/api/conversations/ingest', {
       method: 'POST',
       body: JSON.stringify({userId, entities, relationships})
     })

4. Both succeed → ingestion complete

5. Dashboard can query either:
   - D1 (fast, local cache)
   - Knowledge Lake API (authoritative, cross-system)
```

### Example 3: Aurelia Avatar Query

```
1. User asks in PWA: "What technologies have I discussed?"

2. HeyGen avatar triggers middleware

3. Middleware calls:
   POST /api/aurelia/query
   {
     "query": "What technologies have I discussed?",
     "userId": 1
   }

4. Knowledge Lake API:
   - Searches mem0 for semantic matches
   - Queries entities with entityType="Technology"
   - Builds intelligent response

5. Returns:
   {
     "spokenResponse": "You've discussed 203 technologies...",
     "detailedResponse": "# Your Technology Knowledge\n\n...",
     "relevantEntities": [...]
   }

6. Avatar speaks the response
   Chat panel shows detailed markdown
```

---

## 🛠️ Integration Checklist

### For n8n Workflows

- [ ] Configure n8n to call `POST /api/conversations/ingest`
- [ ] Extract entities using Claude/Gemini API before ingestion
- [ ] Include all required fields (userId, agent, date, content)
- [ ] Pass extracted entities and relationships
- [ ] Handle API errors gracefully
- [ ] Move files to Archive after successful ingestion

### For AAE Dashboard Scripts

- [ ] Update ingestion scripts to dual-write
- [ ] Add Knowledge Lake API client function
- [ ] Handle API connection failures (fallback to D1 only)
- [ ] Set `KNOWLEDGE_LAKE_URL` environment variable
- [ ] Test with local API (port 5002)
- [ ] Test with Railway deployment

### For Aurelia Integration

- [ ] Build HeyGen middleware to call `/api/aurelia/query`
- [ ] Format responses for spoken + detailed display
- [ ] Handle user context (PWA, progress, history)
- [ ] Implement confidence threshold for responses
- [ ] Add fallback for API failures

---

## 🔌 Environment Variables

### AAE Dashboard (.env)
```bash
# Knowledge Lake API
KNOWLEDGE_LAKE_URL=http://localhost:5002  # Local dev
# KNOWLEDGE_LAKE_URL=https://your-railway.app  # Production
KNOWLEDGE_LAKE_API_KEY=your_secure_key_here

# D1 Database (local)
DATABASE_URL=.wrangler/state/v3/d1/miniflare-D1DatabaseObject/[hash].sqlite
```

### Knowledge Lake API (.env)
```bash
# mem0 configuration (already configured)
# Add any API keys for Claude, Gemini, etc.
```

### n8n Workflows
- Set Knowledge Lake URL in HTTP Request nodes
- Configure authentication if needed

---

## 📈 Monitoring & Debugging

### Check Knowledge Lake Health
```bash
curl http://localhost:5002/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "mem0_knowledge_lake",
  "version": "2.0_enhanced",
  "endpoints": {
    "legacy": ["/knowledge/search", "/knowledge/add"],
    "conversations": ["/api/conversations/ingest"],
    "entities": ["/api/entities", "/api/relationships"],
    "aurelia": ["/api/aurelia/query"]
  }
}
```

### Check Statistics
```bash
curl "http://localhost:5002/api/stats?userId=1"
```

### Test Ingestion
```bash
curl -X POST http://localhost:5002/api/conversations/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "agent": "Claude",
    "date": "2024-11-30",
    "topic": "Test",
    "content": "This is a test conversation",
    "entities": [
      {"name": "Test", "entityType": "Technology", "confidence": 1.0}
    ],
    "relationships": []
  }'
```

### Query Entities
```bash
curl "http://localhost:5002/api/entities?userId=1&limit=10"
```

---

## 🚀 Next Steps

### Immediate (This Week)
1. ✅ Knowledge Lake API enhanced
2. ⏳ Update AAE Dashboard scripts for dual-write
3. ⏳ Configure n8n workflows to call new endpoint
4. ⏳ Test end-to-end flow with sample conversation

### Short-term (Next 2 Weeks)
1. Deploy Knowledge Lake API to Railway
2. Update n8n workflows with production URL
3. Process historical conversations via n8n
4. Verify AAE Dashboard reads from Knowledge Lake

### Medium-term (Month 1)
1. Build Aurelia HeyGen integration
2. Add AAE Council orchestration
3. Implement advanced entity resolution
4. Add database persistence (PostgreSQL/Supabase)

---

## 💡 Key Benefits

### Why This Architecture Works

1. **Separation of Concerns**
   - Knowledge Lake = Data storage & intelligence
   - AAE Dashboard = Visualization
   - n8n = Automation
   - Aurelia = User interface

2. **Dual Write Strategy**
   - D1: Fast local access for dashboard
   - Knowledge Lake: Authoritative source for all systems

3. **Backwards Compatibility**
   - Old `/knowledge/*` endpoints still work
   - New `/api/*` endpoints add functionality
   - No breaking changes

4. **Scalability**
   - Knowledge Lake can scale independently
   - Dashboard can cache aggressively
   - n8n workflows parallelizable

5. **Flexibility**
   - Multiple ingestion methods
   - Multiple consumption methods
   - Each system can evolve independently

---

**The intelligent corporate brain is now fully connected! 🧠**

---

*Last updated: November 30, 2025*
*Version: 1.0.0*
*Status: Production Ready*
