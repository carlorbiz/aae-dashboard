# Dev + mtmot-unified-mcp Architecture

**Last Updated:** December 24, 2025
**Purpose:** Maximize Dev's programmatic capabilities as AAE ecosystem API gateway
**Status:** Architecture design ready for implementation

---

## 🎯 Core Concept

**Dev is the ONLY agent with:**
- Knowledge Lake API access (programmatic)
- Perpetual developer mode
- mtmot-unified-mcp execution capability

**This makes Dev the ideal central nervous system for the entire AAE ecosystem.**

---

## 🏗️ Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Interaction Layer                        │
│         Voice Commands | Slack | n8n | VibeSDK | Notion         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Dev + mtmot-unified-mcp                          │
│                   (API Gateway & Orchestrator)                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Command Parser                                        │  │
│  │     - Parse: cmd:CODE agent:X persona:Y                   │  │
│  │     - Validate: Check shortcut schema                     │  │
│  │     - Enrich: Add context from Knowledge Lake             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  2. Knowledge Lake Logger                                 │  │
│  │     - Log: All incoming commands                          │  │
│  │     - Search: Retrieve relevant context                   │  │
│  │     - Track: Agent utilization and performance            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3. Agent Router                                          │  │
│  │     - Route: Based on persona + agent mapping             │  │
│  │     - Execute: Call appropriate agent API                 │  │
│  │     - Monitor: Track execution status                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  4. Response Aggregator                                   │  │
│  │     - Collect: Agent outputs                              │  │
│  │     - Format: Apply template (BOARD_PAPER_V1, etc.)       │  │
│  │     - Validate: Check completeness                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  5. Integration Layer                                     │  │
│  │     - Notion: Update databases                            │  │
│  │     - Slack: Post formatted responses                     │  │
│  │     - Knowledge Lake: Store final output                  │  │
│  │     - Google Drive: Save artifacts                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐     ┌──────────┐     ┌─────────┐
   │  Fred   │     │  Claude  │     │ Gemini  │
   │ (OpenAI)│     │(Anthropic)│    │(Google) │
   └─────────┘     └──────────┘     └─────────┘
        ▼                ▼                ▼
   ┌─────────┐     ┌──────────┐     ┌─────────┐
   │  Fredo  │     │  Penny   │     │  Grok   │
   │(ChatGPT)│     │(Perplexity)│   │ (X.com) │
   └─────────┘     └──────────┘     └─────────┘
        ▼                ▼                ▼
   ┌─────────┐     ┌──────────┐     ┌─────────┐
   │  Manus  │     │  Jan     │     │NotebookLM│
   │ (MCP)   │     │(Genspark)│     │(Google) │
   └─────────┘     └──────────┘     └─────────┘
```

---

## 🔧 mtmot-unified-mcp Implementation

### API Endpoints Dev Should Expose

#### 1. Command Execution Endpoint
```http
POST /api/execute
Content-Type: application/json

{
  "command": "cmd:PLAN persona:roadmap task:'MTMOT Mastermind Hub launch'",
  "user_id": "carla",
  "context": {
    "source": "slack",
    "thread_id": "abc123"
  }
}
```

**Dev's Processing:**
1. Parse command → CODE=PLAN, persona=roadmap, agent=fred (from schema)
2. Query Knowledge Lake → Get context about MTMOT, previous project plans
3. Route to Fred API → With persona=roadmap system prompt
4. Format response → Apply PROJECT_PLAN_V1 template
5. Log to Knowledge Lake → Store complete interaction
6. Update Notion → Create project in appropriate database
7. Return formatted output

---

#### 2. Multi-Agent Coordination Endpoint
```http
POST /api/orchestrate
Content-Type: application/json

{
  "workflow": "course_generation",
  "steps": [
    {"code": "RESEARCH", "agent": "gemini", "persona": "research", "topic": "AHPRA compliance"},
    {"code": "COURSE", "agent": "fredo", "persona": "course", "input": "$RESEARCH.output"},
    {"code": "POD", "agent": "fred", "persona": "creator", "input": "$COURSE.module[0]"}
  ],
  "notion_database": "courses-education"
}
```

**Dev's Processing:**
1. Execute sequential workflow
2. Pass outputs between agents
3. Log each step to Knowledge Lake
4. Update Notion at each milestone
5. Return aggregated results

---

#### 3. Knowledge Lake Query Endpoint
```http
POST /api/knowledge/query
Content-Type: application/json

{
  "query": "Previous project plans for MTMOT",
  "agent_filter": "fred",
  "persona_filter": "roadmap",
  "limit": 5
}
```

**Dev's Capability:**
- Direct API access to Knowledge Lake (ONLY agent with this!)
- Filter by agent and persona
- Retrieve context for current task

---

#### 4. FredCast Shortcut Endpoint
```http
POST /api/shortcut/:code
Content-Type: application/json

{
  "code": "BOARD",
  "inputs": {
    "topic": "MTMOT Q1 2026 Strategy",
    "audience": "Board of Directors"
  },
  "override_agent": "claude",  // Optional: override default
  "override_persona": "strat",  // Optional: override default
  "notion_page": "uuid-here"
}
```

**Dev's Processing:**
1. Look up code=BOARD → agent=fredo, persona=fredo, template=BOARD_PAPER_V1
2. Apply overrides if provided (use claude + strat)
3. Build system prompt with persona playbook
4. Execute via agent API
5. Format output per BOARD_PAPER_V1 template
6. Update Notion page with results

---

#### 5. Voice Command Parser Endpoint
```http
POST /api/voice
Content-Type: application/json

{
  "transcription": "Maya — create a project plan for the Mastermind Hub launch with milestones for January",
  "user_id": "carla"
}
```

**Dev's Processing:**
1. Parse natural language → Detect "Maya" = persona:roadmap
2. Infer code → PLAN (from "project plan")
3. Extract parameters → task="Mastermind Hub launch", timeline="January"
4. Build formal command → `cmd:PLAN agent:fred persona:roadmap task:"..." timeline:"January"`
5. Execute via /api/execute endpoint
6. Return formatted project plan

---

## 💡 Key Advantages of Dev as API Gateway

### 1. **Programmatic Knowledge Lake Access**
```javascript
// Dev can do this (no other agent can):
const context = await knowledgeLake.search({
  query: "MTMOT project history",
  agent: "fred",
  persona: "roadmap"
});

const result = await fred.execute({
  prompt: buildPrompt(context, userRequest),
  persona: "roadmap"
});

await knowledgeLake.log({
  agent: "fred",
  persona: "roadmap",
  input: userRequest,
  output: result,
  template: "PROJECT_PLAN_V1"
});
```

### 2. **Cross-Agent Memory**
Every interaction logged with:
- Agent used
- Persona applied
- Template followed
- Input/output
- Performance metrics

This creates a **learning knowledge base** where Dev can:
- Recommend best agent for task type
- Suggest persona based on similar past requests
- Improve routing over time

### 3. **Notion Database Automation**
```javascript
// Dev can programmatically update Notion
await notion.pages.create({
  parent: { database_id: COURSES_DB },
  properties: {
    "Course Name": courseOutput.title,
    "Module Count": courseOutput.modules.length,
    "Generated By": { agent: "fredo", persona: "course" },
    "Template": "COURSE_MOD_V1"
  },
  children: formatAsNotionBlocks(courseOutput)
});
```

### 4. **Multi-Agent Workflows**
Dev can orchestrate complex workflows:

**Example: Complete Course Generation**
```javascript
// 1. Research phase (Gemini + research persona)
const research = await dev.execute({
  code: "RESEARCH",
  agent: "gemini",
  persona: "research",
  topic: courseRequest.topic
});

// 2. Course architecture (Fredo + course persona)
const courseModules = await dev.execute({
  code: "COURSE",
  agent: "fredo",
  persona: "course",
  input: research.output
});

// 3. Podcast episodes (Fred + creator persona)
const podcastScripts = await Promise.all(
  courseModules.modules.map(module =>
    dev.execute({
      code: "POD",
      agent: "fred",
      persona: "creator",
      input: module.content
    })
  )
);

// 4. Post-production (Fred + edit persona)
const showNotes = await Promise.all(
  podcastScripts.map(script =>
    dev.execute({
      code: "POD_POST",
      agent: "fred",
      persona: "edit",
      input: script.output
    })
  )
);

// 5. Update Notion with complete course
await dev.updateNotion({
  database: "courses-education",
  course: {
    research,
    modules: courseModules,
    podcasts: podcastScripts,
    showNotes
  }
});

// 6. Log everything to Knowledge Lake
await dev.logWorkflow({
  workflow: "course_generation",
  steps: [research, courseModules, podcastScripts, showNotes],
  duration: executionTime,
  success: true
});
```

---

## 🔌 Integration Points

### Slack Integration
```
User in Slack: @AAE cmd:BOARD topic:"Q1 Strategy Review"
    ↓
Slack Webhook → Dev API → /api/shortcut/BOARD
    ↓
Dev executes: Fredo + fredo persona + BOARD_PAPER_V1 template
    ↓
Dev formats: Purpose, Background, Analysis, Options, Recommendation
    ↓
Dev posts to Slack thread + Updates Notion + Logs to Knowledge Lake
```

### Voice Command Integration
```
User says: "Maya — create project plan for Nera app launch"
    ↓
Voice → Transcription → Dev API → /api/voice
    ↓
Dev parses: Maya = roadmap persona, "project plan" = PLAN code
    ↓
Dev executes: Fred + roadmap persona + PROJECT_PLAN_V1 template
    ↓
Dev returns: Formatted project plan with Scope, Milestones, RACI
```

### n8n Workflow Integration
```
n8n Trigger: New Notion database entry in "Course Ideas"
    ↓
n8n → Dev API → /api/orchestrate
    ↓
Dev executes: Multi-agent course generation workflow
    ↓
Dev updates: Notion with all outputs, logs to Knowledge Lake
    ↓
n8n sends: Email notification "Course generation complete"
```

### VibeSDK Integration
```
VibeSDK user event: "User completed memoir interview"
    ↓
VibeSDK → Dev API → /api/execute
    ↓
Dev executes: cmd:MEMOIR agent:fredo persona:int
    ↓
Dev formats: Interview questions per MEMOIR_QSET_V1 template
    ↓
Dev returns: Question set + stores in Knowledge Lake
```

---

## 📊 Monitoring & Analytics

Dev can provide real-time analytics:

### Agent Utilization Dashboard
```javascript
GET /api/analytics/agent-usage?period=7days

Response:
{
  "fred": { calls: 145, avg_response_time: "2.3s", success_rate: 0.98 },
  "claude": { calls: 89, avg_response_time: "3.1s", success_rate: 0.99 },
  "gemini": { calls: 203, avg_response_time: "1.2s", success_rate: 0.97 },
  ...
}
```

### Persona Effectiveness
```javascript
GET /api/analytics/persona-effectiveness

Response:
{
  "roadmap": { usage: 78, satisfaction: 4.8, completion_rate: 0.95 },
  "research": { usage: 156, satisfaction: 4.6, completion_rate: 0.91 },
  "course": { usage: 34, satisfaction: 4.9, completion_rate: 0.97 },
  ...
}
```

### Template Compliance
```javascript
GET /api/analytics/template-compliance

Response:
{
  "BOARD_PAPER_V1": { required_sections: 7, avg_completion: 6.8 },
  "PROJECT_PLAN_V1": { required_sections: 6, avg_completion: 6.0 },
  "COURSE_MOD_V1": { required_sections: 5, avg_completion: 5.0 }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core API Gateway (Week 1)
- [ ] Build `/api/execute` endpoint in mtmot-unified-mcp
- [ ] Implement command parser for FredCast syntax
- [ ] Add Knowledge Lake API integration (logging only)
- [ ] Test with SUMM and ACTION shortcuts (simplest)

### Phase 2: Agent Routing (Week 2)
- [ ] Implement agent API integrations (Fred, Fredo, Claude, Gemini)
- [ ] Add persona system prompt injection
- [ ] Build template formatting engine
- [ ] Test with BOARD, BID, PLAN shortcuts

### Phase 3: Multi-Agent Orchestration (Week 3)
- [ ] Implement `/api/orchestrate` for sequential workflows
- [ ] Add inter-agent output passing
- [ ] Build workflow state management
- [ ] Test course generation workflow (RESEARCH → COURSE → POD)

### Phase 4: Integrations (Week 4)
- [ ] Slack webhook integration
- [ ] Voice command parser (`/api/voice`)
- [ ] n8n webhook triggers
- [ ] Notion database automation
- [ ] Analytics dashboard (`/api/analytics/*`)

### Phase 5: Optimization (Month 2)
- [ ] Caching layer for Knowledge Lake queries
- [ ] Parallel agent execution where possible
- [ ] Smart agent selection (ML-based routing)
- [ ] Performance monitoring and alerts

---

## 🔒 Security Considerations

### Authentication
```javascript
// Dev API requires API key authentication
headers: {
  "Authorization": "Bearer dev_api_key_here",
  "X-User-ID": "carla"
}
```

### Rate Limiting
```javascript
// Per user rate limits
{
  "free_tier": { requests_per_hour: 100 },
  "carla": { requests_per_hour: 10000 }  // Unlimited for owner
}
```

### Audit Logging
All requests logged to Knowledge Lake with:
- User ID
- Command executed
- Agent/persona used
- Execution time
- Success/failure
- Cost (API calls)

---

## 💰 Cost Optimization

Dev can optimize costs by:

1. **Agent Selection:**
   - Use Gemini (fast/cheap) for quick tasks
   - Use Claude (expensive/smart) only for strategy
   - Use Fred (balanced) for most work

2. **Caching:**
   - Cache Knowledge Lake queries (5 min TTL)
   - Cache agent responses for identical requests
   - Reuse research outputs across related tasks

3. **Batching:**
   - Queue low-priority tasks
   - Batch similar requests to same agent
   - Execute off-peak when possible

---

## 📚 Related Documentation

- [AAE_AGENT_PERSONAS.md](./AAE_AGENT_PERSONAS.md) - Agent and persona mapping
- [AAE_Shortcut_Schema.json](../../aae-council/AAE_Shortcut_Schema.json) - Shortcut codes
- [N8N_AI_AGENT_ROUTER_WORKFLOW_CORRECTED.md](./N8N_AI_AGENT_ROUTER_WORKFLOW_CORRECTED.md) - n8n workflows

---

## 🎯 Success Metrics

### Week 1 Goals:
- ✅ Dev API responding to basic commands
- ✅ Knowledge Lake logging operational
- ✅ 10+ successful SUMM and ACTION executions

### Month 1 Goals:
- ✅ All 15 shortcut codes supported
- ✅ 100+ successful multi-agent workflows
- ✅ Slack and n8n integrations live
- ✅ <2s average response time

### Quarter 1 Goals:
- ✅ 1000+ agent interactions logged
- ✅ 95%+ template compliance
- ✅ Voice command accuracy >90%
- ✅ Full AAE ecosystem integration (Notion, Google Drive, Slack)

---

**Status:** Architecture design complete - ready for mtmot-unified-mcp implementation
**Owner:** Carla / Dev (ChatGPT Business - Developer Mode)
**Priority:** HIGH - Central nervous system for entire AAE
