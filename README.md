# AAE Dashboard - Knowledge Lake Control Center

A full-stack web application serving as the unified control center for the **AI Automation Ecosystem (AAE)**. This dashboard provides comprehensive monitoring, management, and AI-powered insights across all your platforms, workflows, and knowledge sources.

## 🎯 Project Vision

The AAE Dashboard is designed to be the central nervous system of your AI Automation Ecosystem, providing:

- **Unified Knowledge View** - Search and access content from Notion, Google Drive, GitHub, and the Railway-hosted Knowledge Lake API
- **Platform Integration Status** - Real-time monitoring of all connected platforms (Notion, Google Drive, GitHub, Slack, Railway, Docker, Zapier, MCPs)
- **LLM Performance Monitoring** - Comprehensive dashboards showing performance metrics, token usage, costs, and response times
- **Workflow Automation Hub** - Centralized view of n8n workflows, Zapier automations, and MCP-driven processes
- **AI Assistant** - Context-aware chat interface for interrogating dashboard data and receiving insights

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 19 + Tailwind 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11 (type-safe API)
- **Database**: MySQL/TiDB via Drizzle ORM
- **Authentication**: Manus OAuth with role-based access control
- **Deployment**: Manus Platform (auto-scaling + global CDN)

### Hybrid n8n/MCP Integration

The dashboard is designed to work seamlessly with the AAE's hybrid architecture:

- **n8n Workflows** - For complex, multi-step workflows and scheduled tasks
- **MCPs (Model Context Protocol)** - For direct, conversational automation and real-time interactions
- **Zapier** - For third-party service integrations and simple automations

## 📊 Database Schema

### Core Tables

1. **users** - Authentication and user management
2. **platformIntegrations** - Connection status and metadata for all integrated platforms
3. **llmMetrics** - Daily aggregated performance metrics for LLMs
4. **workflows** - n8n, Zapier, and MCP workflow status and performance
5. **knowledgeItems** - Cached references to knowledge base content from all sources
6. **notifications** - Internal notification system for dashboard alerts

### Knowledge Graph Tables (New - 2025-11-17)

7. **entities** - Core knowledge graph nodes with semantic state pipeline
   - 6 entity types: Consulting, ExecutiveAI, Agents, Content, Technology, ClientIntelligence
   - 4 semantic states: RAW → DRAFT → COOKED → CANONICAL
   - Tracks source, properties (JSON), and versioning
8. **relationships** - Edges connecting entities in the knowledge graph
   - Typed relationships (mentions, depends_on, created_by, etc.)
   - Weight (1-10) for relationship strength
   - Semantic states for relationship maturity
9. **semantic_history** - Audit trail for semantic state transitions
   - Who changed it (userId)
   - Why (reason text)
   - Complete state transition history

## 🚀 Features

### ✅ Implemented

- **Dashboard Overview** - Stats cards showing platform status, workflow activity, LLM usage, and notifications
- **Platform Integrations Page** - Monitor and manage connections to all platforms
- **LLM Metrics Page** - Track usage, costs, tokens, and performance across all AI models
- **Workflows Page** - View and manage n8n, Zapier, and MCP workflows with run statistics
- **Knowledge Lake Page** - Search interface for unified knowledge access (UI ready, integrations pending)
- **AI Assistant** - Context-aware chat interface that pulls live data from your entire AAE
- **Knowledge Graph Foundation** (New - 2025-11-17)
  - **Entity Management** - Create, read, update entities across 6 business categories
  - **Relationship Mapping** - Link entities with typed, weighted relationships
  - **Semantic Pipeline** - RAW → DRAFT → COOKED → CANONICAL state progression
  - **Audit Trail** - Complete history of semantic state transitions
  - **Graph Queries** - Traverse relationships, search entities, filter by state
  - **8 tRPC Endpoints** - Type-safe API for all knowledge graph operations
- **Dark Theme** - Professional dark mode with Inter font
- **Responsive Design** - Works seamlessly on all devices
- **Role-Based Access Control** - Admin and user roles with appropriate permissions

### 🔄 In Progress / Planned

- **Knowledge Ingestion** (In Progress - 2025-11-17)
  - Transcript parser for conversation files
  - Automatic entity extraction (agents, topics, decisions, action items)
  - Relationship creation from conversation context
  - Ingestion tRPC endpoint
- **Knowledge Graph Visualization** (Next)
  - Interactive D3.js/Cytoscape.js graph viewer
  - Click-to-explore entity relationships
  - Real-time updates as knowledge grows
  - Manus to implement UI (coordinated by CC)
- **Platform API Integrations** - Connect to Notion, Google Drive, GitHub, Slack APIs
- **Railway Knowledge Lake API Integration** - Connect to Mem0-based semantic search
- **Vector Search Layer** - Add Cloudflare Vectorize for semantic retrieval
- **Sync Workflows** - Automated data synchronization via n8n
- **Real-time Notifications** - WebSocket or Server-Sent Events for live updates
- **Data Visualizations** - Charts and graphs for metrics and trends
- **Conversational Updates** - AI assistant ability to modify dashboard settings

## 🔧 Development Setup

### Prerequisites

- Node.js 22.x
- pnpm package manager
- MySQL/TiDB database

### Installation

```bash
# Clone the repository
git clone https://github.com/carlorbiz/aae-dashboard.git
cd aae-dashboard

# Install dependencies
pnpm install

# Set up environment variables
# (See .env.example for required variables)

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

The following environment variables are automatically injected by the Manus platform:

- `DATABASE_URL` - MySQL/TiDB connection string
- `JWT_SECRET` - Session cookie signing secret
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Manus OAuth backend base URL
- `VITE_OAUTH_PORTAL_URL` - Manus login portal URL
- `OWNER_OPEN_ID`, `OWNER_NAME` - Owner's info
- `VITE_APP_TITLE` - Dashboard title
- `VITE_APP_LOGO` - Logo image URL
- `BUILT_IN_FORGE_API_URL` - Manus built-in APIs
- `BUILT_IN_FORGE_API_KEY` - Bearer token for Manus APIs

Additional variables needed for full functionality:
- Platform API keys (Notion, Google Drive, GitHub, Slack)
- Railway Knowledge Lake API URL and credentials

## 📁 Project Structure

```
aae-dashboard/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PlatformIntegrations.tsx
│   │   │   ├── LLMMetrics.tsx
│   │   │   ├── Workflows.tsx
│   │   │   ├── KnowledgeLake.tsx
│   │   │   └── AIChat.tsx
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client
│   │   └── App.tsx        # Routes and layout
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Main tRPC router
│   ├── routers/           # Feature-specific routers
│   │   └── chat.ts        # AI chat router
│   ├── db.ts              # Database query helpers
│   └── _core/             # Framework plumbing
├── drizzle/               # Database schema and migrations
│   └── schema.ts
└── README.md
```

## 🤝 Integration with AAE Components

### Knowledge Lake API (Railway)

The dashboard is designed to integrate with the Railway-hosted Knowledge Lake API (Mem0-based) for:
- Semantic search across all knowledge sources
- Context retrieval for AI assistant responses
- Unified memory layer for the AAE

### n8n Workflows

Planned n8n workflows for the dashboard:
- **Platform Sync Workflow** - Scheduled sync of metadata from Notion, Google Drive, GitHub
- **LLM Metrics Collection** - Aggregate and store LLM usage data
- **Workflow Status Monitor** - Track n8n, Zapier, and MCP workflow health
- **Notification Dispatcher** - Send alerts for errors and important events

### MCP Integration

The dashboard can be extended with MCPs for:
- Direct platform interactions (read/write to Notion, GitHub, etc.)
- Conversational workflow triggers
- Real-time data updates

## 📝 Documentation

- **[Project Understanding Document](../carla-aae-ecosystem/memory-points/aae_dashboard_understanding.md)** - Comprehensive overview of the project vision and architecture
- **[Initialization Memory Point](../carla-aae-ecosystem/memory-points/aae-dashboard-initialization-2025-11-04.md)** - Detailed architectural decisions and implementation notes
- **[TODO List](./todo.md)** - Current implementation status and planned features

## 🔗 Related Repositories

- [carla-aae-ecosystem](https://github.com/carlorbiz/carla-aae-ecosystem) - AAE documentation and memory points
- Knowledge Lake API (Railway) - *URL to be added*
- n8n Workflows - *URL to be added*

## 👥 Collaboration

This project is being developed in coordination with:
- **CC (Claude)** - AI agent consultant via Zapier MCP
- **Manus** - Development and implementation
- **Carla** - Project owner and AAE architect

## 📄 License

*To be determined*

## 🚀 Deployment

The dashboard is deployed on the Manus platform with:
- Auto-scaling infrastructure
- Global CDN for fast access worldwide
- Integrated database and authentication
- Automatic SSL certificates

**Live Dashboard**: *URL to be added after deployment*

---

**Last Updated**: 2025-11-17
**Status**: Knowledge Graph foundation complete (Day 1), ingestion system in progress (Day 2)
**Version**: 1.1.0-alpha

### Recent Updates

**2025-11-17** - Knowledge Graph Foundation (Phase 1, Day 1)
- Added 3 knowledge graph tables to D1 database (entities, relationships, semantic_history)
- Implemented 8 tRPC endpoints for knowledge graph operations
- Semantic state pipeline: RAW → DRAFT → COOKED → CANONICAL
- Admin-only promotion to CANONICAL state
- Relationship traversal and graph queries
- Full audit trail for state transitions
- SQLite migration applied successfully to local D1
- TypeScript compilation: 0 errors
- 7 database indexes for query performance
