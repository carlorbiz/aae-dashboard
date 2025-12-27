# DocsAutomator Workflow: File Artifact Management for Knowledge Lake

## Critical Use Case

**Problem:** The Knowledge Lake needs to track which files and artifacts are accessible to LLMs through the AAE infrastructure.

**Solution:** DocsAutomator automatically creates Google Docs, saves them to Google Drive, and captures the Drive URLs in Notion's file repository database. This enables:
- Complete visibility of LLM-accessible files
- Artifact versioning and tracking
- Centralized file repository in Notion
- Knowledge Lake awareness of available resources

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Ingestion Process                        │
│  (Conversations, Transcripts, Artifacts from Slack, etc.)   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              DocsAutomator API Integration                   │
│  - Creates Google Doc from content                          │
│  - Applies template formatting                              │
│  - Saves to Google Drive                                    │
│  - Returns Google Drive URL                                 │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│           Notion File Repository Database                    │
│  - Stores file metadata                                     │
│  - Captures Google Drive URL                                │
│  - Links to source conversation/artifact                    │
│  - Tags and categorizes files                               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│               Knowledge Lake API                             │
│  - Ingests file metadata from Notion                        │
│  - Makes files discoverable to AI agents                    │
│  - Provides file URLs for LLM access                        │
│  - Tracks file relationships                                │
└─────────────────────────────────────────────────────────────┘
```

## API Integration Configuration

### DocsAutomator Endpoint
```
Base URL: https://api.docsautomator.co
Authorization: Bearer 3e634bb0-452f-46b8-9ed2-d19ba4e0c1dc
```

### Available in AAE Dashboard
**Platform Integrations** → **DocsAutomator**
- Status: Connected
- Last Synced: [Timestamp]
- Features:
  - Automated Google Docs creation
  - Template-based document generation
  - Google Drive URL capture
  - File artifact management
  - Notion database integration
  - Knowledge Lake file repository sync

## Workflow Steps

### 1. Content Ingestion
```typescript
// Example: Slack conversation captured
const conversation = {
  id: "conv_123",
  agent: "Manus",
  userId: "carla",
  content: "Detailed discussion about course architecture...",
  artifacts: ["whiteboard_sketch.png", "outline.md"]
};
```

### 2. DocsAutomator API Call
```typescript
// Create Google Doc from conversation
const response = await fetch("https://api.docsautomator.co/createDocument", {
  method: "POST",
  headers: {
    "Authorization": "Bearer 3e634bb0-452f-46b8-9ed2-d19ba4e0c1dc",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    docId: "template_123",  // DocsAutomator template ID
    documentName: `Conversation ${conversation.id} - ${conversation.agent}`,
    data: {
      conversation_content: conversation.content,
      agent_name: conversation.agent,
      timestamp: new Date().toISOString(),
      artifacts: conversation.artifacts
    }
  })
});

const { documentUrl, googleDriveUrl } = await response.json();
```

### 3. Notion Database Update
```typescript
// Update Notion File Repository Database
await notionClient.pages.create({
  parent: { database_id: NOTION_FILE_REPOSITORY_DB_ID },
  properties: {
    "File Name": {
      title: [{ text: { content: `Conversation ${conversation.id}` } }]
    },
    "Google Drive URL": {
      url: googleDriveUrl  // ← Critical: This makes it accessible
    },
    "Source Type": {
      select: { name: "Conversation" }
    },
    "Agent": {
      select: { name: conversation.agent }
    },
    "Conversation ID": {
      number: parseInt(conversation.id.replace("conv_", ""))
    },
    "Created Date": {
      date: { start: new Date().toISOString() }
    },
    "Artifacts": {
      multi_select: conversation.artifacts.map(name => ({ name }))
    }
  }
});
```

### 4. Knowledge Lake Sync
```typescript
// Knowledge Lake ingests file metadata from Notion
await fetch("https://knowledge-lake-api-production.up.railway.app/api/conversations/ingest", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topic: `File: Conversation ${conversation.id}`,
    content: conversation.content,
    agent: conversation.agent,
    userId: "carla",
    metadata: {
      fileType: "google_doc",
      googleDriveUrl: googleDriveUrl,  // ← LLMs can access this
      notionPageUrl: notionPageUrl,
      artifacts: conversation.artifacts,
      processedBy: "DocsAutomator"
    }
  })
});
```

## Key Benefits

### 1. LLM Accessibility Tracking
**Problem:** Without this workflow, LLMs don't know which files they can access.

**Solution:** Every file created through DocsAutomator is:
- Stored in Google Drive (accessible to authorized LLMs)
- Tracked in Notion (human-readable file repository)
- Indexed in Knowledge Lake (AI-searchable)
- Linked to source conversations (maintains context)

### 2. Artifact Preservation
**Problem:** File artifacts from conversations (whiteboards, outlines, diagrams) get lost.

**Solution:** DocsAutomator captures artifacts and embeds them in the generated Google Doc, preserving visual context.

### 3. Version Control
**Problem:** Multiple revisions of the same content create confusion.

**Solution:** Each DocsAutomator creation is timestamped and linked to the source conversation, enabling version tracking.

### 4. Cross-Agent Collaboration
**Problem:** Different AI agents (Claude, Manus, Fred) can't see each other's work.

**Solution:** All agents can query the Knowledge Lake to discover files created by other agents, enabling true collaboration.

## Example Query Flow

```typescript
// AI agent querying for accessible files
const filesQuery = await fetch(
  "https://knowledge-lake-api-production.up.railway.app/api/conversations/search",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "course architecture files",
      userId: 1,
      limit: 10
    })
  }
);

const results = await filesQuery.json();

// Results include Google Drive URLs that LLMs can access
results.forEach(file => {
  console.log(`File: ${file.topic}`);
  console.log(`URL: ${file.metadata.googleDriveUrl}`);
  console.log(`Created by: ${file.agent}`);
  console.log(`Artifacts: ${file.metadata.artifacts.join(", ")}`);
});
```

## Notion Database Schema

### File Repository Database (Required Fields)
- **File Name** (Title) - Name of the generated document
- **Google Drive URL** (URL) - Direct link to Google Doc
- **Source Type** (Select) - Origin of the file (Conversation, Transcript, Manual, etc.)
- **Agent** (Select) - Which AI agent created/processed this
- **Conversation ID** (Number) - Links to Knowledge Lake conversation
- **Created Date** (Date) - When the file was generated
- **Artifacts** (Multi-select) - Associated artifacts (images, diagrams, code)
- **Status** (Select) - Processing status (Draft, Published, Archived)
- **Tags** (Multi-select) - Categorization tags

## Integration Endpoints

### Available via AAE Dashboard

**Location:** Platform Integrations → DocsAutomator

**Endpoints Exposed:**
1. `POST /create_document` - Create Google Doc from template
2. `GET /get_automations` - List available templates
3. `GET /document/{documentId}` - Get document status
4. `PATCH /document/{documentId}` - Update document

**Metadata Stored:**
```json
{
  "apiCredentials": {
    "headers": {
      "Authorization": "Bearer 3e634bb0-452f-46b8-9ed2-d19ba4e0c1dc",
      "Content-Type": "application/json"
    }
  },
  "baseUrl": "https://api.docsautomator.co",
  "description": "DocsAutomator API for automated Google Docs creation and file artifact management",
  "features": [
    "Automated Google Docs creation",
    "Template-based document generation",
    "Google Drive URL capture",
    "File artifact management",
    "Notion database integration",
    "Knowledge Lake file repository sync"
  ]
}
```

## n8n Workflow Integration

### Trigger: Slack Message Received
1. **Slack Trigger Node** - Captures message with file attachments
2. **DocsAutomator Node** - Creates Google Doc from message content
3. **Notion Node** - Updates File Repository Database with Drive URL
4. **Knowledge Lake Node** - Ingests file metadata for AI access
5. **Slack Node** - Confirms file saved with Drive link

### Example n8n Configuration
See: `cc-slack-integration/Manus-DocsAutomator-solutions/mcp_servers/N8N_INTEGRATION_GUIDE.md`

## MCP Server Access

### Location
`cc-slack-integration/Manus-DocsAutomator-solutions/mcp_servers/docsautomator/`

### Usage
```python
# MCP server exposes DocsAutomator as FastAPI service
from mcp_servers.docsautomator import create_document, get_automations

# Create document
result = await create_document(
    doc_id="template_123",
    document_name="My Course Outline",
    data={"content": "...", "artifacts": [...]},
)

print(result["googleDriveUrl"])  # Use this URL in Notion!
```

## Troubleshooting

### Issue: Google Drive URL not captured in Notion
**Cause:** DocsAutomator response not parsed correctly
**Solution:** Verify response structure matches expected schema

### Issue: Knowledge Lake can't access files
**Cause:** Notion database not synced to Knowledge Lake
**Solution:** Verify n8n Notion→Knowledge Lake workflow is active

### Issue: LLMs can't open Google Drive links
**Cause:** Permission restrictions on Google Drive
**Solution:** Ensure Drive files are shared with appropriate service accounts

## Next Steps

1. **Deploy Migration:** Run `add_gamma_docsautomator_platforms_2025_12_27.sql`
2. **Seed Platforms:** Run `npm run seed:platforms <userId>`
3. **Verify Dashboard:** Check Platform Integrations page shows DocsAutomator
4. **Test Workflow:** Create a test document and verify Drive URL in Notion
5. **Query Knowledge Lake:** Confirm LLMs can discover the new file

## Last Updated
2025-12-27 - Initial documentation for DocsAutomator file artifact workflow
