# n8n AI Agent Router Workflow
## AAE Council Multi-Agent Orchestration

**Purpose**: Route dashboard chat messages to appropriate AI agents, orchestrate multi-agent collaboration, and auto-ingest to Knowledge Lake

**Platform**: n8n Community Edition on Railway
**Created**: December 24, 2025
**Status**: Design Complete - Ready for Implementation

---

## 🎯 Overview

This workflow transforms the AAE Dashboard into your **central LLM conversation hub** by:

1. **Receiving** chat messages from AAE Dashboard
2. **Analyzing** query type and complexity
3. **Routing** to optimal AI agent (Fred/Claude/Colin/Penny)
4. **Orchestrating** multi-agent collaboration when needed
5. **Ingesting** all conversations to Knowledge Lake
6. **Returning** responses with agent attribution

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AAE Dashboard                             │
│                     (User sends message)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP POST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    n8n Webhook Trigger                           │
│              https://your-n8n.railway.app/webhook/aae-chat      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Query Knowledge Lake                            │
│            (Fetch relevant context for this user)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Agent Selection Logic                          │
│                   (Switch on query type)                         │
└─────┬──────────┬──────────┬──────────┬────────────────┬─────────┘
      │          │          │          │                │
      │          │          │          │                │
   Fred      Claude     Colin      Penny        Multi-Agent
 (Gemini)  (Anthropic) (OpenAI) (Perplexity)   Orchestration
   │          │          │          │                │
   │          │          │          │                │
   ▼          ▼          ▼          ▼                ▼
┌────────────────────────────────────────────────────────┐
│               Technical    Business   Research   Complex│
│               Tasks        Strategy   Questions  Queries│
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Extract Entities                              │
│           (Parse response for knowledge graph)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST to Knowledge Lake API                          │
│           /api/conversations/ingest                              │
│     (Store conversation + entities + relationships)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Return Response to Dashboard                    │
│         {agent, message, entities, timestamp}                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Workflow Nodes Configuration

### **Node 1: Webhook Trigger**

**Type**: `Webhook`
**Name**: `AAE Chat Webhook`
**Method**: `POST`
**Path**: `aae-chat`
**Authentication**: `Header Auth` (custom header `X-AAE-API-Key`)

**Expected Request Body**:
```json
{
  "userId": 1,
  "message": "How should I structure my n8n workflows?",
  "conversationHistory": [
    {"role": "user", "content": "Previous message..."},
    {"role": "assistant", "content": "Previous response...", "agent": "Claude"}
  ],
  "context": {
    "currentPage": "Dashboard",
    "userRole": "admin"
  }
}
```

**Response**: Returns immediately with `202 Accepted` while processing in background

---

### **Node 2: Set Default Variables**

**Type**: `Set`
**Name**: `Initialize Variables`

**Values to Set**:
```javascript
{
  "userId": "{{ $json.userId }}",
  "userMessage": "{{ $json.message }}",
  "conversationHistory": "{{ $json.conversationHistory }}",
  "timestamp": "{{ new Date().toISOString() }}",
  "knowledgeLakeUrl": "{{ $env.KNOWLEDGE_LAKE_URL }}",
  "dashboardCallbackUrl": "{{ $env.AAE_DASHBOARD_URL }}/api/chat/callback"
}
```

---

### **Node 3: Query Knowledge Lake for Context**

**Type**: `HTTP Request`
**Name**: `Get Relevant Context from Knowledge Lake`
**Method**: `POST`
**URL**: `{{ $node["Initialize Variables"].json.knowledgeLakeUrl }}/api/query`

**Body**:
```json
{
  "query": "{{ $node['Initialize Variables'].json.userMessage }}",
  "userId": "{{ $node['Initialize Variables'].json.userId }}",
  "limit": 5
}
```

**Output**: `relevantKnowledge` array with past conversations/entities

---

### **Node 4: Analyze Query Type**

**Type**: `Code`
**Name**: `Determine Agent & Complexity`
**Language**: `JavaScript`

**Code**:
```javascript
// Analyze query to determine optimal agent and complexity
const message = $input.item.json.userMessage.toLowerCase();
const knowledgeContext = $input.item.json.relevantKnowledge || [];

// Query patterns
const patterns = {
  technical: /\b(code|debug|api|database|deploy|error|fix|build|test|git|docker|railway)\b/gi,
  business: /\b(strategy|roi|budget|revenue|costs|clients|growth|market|competition)\b/gi,
  research: /\b(what is|how does|explain|research|latest|trends|compare|versus)\b/gi,
  consulting: /\b(should i|recommend|advice|best practice|approach|decision|planning)\b/gi,
  multiAgent: /\b(comprehensive|full analysis|multiple perspectives|all aspects|thorough)\b/gi
};

// Count matches
const scores = {
  technical: (message.match(patterns.technical) || []).length,
  business: (message.match(patterns.business) || []).length,
  research: (message.match(patterns.research) || []).length,
  consulting: (message.match(patterns.consulting) || []).length,
  multiAgent: (message.match(patterns.multiAgent) || []).length
};

// Determine complexity
const wordCount = message.split(/\s+/).length;
const hasContext = knowledgeContext.length > 0;
const complexity = wordCount > 50 || scores.multiAgent > 0 ? 'complex' : 'simple';

// Select primary agent
let selectedAgent = 'Fred'; // Default to Gemini
let agentReason = 'General technical queries';

if (scores.multiAgent > 0 || complexity === 'complex') {
  selectedAgent = 'Multi-Agent';
  agentReason = 'Complex query requiring multiple perspectives';
} else if (scores.technical >= 2) {
  selectedAgent = 'Fred';
  agentReason = 'Technical implementation focus';
} else if (scores.consulting >= 2) {
  selectedAgent = 'Claude';
  agentReason = 'Strategic planning and architecture';
} else if (scores.business >= 2) {
  selectedAgent = 'Colin';
  agentReason = 'Business strategy and ROI analysis';
} else if (scores.research >= 2) {
  selectedAgent = 'Penny';
  agentReason = 'Research and latest information needed';
}

return {
  selectedAgent,
  agentReason,
  complexity,
  scores,
  requiresMultiAgent: selectedAgent === 'Multi-Agent',
  contextAvailable: hasContext
};
```

**Output Fields**:
- `selectedAgent`: "Fred" | "Claude" | "Colin" | "Penny" | "Multi-Agent"
- `agentReason`: String explaining why this agent was selected
- `complexity`: "simple" | "complex"
- `requiresMultiAgent`: Boolean

---

### **Node 5: Switch - Route to Agent**

**Type**: `Switch`
**Name**: `Route to Agent`
**Mode**: `Rules`

**Routing Rules**:

| Rule | Expression | Output |
|------|------------|--------|
| 1 | `{{ $json.selectedAgent === "Fred" }}` | → Fred (Gemini) |
| 2 | `{{ $json.selectedAgent === "Claude" }}` | → Claude (Anthropic) |
| 3 | `{{ $json.selectedAgent === "Colin" }}` | → Colin (OpenAI) |
| 4 | `{{ $json.selectedAgent === "Penny" }}` | → Penny (Perplexity) |
| 5 | `{{ $json.selectedAgent === "Multi-Agent" }}` | → Multi-Agent Orchestrator |

---

## 🤖 Agent Nodes

### **Node 6a: Fred (Gemini)**

**Type**: `HTTP Request`
**Name**: `Fred - Gemini 2.5 Flash`
**Method**: `POST`
**URL**: `https://forge.manus.im/v1/chat/completions`

**Headers**:
```json
{
  "Authorization": "Bearer {{ $env.MANUS_FORGE_API_KEY }}",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "model": "gemini-2.5-flash",
  "messages": [
    {
      "role": "system",
      "content": "You are Fred, a technical implementation specialist in the AAE Council. You excel at coding, debugging, API integration, and deployment tasks. Keep responses practical and code-focused.\n\nRelevant context from Knowledge Lake:\n{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}"
    },
    {{ $node['Initialize Variables'].json.conversationHistory }},
    {
      "role": "user",
      "content": "{{ $node['Initialize Variables'].json.userMessage }}"
    }
  ],
  "max_tokens": 4096,
  "thinking": {
    "budget_tokens": 256
  }
}
```

**Output Mapping**:
```javascript
{
  "agent": "Fred",
  "agentType": "Gemini 2.5 Flash",
  "message": "{{ $json.choices[0].message.content }}",
  "usage": "{{ $json.usage }}"
}
```

---

### **Node 6b: Claude (Anthropic)**

**Type**: `HTTP Request`
**Name**: `Claude - Sonnet 4.5`
**Method**: `POST`
**URL**: `https://api.anthropic.com/v1/messages`

**Headers**:
```json
{
  "x-api-key": "{{ $env.ANTHROPIC_API_KEY }}",
  "anthropic-version": "2023-06-01",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 8192,
  "system": "You are Claude, the strategic architect in the AAE Council. You excel at system design, long-term planning, architectural decisions, and comprehensive analysis. Provide thoughtful, well-structured responses.\n\nRelevant context from Knowledge Lake:\n{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}",
  "messages": [
    {{ $node['Initialize Variables'].json.conversationHistory }},
    {
      "role": "user",
      "content": "{{ $node['Initialize Variables'].json.userMessage }}"
    }
  ]
}
```

**Output Mapping**:
```javascript
{
  "agent": "Claude",
  "agentType": "Claude Sonnet 4.5",
  "message": "{{ $json.content[0].text }}",
  "usage": "{{ $json.usage }}"
}
```

---

### **Node 6c: Colin (OpenAI)**

**Type**: `HTTP Request`
**Name**: `Colin - GPT-4`
**Method**: `POST`
**URL**: `https://api.openai.com/v1/chat/completions`

**Headers**:
```json
{
  "Authorization": "Bearer {{ $env.OPENAI_API_KEY }}",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "model": "gpt-4-turbo-preview",
  "messages": [
    {
      "role": "system",
      "content": "You are Colin, the business strategist in the AAE Council. You excel at ROI analysis, business planning, client strategy, and financial modeling. Focus on business value and practical outcomes.\n\nRelevant context from Knowledge Lake:\n{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}"
    },
    {{ $node['Initialize Variables'].json.conversationHistory }},
    {
      "role": "user",
      "content": "{{ $node['Initialize Variables'].json.userMessage }}"
    }
  ],
  "max_tokens": 4096
}
```

**Output Mapping**:
```javascript
{
  "agent": "Colin",
  "agentType": "GPT-4 Turbo",
  "message": "{{ $json.choices[0].message.content }}",
  "usage": "{{ $json.usage }}"
}
```

---

### **Node 6d: Penny (Perplexity)**

**Type**: `HTTP Request`
**Name**: `Penny - Perplexity Research`
**Method**: `POST`
**URL**: `https://api.perplexity.ai/chat/completions`

**Headers**:
```json
{
  "Authorization": "Bearer {{ $env.PERPLEXITY_API_KEY }}",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "model": "llama-3.1-sonar-large-128k-online",
  "messages": [
    {
      "role": "system",
      "content": "You are Penny, the research specialist in the AAE Council. You excel at finding latest information, comparing technologies, and providing fact-based analysis with citations. Always include sources.\n\nRelevant context from Knowledge Lake:\n{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}"
    },
    {{ $node['Initialize Variables'].json.conversationHistory }},
    {
      "role": "user",
      "content": "{{ $node['Initialize Variables'].json.userMessage }}"
    }
  ],
  "max_tokens": 4096
}
```

**Output Mapping**:
```javascript
{
  "agent": "Penny",
  "agentType": "Perplexity Sonar",
  "message": "{{ $json.choices[0].message.content }}",
  "citations": "{{ $json.citations }}",
  "usage": "{{ $json.usage }}"
}
```

---

### **Node 6e: Multi-Agent Orchestrator**

**Type**: `Code`
**Name**: `Multi-Agent Orchestration`
**Language**: `JavaScript`

**Code**:
```javascript
// For complex queries, consult multiple agents in sequence
const userMessage = $input.item.json.userMessage;
const context = $input.item.json.relevantKnowledge;

// Define agent consultation sequence
const consultationPlan = [
  {
    agent: 'Penny',
    question: `Research the latest information about: ${userMessage}`,
    focus: 'Current facts and trends'
  },
  {
    agent: 'Fred',
    question: `Based on this research, what's the technical implementation approach for: ${userMessage}`,
    focus: 'Technical feasibility',
    dependsOn: 'Penny'
  },
  {
    agent: 'Colin',
    question: `What's the business value and ROI for: ${userMessage}`,
    focus: 'Business case',
    dependsOn: 'Penny'
  },
  {
    agent: 'Claude',
    question: `Synthesize all perspectives and provide comprehensive recommendation for: ${userMessage}`,
    focus: 'Strategic synthesis',
    dependsOn: ['Penny', 'Fred', 'Colin']
  }
];

return {
  multiAgentMode: true,
  consultationPlan,
  totalAgents: consultationPlan.length,
  message: 'Complex query detected - consulting AAE Council...'
};
```

**Note**: This triggers a sub-workflow that iterates through agents and synthesizes responses.

---

## 📊 Knowledge Extraction & Ingestion

### **Node 7: Extract Entities from Response**

**Type**: `Code`
**Name**: `Extract Entities for Knowledge Graph`
**Language**: `JavaScript`

**Code**:
```javascript
// Extract entities from the AI response
const agentResponse = $input.item.json.message;
const userMessage = $node['Initialize Variables'].json.userMessage;
const agent = $input.item.json.agent;

// Entity extraction patterns
const patterns = {
  Agents: /\b(Claude|Fred|Colin|Penny|Gemini|GPT-4|Perplexity|Manus|n8n)\b/gi,
  Technology: /\b(Railway|Cloudflare|PostgreSQL|mem0|tRPC|React|Node\.js|Docker|Git|API|database|webhook)\b/gi,
  ExecutiveAI: /\b(AI strategy|AI budget|AI governance|automation strategy|LLM optimization)\b/gi,
  Consulting: /\b(workflow design|system architecture|implementation plan|best practices|optimization)\b/gi
};

const entities = [];
const seen = new Set();

// Extract from both user query and agent response
const fullText = `${userMessage}\n\n${agentResponse}`;

for (const [entityType, pattern] of Object.entries(patterns)) {
  const matches = fullText.match(pattern) || [];

  matches.forEach(match => {
    const normalized = match.trim().toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      entities.push({
        name: match.trim(),
        entityType,
        confidence: 0.85,
        description: `Discussed in ${agent} conversation`,
        sourceContext: fullText.substring(fullText.indexOf(match) - 50, fullText.indexOf(match) + 50)
      });
    }
  });
}

// Infer relationships
const relationships = [];
if (entities.length >= 2) {
  // Agent discusses Technology
  const agentEntities = entities.filter(e => e.entityType === 'Agents');
  const techEntities = entities.filter(e => e.entityType === 'Technology');

  agentEntities.forEach(agentEntity => {
    techEntities.forEach(techEntity => {
      relationships.push({
        from: agentEntity.name,
        to: techEntity.name,
        relationshipType: 'discusses',
        weight: 5,
        confidence: 0.80
      });
    });
  });
}

return {
  entities,
  relationships,
  extractedCount: entities.length,
  relationshipCount: relationships.length
};
```

---

### **Node 8: Ingest to Knowledge Lake**

**Type**: `HTTP Request`
**Name**: `POST to Knowledge Lake API`
**Method**: `POST`
**URL**: `{{ $node['Initialize Variables'].json.knowledgeLakeUrl }}/api/conversations/ingest`

**Body**:
```json
{
  "userId": "{{ $node['Initialize Variables'].json.userId }}",
  "agent": "{{ $json.agent }}",
  "date": "{{ new Date().toISOString().split('T')[0] }}",
  "topic": "Dashboard Chat: {{ $node['Initialize Variables'].json.userMessage.substring(0, 100) }}",
  "content": "User: {{ $node['Initialize Variables'].json.userMessage }}\n\n{{ $json.agent }}: {{ $json.message }}",
  "entities": "{{ $node['Extract Entities for Knowledge Graph'].json.entities }}",
  "relationships": "{{ $node['Extract Entities for Knowledge Graph'].json.relationships }}",
  "metadata": {
    "source": "AAE Dashboard Chat",
    "complexity": "{{ $node['Determine Agent & Complexity'].json.complexity }}",
    "agentReason": "{{ $node['Determine Agent & Complexity'].json.agentReason }}",
    "tokensUsed": "{{ $json.usage }}"
  }
}
```

**Options**:
- Continue on fail: `true` (don't block response if Knowledge Lake is down)
- Retry on fail: `3` attempts with exponential backoff

---

### **Node 9: Format Response for Dashboard**

**Type**: `Set`
**Name**: `Format Final Response`

**Values**:
```javascript
{
  "success": true,
  "agent": "{{ $json.agent }}",
  "agentType": "{{ $json.agentType }}",
  "agentReason": "{{ $node['Determine Agent & Complexity'].json.agentReason }}",
  "message": "{{ $json.message }}",
  "timestamp": "{{ $node['Initialize Variables'].json.timestamp }}",
  "entities": "{{ $node['Extract Entities for Knowledge Graph'].json.entities }}",
  "entitiesCount": "{{ $node['Extract Entities for Knowledge Graph'].json.extractedCount }}",
  "ingested": "{{ $node['POST to Knowledge Lake API'].json.success }}",
  "conversationId": "{{ $node['POST to Knowledge Lake API'].json.conversation.id }}",
  "citations": "{{ $json.citations || [] }}",
  "usage": "{{ $json.usage }}"
}
```

---

### **Node 10: Send Response to Dashboard**

**Type**: `HTTP Request`
**Name**: `Callback to Dashboard`
**Method**: `POST`
**URL**: `{{ $node['Initialize Variables'].json.dashboardCallbackUrl }}`

**Body**: `{{ $json }}`

---

## 🔧 Environment Variables Setup

In your n8n Railway deployment, set these environment variables:

```bash
# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
MANUS_FORGE_API_KEY=...

# AAE Infrastructure
KNOWLEDGE_LAKE_URL=https://knowledge-lake-api-production.up.railway.app
AAE_DASHBOARD_URL=https://your-dashboard.up.railway.app

# Webhook Security
AAE_WEBHOOK_API_KEY=generate_secure_random_key_here

# Optional: Rate Limiting
MAX_REQUESTS_PER_MINUTE=60
```

---

## 🔐 Security Configuration

### **Webhook Authentication**

In the Webhook node settings:
- **Authentication Type**: `Header Auth`
- **Header Name**: `X-AAE-API-Key`
- **Expected Value**: `{{ $env.AAE_WEBHOOK_API_KEY }}`

### **Dashboard Integration**

Update `server/routers/chat.ts` in AAE Dashboard:

```typescript
export const chatRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Call n8n AI Agent Router
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n.railway.app/webhook/aae-chat';

      try {
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AAE-API-Key': process.env.AAE_WEBHOOK_API_KEY || ''
          },
          body: JSON.stringify({
            userId,
            message: input.message,
            conversationHistory: input.conversationHistory || [],
            context: {
              currentPage: 'Dashboard',
              userRole: ctx.user.role
            }
          })
        });

        if (!response.ok) {
          throw new Error(`n8n webhook failed: ${response.statusText}`);
        }

        const result = await response.json();

        return {
          agent: result.agent,
          agentType: result.agentType,
          agentReason: result.agentReason,
          message: result.message,
          timestamp: result.timestamp,
          entities: result.entities,
          citations: result.citations,
          ingested: result.ingested
        };
      } catch (error) {
        console.error('[Chat] n8n webhook error:', error);

        // Fallback to direct Gemini call
        const fallbackResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            ...(input.conversationHistory || []),
            { role: "user", content: input.message }
          ]
        });

        return {
          agent: "Fred (Fallback)",
          agentType: "Gemini 2.5 Flash",
          agentReason: "n8n unavailable - using fallback",
          message: fallbackResponse.choices[0]?.message?.content || "Error processing request",
          timestamp: new Date(),
          entities: [],
          citations: [],
          ingested: false
        };
      }
    }),
});
```

---

## 📱 Dashboard UI Updates

### **Update AIChat.tsx to display agent info**

```typescript
// client/src/pages/AIChat.tsx

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  agentType?: string;
  agentReason?: string;
  entities?: Array<{name: string; entityType: string}>;
  citations?: string[];
  timestamp?: Date;
}

// In the message display component:
<div className="flex items-start gap-3">
  {message.role === 'assistant' && (
    <div className="flex flex-col items-center">
      <AgentAvatar agent={message.agent} />
      <span className="text-xs text-muted-foreground mt-1">
        {message.agent}
      </span>
    </div>
  )}

  <div className="flex-1">
    <div className="prose dark:prose-invert">
      {message.content}
    </div>

    {message.agentReason && (
      <div className="text-xs text-muted-foreground mt-2 italic">
        Selected because: {message.agentReason}
      </div>
    )}

    {message.entities && message.entities.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {message.entities.map((entity, i) => (
          <Badge key={i} variant="outline" className="text-xs">
            {entity.name}
          </Badge>
        ))}
      </div>
    )}

    {message.citations && message.citations.length > 0 && (
      <div className="mt-2 text-xs">
        <details>
          <summary className="cursor-pointer text-muted-foreground">
            Sources ({message.citations.length})
          </summary>
          <ul className="list-disc list-inside mt-1">
            {message.citations.map((citation, i) => (
              <li key={i}>{citation}</li>
            ))}
          </ul>
        </details>
      </div>
    )}
  </div>
</div>
```

---

## 🚀 Deployment Instructions

### **Step 1: Import Workflow to n8n**

1. Open your n8n instance: `https://your-n8n.railway.app`
2. Click **Workflows** → **Import from File**
3. Use the JSON export (will provide separately)
4. Workflow will be named: **"AAE Agent Router"**

### **Step 2: Configure Environment Variables**

In Railway (n8n service):
```bash
railway variables set ANTHROPIC_API_KEY=your_key_here
railway variables set OPENAI_API_KEY=your_key_here
railway variables set PERPLEXITY_API_KEY=your_key_here
railway variables set MANUS_FORGE_API_KEY=your_key_here
railway variables set KNOWLEDGE_LAKE_URL=https://knowledge-lake-api-production.up.railway.app
railway variables set AAE_DASHBOARD_URL=https://your-dashboard.railway.app
railway variables set AAE_WEBHOOK_API_KEY=$(openssl rand -hex 32)
```

### **Step 3: Activate Workflow**

1. In n8n, open the **AAE Agent Router** workflow
2. Click **Activate** toggle (top-right)
3. Copy the webhook URL (should be: `https://your-n8n.railway.app/webhook/aae-chat`)

### **Step 4: Update Dashboard Environment**

In Railway (AAE Dashboard service):
```bash
railway variables set N8N_WEBHOOK_URL=https://your-n8n.railway.app/webhook/aae-chat
railway variables set AAE_WEBHOOK_API_KEY=<same_key_from_step_2>
```

### **Step 5: Test the Integration**

```bash
# Test the webhook directly
curl -X POST https://your-n8n.railway.app/webhook/aae-chat \
  -H "Content-Type: application/json" \
  -H "X-AAE-API-Key: your_api_key_here" \
  -d '{
    "userId": 1,
    "message": "How should I structure my n8n workflows?",
    "conversationHistory": [],
    "context": {"currentPage": "Dashboard"}
  }'
```

**Expected Response** (within 3-5 seconds):
```json
{
  "success": true,
  "agent": "Claude",
  "agentType": "Claude Sonnet 4.5",
  "agentReason": "Strategic planning and architecture",
  "message": "For n8n workflows, I recommend...",
  "timestamp": "2025-12-24T10:30:00Z",
  "entities": [
    {"name": "n8n", "entityType": "Technology"},
    {"name": "workflow design", "entityType": "Consulting"}
  ],
  "entitiesCount": 2,
  "ingested": true,
  "conversationId": 123
}
```

---

## 📊 Monitoring & Analytics

### **Workflow Execution Metrics**

Track in n8n:
- **Total executions** (per hour/day)
- **Agent usage distribution** (Fred vs Claude vs Colin vs Penny)
- **Average response time** by agent
- **Knowledge Lake ingestion success rate**
- **Multi-agent orchestration frequency**

### **Dashboard Analytics**

Add to AAE Dashboard:
```sql
-- Track agent preferences
SELECT
  agent,
  COUNT(*) as usage_count,
  AVG(LENGTH(message)) as avg_response_length
FROM conversations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent
ORDER BY usage_count DESC;
```

---

## 🎯 Success Metrics

After deployment, you should see:

✅ **All LLM conversations** centralized in dashboard
✅ **Agent attribution** visible in chat UI
✅ **Auto-ingestion** to Knowledge Lake (100% success rate)
✅ **Smart routing** (queries go to optimal agent)
✅ **Multi-agent** orchestration for complex queries
✅ **Knowledge graph growth** (entities/relationships auto-extracted)
✅ **Context-aware responses** (Knowledge Lake integration)

---

## 🔄 Next Enhancements

### **Phase 2: Advanced Features**

1. **Agent Voting System**
   - For critical decisions, all 4 agents vote
   - Dashboard shows consensus vs dissent
   - User chooses final approach

2. **Conversation Threading**
   - Multi-turn conversations with same agent
   - Agent memory across sessions
   - "Continue with Claude" vs "Switch to Fred"

3. **Cost Optimization**
   - Route simple queries to cheaper models
   - Reserve Opus/GPT-4 for complex queries
   - Real-time cost tracking in dashboard

4. **Agent Specialization**
   - Train custom system prompts per agent
   - Domain-specific knowledge injection
   - Fine-tuning on past successful responses

---

## 📞 Support & Troubleshooting

### **Common Issues**

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook timeout | Agent response >30s | Implement async callback pattern |
| Knowledge Lake 500 | API overload | Add retry logic with exponential backoff |
| Missing entities | Extraction pattern outdated | Update regex patterns in Node 7 |
| Wrong agent selected | Pattern mismatch | Refine query analysis in Node 4 |

### **Debug Mode**

Enable verbose logging in n8n:
1. Settings → Log Level → `debug`
2. Check execution logs for each node
3. Verify JSON structure at each step

---

**Your AAE Council is now ready to serve as your unified LLM conversation hub!** 🚀

All conversations → Auto-ingested → Knowledge Lake → Institutional Memory Forever
