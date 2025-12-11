# Knowledge Lake API for Manus Integration

**Purpose**: Enable Manus MCP to ingest email conversations and AI interactions directly into the Knowledge Lake.

---

## 🔌 API Endpoint

### Base URLs

```bash
# Local Development
http://localhost:5002

# Production (Railway - update with your actual URL)
https://your-knowledge-lake.up.railway.app
```

---

## 📨 Conversation Ingestion Endpoint

**Endpoint**: `POST /api/conversations/ingest`

### Request Format

```json
{
  "userId": 1,
  "agent": "Manus",
  "date": "2024-11-30",
  "topic": "Email: Budget Approval Request",
  "content": "Full email thread or conversation content...",
  "entities": [
    {
      "name": "Budget Approval",
      "entityType": "Consulting",
      "confidence": 0.90,
      "description": "Board approval process for AI budget",
      "sourceContext": "Email from CFO discussing Q1 budget"
    },
    {
      "name": "AI Budget",
      "entityType": "ExecutiveAI",
      "confidence": 0.95,
      "description": "Proposed AI implementation budget",
      "sourceContext": "Referenced in financial planning discussion"
    }
  ],
  "relationships": [
    {
      "from": "Budget Approval",
      "to": "AI Budget",
      "relationshipType": "approves",
      "weight": 5,
      "confidence": 0.88
    }
  ],
  "metadata": {
    "sourceEmail": "cfo@company.com",
    "emailSubject": "Q1 AI Budget Review",
    "processingAgent": "Manus",
    "priority": "High"
  }
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | number | Always use `1` for Carla's account |
| `agent` | string | `"Manus"` for Manus-processed conversations |
| `date` | string | ISO date format: `"YYYY-MM-DD"` |
| `topic` | string | Brief subject line or conversation topic |
| `content` | string | Full conversation/email content |
| `entities` | array | Extracted entities (can be empty `[]`) |
| `relationships` | array | Entity relationships (can be empty `[]`) |

### Entity Object Format

```json
{
  "name": "Entity Name",
  "entityType": "Agents|Technology|ExecutiveAI|Content|Consulting|ClientIntelligence",
  "confidence": 0.85,
  "description": "Brief description of entity",
  "sourceContext": "Where/how this entity appeared in conversation"
}
```

### Relationship Object Format

```json
{
  "from": "Entity Name 1",
  "to": "Entity Name 2",
  "relationshipType": "uses|integrates_with|requires|discusses|approves|implements",
  "weight": 3,
  "confidence": 0.80
}
```

### Response Format

```json
{
  "success": true,
  "conversation": {
    "id": 42,
    "agent": "Manus",
    "topic": "Email: Budget Approval Request"
  },
  "entitiesCreated": 2,
  "relationshipsCreated": 1,
  "timestamp": "2024-11-30T10:30:00Z"
}
```

---

## 🎯 Entity Types Guide

Choose the most appropriate entity type for each extracted concept:

| Entity Type | Use For | Examples |
|-------------|---------|----------|
| **Agents** | AI assistants, bots, automation | Claude, Manus, Gemini, ChatGPT |
| **Technology** | Tools, platforms, software | Notion, GitHub, Python, React |
| **ExecutiveAI** | AI leadership, strategy, governance | AI Budget, AI Governance, AI ROI |
| **Content** | Documents, courses, materials | Course Module, Training Video |
| **Consulting** | Business processes, methodologies | Budget Approval, Project Planning |
| **ClientIntelligence** | Client insights, feedback, needs | Client Requirements, User Feedback |

---

## 🔗 Relationship Types

Common relationship types to use:

| Type | Meaning | Example |
|------|---------|---------|
| `uses` | One entity utilizes another | "Manus uses OpenAI API" |
| `integrates_with` | Technical integration | "Notion integrates_with GitHub" |
| `requires` | Dependency relationship | "Course Module requires Research" |
| `discusses` | Mentioned in context together | "Email discusses Budget Approval" |
| `approves` | Approval/authorization | "Board approves AI Budget" |
| `implements` | Implementation relationship | "Developer implements Feature" |

**Weight Scale**: 1-10 (1 = weak connection, 10 = critical dependency)

---

## 🤖 Example: Manus MCP Implementation

### Python Code for Manus MCP

```python
import requests
import json
from typing import List, Dict, Any

class KnowledgeLakeClient:
    def __init__(self, base_url: str = "http://localhost:5002"):
        self.base_url = base_url
        self.ingest_endpoint = f"{base_url}/api/conversations/ingest"

    def ingest_email(
        self,
        email_content: str,
        subject: str,
        sender: str,
        entities: List[Dict] = None,
        relationships: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Ingest email conversation into Knowledge Lake

        Args:
            email_content: Full email body/thread
            subject: Email subject line
            sender: Email sender address
            entities: Extracted entities (optional)
            relationships: Entity relationships (optional)

        Returns:
            API response with ingestion results
        """
        from datetime import datetime

        payload = {
            "userId": 1,
            "agent": "Manus",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "topic": f"Email: {subject}",
            "content": email_content,
            "entities": entities or [],
            "relationships": relationships or [],
            "metadata": {
                "sourceEmail": sender,
                "emailSubject": subject,
                "processingAgent": "Manus",
                "priority": "Medium"
            }
        }

        try:
            response = requests.post(
                self.ingest_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e)
            }

# Usage Example
client = KnowledgeLakeClient()

result = client.ingest_email(
    email_content="Full email thread content here...",
    subject="Q1 AI Budget Review",
    sender="cfo@company.com",
    entities=[
        {
            "name": "AI Budget",
            "entityType": "ExecutiveAI",
            "confidence": 0.95,
            "description": "Q1 AI implementation budget",
            "sourceContext": "Main topic of email discussion"
        }
    ],
    relationships=[]
)

print(f"Ingestion result: {result}")
```

---

## 🔍 Entity Extraction Tips for Manus

### Simple Pattern Matching (No AI Required)

If Manus doesn't have AI capabilities for entity extraction, use basic pattern matching:

```python
def extract_basic_entities(email_content: str, subject: str) -> List[Dict]:
    """Extract entities using simple keyword matching"""
    entities = []

    # Common patterns
    patterns = {
        "budget": ("ExecutiveAI", "Budget discussion"),
        "approval": ("Consulting", "Approval process"),
        "AI": ("ExecutiveAI", "Artificial Intelligence topic"),
        "course": ("Content", "Educational content"),
        "client": ("ClientIntelligence", "Client-related"),
    }

    content_lower = (email_content + " " + subject).lower()

    for keyword, (entity_type, description) in patterns.items():
        if keyword in content_lower:
            entities.append({
                "name": keyword.capitalize(),
                "entityType": entity_type,
                "confidence": 0.70,  # Lower confidence for pattern matching
                "description": description,
                "sourceContext": f"Keyword '{keyword}' found in email"
            })

    return entities
```

### AI-Enhanced Extraction (If Available)

If Manus can call AI APIs (Claude, OpenAI, etc.):

```python
def extract_entities_with_ai(email_content: str) -> List[Dict]:
    """Use AI to extract structured entities"""

    prompt = f"""
    Analyze this email and extract key entities.
    Return JSON array with format:
    [{{"name": "Entity Name", "entityType": "ExecutiveAI|Technology|Consulting|etc", "confidence": 0.85, "description": "brief description"}}]

    Email:
    {email_content}
    """

    # Call your AI API here (Claude, OpenAI, etc.)
    # Parse response into entity list

    return parsed_entities
```

---

## 🧪 Testing the Integration

### 1. Test API Availability

```bash
curl http://localhost:5002/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "mem0_knowledge_lake",
  "version": "2.0_enhanced"
}
```

### 2. Test Simple Ingestion

```bash
curl -X POST http://localhost:5002/api/conversations/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "agent": "Manus",
    "date": "2024-11-30",
    "topic": "Test Email",
    "content": "This is a test email from Manus",
    "entities": [],
    "relationships": [],
    "metadata": {
      "sourceEmail": "test@example.com",
      "processingAgent": "Manus"
    }
  }'
```

### 3. Verify Ingestion

```bash
curl "http://localhost:5002/api/stats?userId=1"
```

---

## ⚠️ Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Connection refused | API not running | Start Knowledge Lake API: `python api_server.py` |
| 400 Bad Request | Missing required fields | Check userId, agent, date, topic, content are present |
| 500 Internal Error | API processing error | Check API logs for details |

### Graceful Failure Strategy

```python
def ingest_with_retry(client, email_data, max_retries=3):
    """Ingest with automatic retry on failure"""
    for attempt in range(max_retries):
        try:
            result = client.ingest_email(**email_data)
            if result.get("success"):
                return result
        except Exception as e:
            if attempt == max_retries - 1:
                # Log failure, save to local queue for manual retry
                save_to_retry_queue(email_data)
            time.sleep(2 ** attempt)  # Exponential backoff

    return {"success": False, "error": "Max retries exceeded"}
```

---

## 📋 Workflow Summary

```
1. Email arrives → Manus receives
2. Manus extracts metadata (subject, sender, date)
3. Manus optionally extracts entities/relationships
4. Manus POSTs to /api/conversations/ingest
5. Knowledge Lake stores in mem0 + structured DB
6. Success response → Manus marks email as processed
7. Failure → Manus queues for retry or alerts
```

---

## 🚀 Next Steps for Manus Integration

1. **Set up Manus MCP server** with Knowledge Lake client
2. **Configure email monitoring** (Gmail API, IMAP, etc.)
3. **Test with sample emails** using local Knowledge Lake (port 5002)
4. **Deploy to production** using Railway URL
5. **Monitor ingestion logs** for errors or patterns
6. **Refine entity extraction** based on observed email patterns

---

## 📞 API Support

**Local Testing**: `http://localhost:5002`
**Production**: Update with Railway URL when deployed

**Questions or Issues?**
- Check [KNOWLEDGE_LAKE_INTEGRATION.md](KNOWLEDGE_LAKE_INTEGRATION.md) for architecture overview
- Review Knowledge Lake API logs for debugging
- Test API health endpoint first before troubleshooting

---

**Ready to connect Manus to your corporate brain! 🧠✉️**
