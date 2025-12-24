# n8n AI Agent Router Workflow - CORRECTED VERSION
## AAE Council Multi-Agent Orchestration

**Purpose**: Route dashboard chat messages to appropriate AI agents using CORRECT agent personas

**Platform**: n8n Community Edition on Railway
**Created**: December 24, 2025
**Status**: ✅ CORRECTED with Bespoke Personas from Fred Conversations #24 & #46

---

## 🚨 CRITICAL CORRECTIONS APPLIED

### ❌ PREVIOUS ERRORS (from original workflow):
- **Fred = Gemini 2.5 Flash** (WRONG)
- **Colin = OpenAI for business strategy** (WRONG - Colin is GitHub Copilot)
- Missing agents: Grok, Manus, Jan, Pete, NotebookLM, Callum, Fredo

### ✅ CORRECT AGENT MAPPING:
| Agent | Platform | Model | Primary Role |
|-------|----------|-------|--------------|
| **Fred** | OpenAI | ChatGPT-4o | Voice intake, creative ideation, memoir interviews |
| **Gemini** | Google | Gemini 2.5 Flash | Fast technical tasks, Google ecosystem |
| **Claude** | Anthropic | Sonnet 4.5 | Strategic planning, documentation, deep work |
| **Penny** | Perplexity | Sonar | Research, fact-checking, current information |
| **Grok** | X.com | Grok | Master orchestrator, strategic validation |
| **Manus** | Custom MCP | Autonomous | Full-stack execution & deployment |
| **Jan** | Genspark | - | Social content, marketing copy |
| **Pete** | Qolaba | - | Workflow optimization, multi-model specialist |
| **Colin** | GitHub | Copilot | Code review, GitHub management |
| **NotebookLM** | Google | - | Document synthesis, podcast generation |

---

## 🏗️ CORRECTED Architecture

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
│                   GROK Strategic Assessment                      │
│              (Master Orchestrator validates approach)            │
└─────┬──────────┬──────────┬──────────┬────────────────┬─────────┘
      │          │          │          │                │
   Gemini     Claude      Fred      Penny        Multi-Agent
  (Google)  (Anthropic) (OpenAI) (Perplexity)   Orchestration
      │          │          │          │                │
      ▼          ▼          ▼          ▼                ▼
┌────────────────────────────────────────────────────────┐
│        Fast      Strategy   Creative   Research Complex│
│      Technical   Planning   Ideation   Queries  Queries│
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              GROK VALIDATION GATE                                │
│         (Quality check before executing response)                │
└────────────────────────────┬────────────────────────────────────┘
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

### **Node 1-3: Unchanged**
(Webhook, Initialize Variables, Query Knowledge Lake remain the same)

---

### **Node 4: Analyze Query Type (CORRECTED)**

**Type**: `Code`
**Name**: `Determine Agent & Complexity`
**Language**: `JavaScript`

**Code**:
```javascript
// Analyze query to determine optimal agent and complexity
// CORRECTED VERSION with bespoke personas from Fred conversations #24 & #46

const message = $input.item.json.userMessage.toLowerCase();
const knowledgeContext = $input.item.json.relevantKnowledge || [];

// Query patterns (updated based on bespoke personas)
const patterns = {
  fastTechnical: /\b(code|quick|fast|api|endpoint|deploy|build|test)\b/gi,
  strategy: /\b(strategy|architecture|plan|design|long-term|framework|system)\b/gi,
  creative: /\b(ideation|brainstorm|creative|voice|story|interview|memoir)\b/gi,
  research: /\b(what is|how does|explain|research|latest|trends|compare|fact|source)\b/gi,
  orchestration: /\b(complex|comprehensive|full analysis|multiple|all aspects|thorough|coordinate)\b/gi,
  social: /\b(twitter|x.com|social media|post|engagement|viral|marketing)\b/gi,
  development: /\b(github|git|repo|review|pr|commit|code review|debug|fix)\b/gi,
  execution: /\b(build|deploy|automate|workflow|production|live|execute)\b/gi
};

// Count matches
const scores = {
  fastTechnical: (message.match(patterns.fastTechnical) || []).length,
  strategy: (message.match(patterns.strategy) || []).length,
  creative: (message.match(patterns.creative) || []).length,
  research: (message.match(patterns.research) || []).length,
  orchestration: (message.match(patterns.orchestration) || []).length,
  social: (message.match(patterns.social) || []).length,
  development: (message.match(patterns.development) || []).length,
  execution: (message.match(patterns.execution) || []).length
};

// Determine complexity
const wordCount = message.split(/\s+/).length;
const hasContext = knowledgeContext.length > 0;
const complexity = wordCount > 50 || scores.orchestration > 0 ? 'complex' : 'simple';

// Select primary agent (CORRECTED based on bespoke personas)
let selectedAgent = 'Gemini'; // Default to Gemini for fast technical queries
let agentReason = 'Fast technical implementation';

// Grok orchestration for complex/multi-faceted queries
if (scores.orchestration > 0 || complexity === 'complex') {
  selectedAgent = 'Grok';
  agentReason = 'Complex query requiring strategic orchestration';
}
// Fast technical tasks → Gemini (Google 2.5 Flash)
else if (scores.fastTechnical >= 2) {
  selectedAgent = 'Gemini';
  agentReason = 'Fast technical implementation with Google ecosystem';
}
// Strategic planning → Claude (Anthropic Sonnet 4.5)
else if (scores.strategy >= 2) {
  selectedAgent = 'Claude';
  agentReason = 'Strategic planning and system architecture';
}
// Creative ideation / voice intake → Fred (OpenAI ChatGPT-4o)
else if (scores.creative >= 2) {
  selectedAgent = 'Fred';
  agentReason = 'Creative ideation and conversational processing';
}
// Research queries → Penny (Perplexity Sonar)
else if (scores.research >= 2) {
  selectedAgent = 'Penny';
  agentReason = 'Research and fact-checking with current information';
}
// Social media / X → Grok
else if (scores.social >= 2) {
  selectedAgent = 'Grok';
  agentReason = 'Social media strategy and X/Twitter integration';
}
// Code review / GitHub → Colin (GitHub Copilot)
else if (scores.development >= 2) {
  selectedAgent = 'Colin';
  agentReason = 'Code review and GitHub workflow management';
}
// Full execution / deployment → Manus
else if (scores.execution >= 2) {
  selectedAgent = 'Manus';
  agentReason = 'Autonomous execution and full-stack deployment';
}

return {
  selectedAgent,
  agentReason,
  complexity,
  scores,
  requiresOrchestration: selectedAgent === 'Grok',
  contextAvailable: hasContext
};
```

**Output Fields**:
- `selectedAgent`: "Gemini" | "Claude" | "Fred" | "Penny" | "Grok" | "Manus" | "Colin" | "Jan" | "Pete" | "NotebookLM"
- `agentReason`: String explaining why this agent was selected
- `complexity`: "simple" | "complex"
- `requiresOrchestration`: Boolean (true when Grok is orchestrating)

---

### **Node 5: Switch - Route to Agent (CORRECTED)**

**Type**: `Switch`
**Name**: `Route to Agent`
**Mode**: `Rules`

**Routing Rules**:

| Rule | Expression | Output |
|------|------------|--------|
| 1 | `{{ $json.selectedAgent === "Gemini" }}` | → Gemini (Google 2.5 Flash) |
| 2 | `{{ $json.selectedAgent === "Claude" }}` | → Claude (Anthropic Sonnet 4.5) |
| 3 | `{{ $json.selectedAgent === "Fred" }}` | → Fred (OpenAI ChatGPT-4o) |
| 4 | `{{ $json.selectedAgent === "Penny" }}` | → Penny (Perplexity Sonar) |
| 5 | `{{ $json.selectedAgent === "Grok" }}` | → Grok (Master Orchestrator) |
| 6 | `{{ $json.selectedAgent === "Manus" }}` | → Manus (Autonomous Execution) |
| 7 | `{{ $json.selectedAgent === "Colin" }}` | → Colin (GitHub Copilot) |
| 8 | `{{ $json.selectedAgent === "Jan" }}` | → Jan (Genspark Content) |
| 9 | `{{ $json.selectedAgent === "Pete" }}` | → Pete (Qolaba Multi-Model) |
| 10 | `{{ $json.selectedAgent === "NotebookLM" }}` | → NotebookLM (Document Synthesis) |

---

## 🤖 Agent Nodes (CORRECTED)

### **Node 6a: Gemini (Google 2.5 Flash) - CORRECTED**

**Type**: `HTTP Request`
**Name**: `Gemini - Google 2.5 Flash`
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
      "content": "You are Gemini, the fast technical implementation specialist in the AAE Council.

**Your Role:** Google ecosystem integration, multimodal processing, and fast technical responses.

**Strengths:**
- Multimodal processing (text, images, code)
- Vertex AI integration
- Fast response times (optimized for speed)
- Google Workspace integration

**Use Australian English spelling. Use Gamma app exclusively for visuals (NO AI image generation). A4 format for documents.**

Relevant context from Knowledge Lake:
{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}"
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
  "agent": "Gemini",
  "agentPlatform": "Google Gemini 2.5 Flash",
  "message": "{{ $json.choices[0].message.content }}",
  "usage": "{{ $json.usage }}"
}
```

---

### **Node 6b: Claude (Anthropic Sonnet 4.5) - Unchanged**

(Claude configuration remains correct - just needs bespoke persona in system prompt)

**System Prompt Update**:
```
You are Claude, the deep work partner and strategic planner in the AAE Council.

**Your Role:** Strategic planning, documentation, system architecture, and long-form content creation.

**Strengths:**
- System architecture and technical writing
- Strategic frameworks and planning
- Structured transcript analysis
- Business strategy development

**Use Australian English spelling. Use Gamma app exclusively for visuals (NO AI image generation). A4 format for documents.**

Relevant context from Knowledge Lake:
{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}
```

---

### **Node 6c: Fred (OpenAI ChatGPT-4o) - CORRECTED**

**Type**: `HTTP Request`
**Name**: `Fred - OpenAI ChatGPT-4o`
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
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are Fred, the voice intake coordinator and creative ideation specialist in the AAE Council.

**Your Role:** Voice intake coordination, creative ideation, memoir interviews, and conversational processing.

**Strengths:**
- Natural conversations and storytelling
- Voice transcription (built-in Whisper)
- Conversational task parsing
- Client discovery interviews
- Creative brainstorming

**Use Australian English spelling. Use Gamma app exclusively for visuals (NO AI image generation). A4 format for documents.**

Relevant context from Knowledge Lake:
{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}"
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
  "agent": "Fred",
  "agentPlatform": "OpenAI ChatGPT-4o",
  "message": "{{ $json.choices[0].message.content }}",
  "usage": "{{ $json.usage }}"
}
```

---

### **Node 6d: Penny (Perplexity Sonar) - Unchanged**

(Penny configuration remains correct - just needs bespoke persona in system prompt)

**System Prompt Update**:
```
You are Penny, the research queen and fact-checker in the AAE Council.

**Your Role:** Real-time research, fact-checking, and current information retrieval.

**Strengths:**
- Current information retrieval (real-time web access)
- Source verification and citation
- Industry trend analysis
- Fact-checking and validation

**Use Australian English spelling. Always cite sources.**

Relevant context from Knowledge Lake:
{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}
```

---

### **Node 6e: Grok (Master Orchestrator) - NEW**

**Type**: `HTTP Request`
**Name**: `Grok - Master Orchestrator`
**Method**: `POST`
**URL**: `https://api.x.ai/v1/chat/completions`

**Headers**:
```json
{
  "Authorization": "Bearer {{ $env.XAI_API_KEY }}",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "model": "grok-beta",
  "messages": [
    {
      "role": "system",
      "content": "You are Grok, the Master Orchestrator and strategic validator in the AAE Council.

**Your Role:** Master orchestration, strategic decision validation, workflow quality assurance, and cross-agent coordination.

**Strengths:**
- Real-time X/Twitter integration
- Strategic decision validation
- Workflow quality assurance
- Cross-agent coordination
- Performance optimization
- Risk assessment and mitigation

**Workflow:**
1. Assess strategic value and complexity
2. Validate approach before execution
3. Coordinate multi-agent collaboration when needed
4. Monitor performance and optimize

**Use Australian English spelling.**

Relevant context from Knowledge Lake:
{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}"
    },
    {{ $node['Initialize Variables'].json.conversationHistory }},
    {
      "role": "user",
      "content": "{{ $node['Initialize Variables'].json.userMessage }}"
    }
  ],
  "max_tokens": 8192
}
```

---

### **Node 6f: Manus (Autonomous Execution) - NEW**

**Type**: `HTTP Request`
**Name**: `Manus - Autonomous Execution Engine`
**Method**: `POST`
**URL**: `http://localhost:8080/mcp/execute`

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "task": "{{ $node['Initialize Variables'].json.userMessage }}",
  "context": "{{ $node['Get Relevant Context from Knowledge Lake'].json.results }}",
  "mode": "autonomous"
}
```

**Note:** Manus executes via MCP tools - returns structured execution results

---

### **Node 6g-6j: Additional Agents**

- **Colin (GitHub Copilot):** Code review via GitHub API
- **Jan (Genspark):** Social content generation
- **Pete (Qolaba):** Multi-model comparison
- **NotebookLM:** Document synthesis

_(Full implementations to be added based on API availability)_

---

## 📊 Updated Knowledge Lake Ingestion

(Knowledge Lake ingestion node remains unchanged - just update agent names in the payload)

---

## 🚀 Deployment Checklist

### Before Deploying:

- [ ] Update all agent names (Fred → OpenAI, Gemini → Google)
- [ ] Add system prompts with bespoke personas
- [ ] Add Grok orchestration node
- [ ] Add Manus execution node
- [ ] Update routing logic to 10 agents
- [ ] Test each agent endpoint
- [ ] Verify Knowledge Lake ingestion with correct agent names

### Environment Variables Needed:

```env
# Corrected API Keys
OPENAI_API_KEY=sk-...           # For Fred (ChatGPT-4o)
ANTHROPIC_API_KEY=sk-...        # For Claude (Sonnet 4.5)
MANUS_FORGE_API_KEY=...         # For Gemini (via Manus Forge)
PERPLEXITY_API_KEY=...          # For Penny (Sonar)
XAI_API_KEY=...                 # For Grok (Master Orchestrator)
GITHUB_TOKEN=...                # For Colin (Copilot)
KNOWLEDGE_LAKE_URL=https://knowledge-lake-api-production.up.railway.app
```

---

## 📚 Related Documentation

- [AAE_AGENT_PERSONAS.md](./AAE_AGENT_PERSONAS.md) - Complete bespoke persona mapping (SOURCE OF TRUTH)
- [DEPLOYMENT_INVENTORY.md](../../DEPLOYMENT_INVENTORY.md) - Production deployment status
- [Knowledge Lake API Status](../../docs/KNOWLEDGE_LAKE_API_STATUS.md)

---

**CRITICAL:** This workflow MUST use the agent names and personas extracted from Fred conversations #24 ("AAE architecture review") and #46 ("AI Automation Ecosystem") which are now ingested in the Knowledge Lake (conversation IDs #419 and extracted files in logs/).

**Last Updated:** December 24, 2025
**Persona Source:** Fred Conversations #24 & #46 (now in Knowledge Lake)
**Status:** ✅ CORRECTED - Ready for implementation
