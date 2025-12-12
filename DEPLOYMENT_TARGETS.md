# Commercial Deployment Targets - AAE Dashboard

**Last Updated**: December 12, 2025
**Status**: Active Production Architecture
**Purpose**: Define VALID deployment destinations for commercial release

---

## ✅ VALID Deployment Platforms

### 1. Railway (Current Production)

**What's Deployed**:
- ✅ Knowledge Lake API (https://knowledge-lake-api-production.up.railway.app)
- ✅ MTMOT Unified MCP Server (https://mtmot-unified-mcp-production.up.railway.app)
- ✅ PostgreSQL Database (production persistence)

**Capabilities**:
- Auto-deploy from GitHub commits
- PostgreSQL database with auto-backups
- Environment variable management
- 99.9% uptime SLA
- WebSocket support
- Docker containerization

**Cost**: ~$20-40/month for production tier

**Use For**:
- Backend APIs requiring Node.js/Python
- Database-backed services
- MCP servers
- Auto-scaling workloads

### 2. Hostinger (Commercial Release Target)

**What Will Be Deployed**:
- 🔄 n8n workflows (always-on automation)
- 🔄 AAE Dashboard frontend + backend
- 🔄 Commercial SaaS applications

**Capabilities**:
- Full control over hosting environment
- Node.js/PHP/Python support
- MySQL database included
- SSH access
- Custom domains
- Email hosting
- Better for white-label SaaS

**Cost**: ~$10-15/month

**Use For**:
- n8n automation workflows (commercial release)
- AAE Dashboard web application
- Customer-facing applications
- White-label SaaS products

### 3. Cloudflare Workers/Pages

**What Could Be Deployed**:
- Edge computing functions
- Static site hosting (React/Vue builds)
- D1 database (SQLite at edge)
- Cloudflare Vectorize (vector search)

**Capabilities**:
- Global edge distribution (sub-50ms response)
- Automatic HTTPS + DDoS protection
- Unlimited bandwidth on free tier
- Workers KV for key-value storage
- R2 for object storage (S3-compatible)

**Cost**: Free tier very generous, ~$5/month for production

**Use For**:
- Static frontend hosting
- Edge functions (low-latency requirements)
- Global content distribution
- API proxies/middleware

---

## ❌ INVALID / CONCEPTUAL Platforms

### Manus Platform ⚠️

**Status**: **CONCEPTUAL ONLY - NOT A REAL DEPLOYMENT TARGET**

**Purpose**:
- Carla's brainstorming sandbox
- Experimentation environment
- Ideation workspace

**DO NOT**:
- ❌ Reference as deployment destination in production docs
- ❌ Build deployment scripts for Manus Platform
- ❌ Design architecture assuming Manus Platform hosting
- ❌ Use "Manus OAuth" in authentication flows

**Last Architecture Change**: November 2025 (migrated away from Manus Platform)

**If you see "Manus Platform" in deployment docs → File is OUTDATED → Archive it**

---

## Commercial Deployment Architecture

### Recommended Setup for Commercial Release

```
┌─────────────────────────────────────────────────────────┐
│                    HOSTINGER                             │
│  ┌────────────────┐         ┌─────────────────┐        │
│  │  n8n Workflows │         │  AAE Dashboard  │        │
│  │  (Always-On)   │         │  (React + tRPC) │        │
│  │  Automation    │         │  Web App        │        │
│  └────────┬───────┘         └────────┬────────┘        │
│           │                          │                  │
│           └──────────────┬───────────┘                  │
└──────────────────────────┼──────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  PostgreSQL Database   │
              │      (Railway)         │
              │                        │
              │  - conversations       │
              │  - entities            │
              │  - relationships       │
              │  - users               │
              │  - agent_activity      │
              └────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────────┐     ┌───────────────────┐
│ Knowledge Lake API│     │ MTMOT MCP Server  │
│    (Railway)      │     │    (Railway)      │
│                   │     │                   │
│ - mem0 semantic   │     │ - 31 tools        │
│ - OpenAI learning │     │ - Agent gateway   │
│ - Vector search   │     │ - Always-on       │
└───────────────────┘     └───────────────────┘
```

### Database Strategy

**Production Database**: PostgreSQL on Railway

**Why PostgreSQL**:
- ✅ Already deployed and working (Knowledge Lake API uses it)
- ✅ JSONB support for flexible metadata
- ✅ Full-text search capabilities
- ✅ Auto-backups and point-in-time recovery
- ✅ Can connect from Hostinger, Railway, or Cloudflare
- ✅ Industry-standard for production SaaS

**NOT using**:
- ❌ D1 (Cloudflare-specific, doesn't work on Hostinger)
- ❌ Manus Platform MySQL (platform doesn't exist)
- ❌ In-memory storage (not persistent)

### Authentication Strategy

**Production Auth**: Google OAuth + GitHub OAuth

**Why**:
- ✅ Industry standard
- ✅ No vendor lock-in
- ✅ Works across all platforms (Railway, Hostinger, Cloudflare)
- ✅ Already implemented in mtmot-vibesdk-production

**NOT using**:
- ❌ "Manus OAuth" (platform-specific, doesn't exist)
- ❌ Custom auth system (security risk for commercial SaaS)

---

## Deployment Checklist

### Before Deploying to ANY Platform

- [ ] Remove all references to "Manus Platform"
- [ ] Verify database connections use PostgreSQL (Railway)
- [ ] Confirm authentication uses Google/GitHub OAuth
- [ ] Test environment variables for target platform
- [ ] Verify no D1-specific code if deploying to Hostinger
- [ ] Check CORS configuration for cross-origin requests
- [ ] Validate secrets/API keys are in platform environment variables

### Railway Deployment

- [ ] Connect GitHub repository
- [ ] Configure environment variables (DATABASE_URL, OPENAI_API_KEY, etc.)
- [ ] Set up PostgreSQL plugin
- [ ] Configure Dockerfile or nixpacks
- [ ] Verify deployment logs show proper initialization

### Hostinger Deployment

- [ ] Upload application via SSH or cPanel
- [ ] Configure Node.js version
- [ ] Set up environment variables
- [ ] Connect to Railway PostgreSQL (external database connection)
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Test n8n webhook endpoints

---

## Migration History

### November 2025: Manus Platform → Standard Deployment

**What Changed**:
- Removed Manus Platform dependencies
- Migrated to standard OAuth (Google/GitHub)
- Adopted PostgreSQL instead of platform-specific databases
- Prepared for Hostinger commercial deployment

**Files Archived**:
- `CLOUDFLARE_PAGES_SETUP.md` (referenced Manus Platform)
- `MANUS_BRIEFING_INTELLIGENT_CORPORATE_BRAIN.md` (platform-specific briefing)

### December 2025: D1 → PostgreSQL Migration

**What Changed**:
- AAE Dashboard will use shared PostgreSQL (Railway)
- Removed D1 local database dependencies
- Unified data persistence across all services

---

## Support & Documentation

**Railway**: https://docs.railway.app
**Hostinger**: https://www.hostinger.com/tutorials
**Cloudflare**: https://developers.cloudflare.com

**Internal Docs**:
- [TRUTH.md](./TRUTH.md) - Project overview and status
- [KNOWLEDGE_LAKE_INTEGRATION.md](./KNOWLEDGE_LAKE_INTEGRATION.md) - API integration guide
- [INTELLIGENT_CORPORATE_BRAIN_ARCHITECTURE.md](./INTELLIGENT_CORPORATE_BRAIN_ARCHITECTURE.md) - System architecture

---

**Remember**: If documentation references "Manus Platform" as a deployment target → It's OUTDATED → Archive it
