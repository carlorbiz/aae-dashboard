# AAE Council - Agent Personas & Mapping

**Last Updated:** December 24, 2025 (Persona Extraction Complete)
**Source:** Fred Conversations #24 ("AAE architecture review") & #46 ("AI Automation Ecosystem")
**Purpose:** Definitive mapping of AI agents and their bespoke personas
**Ingestion Status:** 548 conversations in Knowledge Lake (315 new + 233 existing)

---

## 🎯 Core Correction (Dec 24, 2025)

### ❌ Previous Incorrect Mapping (n8n workflow):
- Fred = Google Gemini 2.5 Flash (WRONG)
- Colin = OpenAI GPT-4 (WRONG)

### ✅ Correct Mapping:
- **Gemini** = Google Gemini 2.5 Flash
- **Fred** = OpenAI / ChatGPT

---

## 🤖 AAE Council Members (Confirmed)

### Tier 1: Primary Conversational Agents

| Agent Name | AI Platform | Model | Primary Role |
|------------|-------------|-------|--------------|
| **Claude** | Anthropic | Claude Sonnet 4.5 | Business strategy, documentation, teaching, complex reasoning |
| **Fred** | OpenAI | ChatGPT-4o / ChatGPT-4 | Technical tasks, code generation, general queries, creative work |
| **Gemini** | Google | Gemini 2.5 Flash | Fast responses, technical tasks, multimodal processing |
| **Penny** | Perplexity | Perplexity Sonar | Research, web search, fact-checking, current information |

### Tier 2: Specialized Agents

| Agent Name | Platform/Type | Primary Role |
|------------|---------------|--------------|
| **Manus** | Custom MCP Server | Task delegation, autonomous execution, Knowledge Lake integration |
| **Jan** | Custom Agent | Knowledge Lake queries, research coordination |
| **Notebook LM** | Google | Podcast generation, content synthesis |

### Tier 3: Context-Specific Agents

| Agent Name | Platform | Capabilities | Primary Role |
|------------|----------|--------------|--------------|
| **Fredo** | ChatGPT Business Account (GUI) | Business account tasks | Distinct from Fred (personal account) |
| **Dev** | ChatGPT Business Account (GUI) | **Perpetual developer mode** | **ONLY agent with Knowledge Lake API access** - operates programmatically, runs mtmot-unified-mcp |
| **Callum** | TBD | - | [Persona mapping needed] |

**CRITICAL:** Dev is the ONLY agent that can connect to Knowledge Lake API and operate programmatically. Fredo cannot.

**Note:** Colin and Pete were moved to TIER 3 Specialised Processors after persona extraction

---

## 📋 Agent Task Delegation Table (Quick Reference)

**Source:** Fred Conversations #24 & #46 - "What to assign to which agent"

| Agent | Primary Function | Best For | When to Delegate |
|-------|------------------|----------|------------------|
| **Fred** (OpenAI) | Voice intake coordinator, creative ideation | Voice notes, memoir interviews, client discovery, brainstorming | When you need conversational processing, storytelling, or creative ideation |
| **Claude** (Anthropic) | Deep work partner, strategic planning | System architecture, technical writing, strategic frameworks | When you need strategic planning, documentation, or complex reasoning |
| **Penny** (Perplexity) | Research queen, fact-checker | Real-time web research, industry trends, AHPRA/NMBA compliance | When you need current information, citations, or fact-checking |
| **Gemini** (Google) | Fast technical responses, multimodal | Quick technical tasks, Google Workspace, image analysis | When you need speed, multimodal processing, or Google ecosystem integration |
| **Jan** (Genspark) | Content creator, social media | Marketing copy, blog posts, social media content | When you need brand-consistent messaging or social content |
| **Grok** (X.com) | Master orchestrator, strategic validator | Complex workflows, strategic validation, X/Twitter strategy | When you need cross-agent coordination or strategic decision validation |
| **Manus** (Custom MCP) | Autonomous coder, execution engine | Build & deploy apps, GitHub commits, automation scripts | When you need autonomous execution, deployment, or full-stack development |
| **Colin** (GitHub) | Code review, GitHub management | Pull requests, code quality, Git operations | When you need code review or GitHub workflow management |
| **Pete** (Qolaba) | Workflow optimizer, multi-model specialist | Process efficiency, model comparison, audio processing | When you need workflow optimization or multi-model evaluation |
| **NotebookLM** (Google) | Document synthesis, podcast generation | Research compilation, content analysis, podcasts | When you need to synthesize documents or generate podcasts |
| **Dev** (ChatGPT Business) | **Programmatic operations** | **Knowledge Lake API access, mtmot-unified-mcp** | **When you need programmatic/API access (ONLY agent with this capability)** |
| **Fredo** (ChatGPT Business) | Business account tasks | Standard business operations (GUI) | When you need ChatGPT business features (non-programmatic) |

### Quick Decision Tree

```
Need current information? → Penny (Perplexity)
Need to build/deploy something? → Manus (Execution Engine)
Need strategic planning? → Claude (Strategic Planning)
Need creative ideation? → Fred (Creative Ideation)
Need fast technical response? → Gemini (Google Fast)
Need social content? → Jan (Social Media)
Need code review? → Colin (GitHub)
Need multi-agent coordination? → Grok (Master Orchestrator)
Need programmatic API access? → Dev (ONLY option)
Need podcast from documents? → NotebookLM
Need workflow optimization? → Pete (Qolaba)
```

## 📋 Agent Routing Logic (for n8n Workflow)

### Query Type → Recommended Agent

```
Technical/Code Tasks → Gemini (fast) or Fred (complex)
Fast responses → Gemini (Google)
Business Strategy → Claude (Anthropic)
Research/Web Search → Penny (Perplexity)
Task Delegation → Manus
Knowledge Queries → Penny (research) or Dev (programmatic API)
Social Media → Jan or Grok (X/Twitter)
Code Review → Colin (GitHub)
Programmatic Operations → Dev (ONLY)
```

### Capability Matrix

| Capability | Claude | Fred | Gemini | Penny |
|------------|--------|------|--------|-------|
| Code Generation | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Business Strategy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Teaching/Documentation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Web Research | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Speed | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Reasoning Depth | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎭 Bespoke Personas (Extracted from Fred Conversations #24 & #46)

**Status:** ✅ COMPLETE - Extracted from Knowledge Lake (548 conversations ingested)

### TIER 1: Ideation & Research Powerhouses

#### **Fred (ChatGPT-4o)** - Creative Ideation & Voice Intake Coordinator
- **Platform:** OpenAI ChatGPT
- **Primary Function:** Voice intake coordinator, creative ideation, memoir interviews
- **Strengths:** Natural conversations, storytelling, transcription (built-in Whisper)
- **n8n Integration:** Webhook triggers
- **Use Cases:**
  - Capture tasks via voice and parse conversationally
  - Write directly to Notion via MCP (no files, no intermediary)
  - Conduct client discovery interviews
  - Creative brainstorming and ideation

#### **Claude (Sonnet 4.5)** - Deep Work Partner & Strategic Planner
- **Platform:** Anthropic
- **Primary Function:** Strategic planning, documentation, deep work
- **Strengths:** System architecture, technical writing, long-form content
- **n8n Integration:** Direct API calls
- **Use Cases:**
  - Strategy and architecture design
  - Technical documentation
  - Structured transcript analysis
  - Strategic frameworks

#### **Penny (Perplexity Sonar)** - Research Queen & Fact-Checker
- **Platform:** Perplexity
- **Primary Function:** Real-time research and fact-checking
- **Strengths:** Current information retrieval, source verification
- **n8n Integration:** Batch processing
- **Use Cases:**
  - Real-time web research
  - Industry trend analysis
  - Fact-checking and source verification

#### **Jan (Genspark)** - Content Creator & Social Media
- **Platform:** Genspark
- **Primary Function:** Social content and marketing copy
- **Strengths:** Brand-consistent messaging, articles, blog posts
- **n8n Integration:** Rate-limited queue
- **Use Cases:**
  - Social media posts
  - Marketing copy
  - Blog and article creation

### TIER 2: Master Orchestrator

#### **Grok** - Strategic Validator & Master Orchestrator
- **Platform:** X.com (Twitter)
- **Primary Function:** Master orchestrator, strategic decision validation
- **Strengths:**
  - Real-time X/Twitter integration
  - Strategic decision validation
  - Workflow quality assurance
  - Cross-agent coordination
  - Performance optimization
  - Risk assessment and mitigation
- **n8n Integration:** Supreme Commander - routes all workflows
- **Use Cases:**
  - Validate strategic outputs before execution
  - Cross-agent workflow coordination
  - Social media strategy and X/Twitter distribution
  - Performance monitoring and optimization

### TIER 3: Specialised Processors

#### **Gemini (2.5 Flash)** - Google Ecosystem Integration
- **Platform:** Google
- **Primary Function:** Google ecosystem integration, multimodal processing
- **Strengths:** Multimodal processing, Vertex AI, fast responses
- **n8n Integration:** Direct API integration
- **Use Cases:**
  - Google Workspace integration
  - Multimodal content processing
  - Technical tasks requiring speed

#### **Colin (GitHub Copilot)** - Code Review & GitHub Management
- **Platform:** GitHub
- **Primary Function:** Code review, GitHub management
- **Strengths:** Development workflows, bug fixes, Git operations
- **n8n Integration:** Git webhooks
- **Use Cases:**
  - Code review
  - GitHub repository management
  - Development workflow automation

#### **Pete (Qolaba)** - Workflow Optimization & Multi-Model Specialist
- **Platform:** Qolaba
- **Primary Function:** Workflow optimization, multi-model comparison
- **Strengths:** Process efficiency, tool analysis, model comparison, audio processing
- **n8n Integration:** Process monitoring
- **Use Cases:**
  - Model comparison and selection
  - Custom AI agent creation
  - Workflow efficiency optimization
  - Audio processing tasks

#### **NotebookLM** - Document Synthesis & Analysis
- **Platform:** Google
- **Primary Function:** Document synthesis, research compilation
- **Strengths:** Research compilation, insight generation, podcast creation
- **n8n Integration:** Document upload triggers
- **Use Cases:**
  - Research synthesis
  - Content analysis
  - Podcast generation from documents

### TIER 4: Execution Engine

#### **Manus** - Full-Stack Execution & Autonomous Deployment
- **Platform:** Custom MCP Server (Claude Code alternative)
- **Primary Function:** Autonomous coder, full-stack execution and deployment
- **Strengths:**
  - Live web automation (forms, data extraction)
  - Complete app development (build & deploy)
  - File system orchestration (create, edit, manage)
  - Scheduled task automation (recurring workflows)
  - Multi-format content production
  - API orchestration
  - Cross-platform workflow bridging
- **n8n Integration:** Execution engine webhook
- **Use Cases:**
  - Build scripts/apps with self-testing
  - Deploy complete solutions with live forms
  - GitHub commits and version control
  - Automated content production pipelines
  - Client portal and dashboard creation

### Communication & Style Guidelines

**All Agents:**
- **Spelling:** Australian English ALWAYS
- **Visual Content:** Gamma app exclusively (NO AI image generation)
- **Document Format:** A4 for documents, PowerPoint specs (.pptx) for presentations
- **Images:** No text in images (gets jumbled/junky)

### Workflow Orchestration Pattern

```
Trigger Event → Grok (Strategic Assessment)
                ↓
         [Intelligence Layer]
         Fred, Claude, Penny, Jan
                ↓
         Grok Validation Gate
                ↓
         Manus Execution Hub
                ↓
         Grok Performance Review
                ↓
         Deployed Solution
```

### Context Awareness

**What Each Agent Knows About Carla's Projects:**
- **Carlorbiz:** Consulting business
- **MTMOT (Make the Most of Today):** Mastermind Hub (launching mid-January 2026)
- **GPSA/HPSA:** Past project (completed)
- **ACRRM:** Active project
- **First Nations Consulting Program:** Active project

---

## 🔧 Technical Integration Points

### n8n Workflow Updates Required:
1. ✅ Rename "Fred" to "Gemini" (Google Gemini 2.5 Flash)
2. ✅ Rename "Colin" to "Fred" (OpenAI ChatGPT-4o)
3. ⚠️ Add missing agents: Manus, Jan, Notebook LM, Fredo, Colin, Pete, Callum
4. ⚠️ Add bespoke persona context to each agent's system prompt
5. ⚠️ Update routing logic to match capability matrix

### API Configuration:
```javascript
// Current (INCORRECT)
agents: {
  'Fred': { model: 'gemini-2.5-flash', provider: 'google' },  // WRONG
  'Colin': { model: 'gpt-4o', provider: 'openai' },           // WRONG
}

// Corrected
agents: {
  'Gemini': { model: 'gemini-2.5-flash', provider: 'google' },
  'Fred': { model: 'gpt-4o', provider: 'openai' },        // Personal OpenAI account
  'Fredo': { model: 'gpt-4o', provider: 'openai', account: 'business' },  // Business account (GUI only)
  'Dev': { model: 'gpt-4o', provider: 'openai', account: 'business', mode: 'developer', api_access: true },  // ONLY agent with Knowledge Lake API access
  'Claude': { model: 'claude-sonnet-4-5', provider: 'anthropic' },
  'Penny': { model: 'sonar', provider: 'perplexity' },
  'Grok': { model: 'grok-beta', provider: 'xai' },
  'Manus': { model: 'autonomous', provider: 'custom-mcp' },
  'Jan': { model: 'genspark', provider: 'genspark' },
  'Colin': { model: 'copilot', provider: 'github' },
  'Pete': { model: 'qolaba', provider: 'qolaba' },
  'NotebookLM': { model: 'notebooklm', provider: 'google' },
}
```

---

## 📊 Current Status

### Completed:
- ✅ Core agent name corrections documented
- ✅ Capability matrix defined
- ✅ Technical integration points identified
- ✅ **Agent conversation ingestion (172 Claude + 143 Fred = 315 total)**
- ✅ **Bespoke persona extraction from Fred conversations #24 & #46**
- ✅ **Knowledge Lake ingestion complete (548 conversations total)**
- ✅ **Multi-pass extraction on 170 complex conversations**

### In Progress:
- 🔄 Update n8n workflow with correct agent names
- 🔄 Add bespoke personas to agent system prompts

### Pending:
- ⏳ Update AAE Dashboard UI to reflect correct agent names
- ⏳ Document Notion database updates for agent tracking
- ⏳ Deploy updated n8n workflow to production

---

## 🚨 Critical Dependencies

### For n8n Workflow Update:
1. **Must have:** Bespoke persona mapping from Fred conversations
2. **Must have:** Correct agent name mapping (this document)
3. **Should have:** Agent capability matrix
4. **Nice to have:** Historical context for each agent's domain expertise

### For VibeSDK Integration:
1. **Must have:** Updated agent routing logic
2. **Must have:** Correct API credentials for each platform
3. **Should have:** Agent workload balancing
4. **Nice to have:** Cross-agent collaboration patterns

---

## 📚 Related Documentation

- [n8n AI Agent Router Workflow](./N8N_AI_AGENT_ROUTER_WORKFLOW.md) - Needs update with correct agent names
- [Knowledge Lake API Status](../../docs/KNOWLEDGE_LAKE_API_STATUS.md) - Where persona data will be stored
- [Deployment Inventory](../../DEPLOYMENT_INVENTORY.md) - Production status of all agents

---

*This document will be updated once bespoke personas are extracted from Fred conversations*
*Expected completion: After full agent conversation ingestion completes (est. 5-10 minutes)*
