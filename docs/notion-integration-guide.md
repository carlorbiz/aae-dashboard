# Notion Integration Guide - AAE Best Practices

**Created:** 2025-12-12  
**Author:** Manus  
**Purpose:** Document working methods for Notion database operations and MCP integration issues

---

## Executive Summary

This guide documents the current state of Notion integrations within the Autonomous Agent Ecosystem (AAE), including known limitations, working solutions, and best practices for instructing Manus via scheduled emails, Slack, or UI.

---

## Current Integration Status

### Native Notion MCP
- **Status:** ✅ Read Access | ❌ Write Access
- **Working Operations:**
  - `notion-search`: Search for pages and databases
  - `notion-fetch`: Retrieve page/database content and schema
  - `notion-get-users`: Get user information
- **Failing Operations:**
  - `notion-create-pages`: Returns 404 "object_not_found" errors
  - Database writes fail even with correct database IDs
- **Root Cause:** OAuth integration lacks write permissions to specific databases

### Zapier MCP (Notion Actions)
- **Status:** ✅ Read Access | ⚠️ Partial Write Access
- **Working Operations:**
  - `notion_find_data_source_items`: Query database entries
  - `notion_query_data_source_advanced`: Advanced database queries
  - `notion_get_page_or_database_item_by_id`: Retrieve specific items
- **Failing Operations:**
  - `notion_create_data_source_item`: Property validation errors
  - Fails on title field parsing (expects id/name/start/lat fields)
- **Root Cause:** Zapier's Notion integration uses different property schema than native API

### Native Python API (via requests)
- **Status:** ❌ Not Available
- **Limitation:** OAuth tokens are managed by MCP servers, not directly accessible
- **Alternative:** Would require separate Notion integration token

---

## Working Solutions by Use Case

### 1. Reading Database Content
**Best Method:** Native Notion MCP `notion-fetch`

```bash
manus-mcp-cli tool call notion-fetch --server notion --input '{"id": "PAGE_ID"}'
```

**Use Cases:**
- Retrieve database schema
- Read existing entries
- Get database structure for planning

---

### 2. Adding Entries to Databases
**Best Method:** CSV Import (Manual)

**Process:**
1. Manus creates formatted CSV file
2. User imports via Notion UI: Database → ⋯ → Import → CSV
3. Map columns to database properties

**CSV Format Requirements:**
- Use exact property names as column headers
- Multi-select fields: comma-separated values
- Date fields: YYYY-MM-DD format
- Select fields: exact option names (case-sensitive)
- Status fields: include emoji (e.g., "✅ Applied")

**Example CSV:**
```csv
Conversation Title,Conversation Date,Primary AI Agent,Tags
"NTCER Bot Architecture","2025-12-08","Fred (ChatGPT)","technical, strategy"
```

---

### 3. Searching Database Content
**Best Method:** Zapier MCP `notion_find_data_source_items`

```bash
manus-mcp-cli tool call notion_find_data_source_items --server zapier --input '{
  "instructions": "Find entries from December 2025",
  "datasource": "🤖 AI Agent Conversations - Universal Database"
}'
```

**Advantages:**
- Natural language instructions
- Flexible filtering
- Returns formatted results

---

### 4. Querying with Advanced Filters
**Best Method:** Zapier MCP `notion_query_data_source_advanced`

**Use Cases:**
- Complex AND/OR filter logic
- Multiple sort criteria
- Specific property filtering

---

## Database Schema Reference

### AI Agent Conversations - Universal Database

**Database ID:** `1a6c9296-096a-4529-81f9-e6c014c4b808`  
**Data Source ID:** `collection://12da15e1-369e-4bae-87a1-7f51182c978f`

**Core Properties:**
- **Conversation Title** (title) - Main title field
- **Conversation Date** (date) - Date of conversation
- **Primary AI Agent** (select) - Fred, Claude, Grok, Gemini, Manus, etc.
- **Source Link** (url) - Link to original conversation
- **Status** (select) - 📥 Captured, 🔄 Processing, ✅ Applied, 📚 Reference, 🗄️ Archived
- **Business Area** (multi_select) - GPSA/HPSA, CARLORBIZ, MTMOT, AAE Development, etc.
- **Tags** (multi_select) - consulting, automation, research, strategy, technical, content, breakthrough
- **Quality Rating** (select) - 1-5, Excellent, High - Breakthrough implementation achieved
- **Business Impact** (select) - High Impact, Medium Impact, Low Impact, Reference Only
- **Agent Primary Role** (select) - Research & Analysis, Content Creation, Technical Development, Strategic Planning, Creative & Copy, Workflow Optimisation
- **Key Insights** (text) - Main takeaways from conversation
- **Deliverables Created** (text) - What was produced
- **Project** (select) - ACRRM, GPSA, Course, Tool, AI Infrastructure, etc.

**Agent-Specific Fields (text):**
- Fred, Claude, Claude Code, Grok, Gemini, Manus, Penny

---

## Instructing Manus: Best Practices

### Via Scheduled Email Draft (Gmail)

**Subject Line:** `Manus action this - [Brief Description]`

**Effective Instructions:**

✅ **Good:**
> "Parse this conversation with Fred from Dec 8 and add to the AI Conversations database. Use CSV export method."

✅ **Better:**
> "Add this Fred conversation (Dec 8, 2025) to AI Conversations DB:
> - Title: NTCER Expert Bot Architecture  
> - Tags: technical, strategy, automation  
> - Business Area: AAE Development  
> - Status: Applied  
> - Export as CSV for manual import"

❌ **Avoid:**
> "Put this in Notion" (too vague - which database? what properties?)

---

### Via Slack

**Format:**
```
@manus [action] [target] [details]
```

**Examples:**

✅ **Database Query:**
> "@manus find all Fred conversations from December in AI Conversations database"

✅ **Content Retrieval:**
> "@manus fetch the schema for AI Conversations database and send as markdown"

✅ **CSV Generation:**
> "@manus create CSV import file for these 3 conversations: [links]"

---

### Via UI Chat

**Be Specific About Method:**

✅ **Specify desired output:**
> "Create a Notion-ready CSV file with these conversations, formatted for the AI Conversations database"

✅ **Acknowledge limitations:**
> "I know you can't write directly to Notion databases yet. Please create the import file and I'll upload it manually."

---

## Troubleshooting Guide

### Error: "object_not_found" (404)
**Cause:** Native Notion MCP lacks write permissions  
**Solution:** Use CSV import method instead

### Error: "body failed validation" (Zapier)
**Cause:** Property schema mismatch  
**Solution:** Use native MCP for reads, CSV for writes

### Error: "Could not find database"
**Cause:** Using wrong ID format (page ID vs database ID vs data source ID)  
**Solution:** 
- Page ID: `1a6c9296-096a-4529-81f9-e6c014c4b808`
- Database ID: `12da15e1-369e-4bae-87a1-7f51182c978f`
- Data Source: `collection://12da15e1-369e-4bae-87a1-7f51182c978f`

---

## Future Improvements

### Short-term (Manual Fix)
1. Grant Native Notion MCP write permissions via Notion settings
2. Update Zapier integration to use correct property schema

### Medium-term (Automation)
1. Create n8n workflow for database writes
2. Use Notion API directly with dedicated integration token
3. Build AAE Dashboard interface for database management

### Long-term (Full Integration)
1. Unified database write interface across all MCPs
2. Automatic schema detection and validation
3. Bi-directional sync between Gmail drafts and Notion databases

---

## Related Documentation

- [AAE Architecture Overview](./aae-architecture.md)
- [MCP Integration Guide](./mcp-integration-guide.md)
- [Gmail Draft Automation](./gmail-draft-automation.md)

---

## Changelog

**2025-12-12:** Initial documentation created after troubleshooting Notion write access issues during Gmail draft workflow implementation.
