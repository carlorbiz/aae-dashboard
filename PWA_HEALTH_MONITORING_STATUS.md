# PWA Project Health Monitoring System - Implementation Status

**Date**: December 24, 2025
**Status**: Backend Complete ✅ | Frontend In Progress ⏳
**Branch**: `claude/connect-dashboard-data-flow-VGMLB`
**Last Commit**: `3275224`

---

## 🎯 **Objective**

Build a comprehensive health monitoring system for your PWAs (apps and courses) with **critical focus on**:
- ✅ Bidirectional Knowledge Lake connection health
- ✅ Nera (Aurelia) AI integration reliability
- ✅ Real-time uptime and performance monitoring
- ✅ Incident tracking and resolution
- ⏳ Automated periodic health checks
- ⏳ Dashboard UI for visual monitoring

---

## ✅ **COMPLETED - Backend Infrastructure**

### **1. Database Schema** (`drizzle/schema.ts`)

#### **Projects Table**
Tracks all your PWAs with comprehensive metadata:

```typescript
projects {
  // Core identity
  id, userId, name, type, status, description

  // URLs
  productionUrl, stagingUrl, repositoryUrl

  // Critical integrations (YOUR FOCUS)
  knowledgeLakeEnabled: boolean (default: true)
  neraAIEnabled: boolean (default: true)

  // Health monitoring config
  healthCheckUrl: string (/api/health endpoint)
  healthCheckInterval: number (default: 300 seconds = 5 min)
  lastHealthCheck: timestamp
  currentHealthStatus: 'healthy' | 'degraded' | 'down' | 'unknown'

  // Metadata
  techStack: json[]
  platform: string (Vercel, Railway, Cloudflare Pages, etc.)
  launchDate: timestamp
}
```

**Project Types**:
- `pwa_app` - Progressive Web App
- `pwa_course` - Course/educational PWA
- `api_service` - Backend API service
- `other`

**Project Statuses**:
- `planning`, `development`, `testing`, `production`, `maintenance`, `archived`

---

#### **Health Checks Table**
Stores results of every health test:

```typescript
health_checks {
  id, projectId, checkType, status
  responseTime: number (milliseconds)
  statusCode: number (HTTP status)
  errorMessage: text
  testDetails: json (test-specific data)
  checkedAt: timestamp
}
```

**Check Types** (9 different tests):
1. `uptime` - Basic HTTP availability
2. `knowledge_lake_read` - Can read from Knowledge Lake ⚡
3. `knowledge_lake_write` - Can write to Knowledge Lake ⚡
4. `nera_ai_availability` - Nera AI responding ⚡
5. `nera_ai_quality` - AI response quality check
6. `authentication` - Auth flow working
7. `api_latency` - Response time monitoring
8. `database_connection` - DB connectivity
9. `full_integration` - End-to-end test

**Health Statuses**:
- `healthy` - All systems operational ✅
- `degraded` - Partial functionality ⚠️
- `down` - Service unavailable ❌
- `unknown` - Not yet tested ❓

---

#### **Incidents Table**
Track problems when they occur:

```typescript
incidents {
  id, projectId, title, description
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'investigating' | 'identified' | 'resolved' | 'closed'

  // Impact tracking
  affectedFeatures: json[]
  impactedUsers: number

  // Timeline
  detectedAt, acknowledgedAt, resolvedAt

  // Resolution
  rootCause, resolution, preventionSteps
  relatedHealthCheckId
}
```

---

### **2. Database Functions** (`server/db.ts`)

Complete CRUD operations:

**Projects**:
- `createProject()` - Add new PWA to monitoring
- `getProjectsByUserId()` - List all projects
- `getProjectById()` - Get single project
- `updateProject()` - Update project details
- `deleteProject()` - Remove project

**Health Checks**:
- `insertHealthCheck()` - Record test result
- `getHealthChecksByProjectId()` - Get history
- `getLatestHealthChecksByProject()` - Current status
- `getHealthChecksSince()` - Time-range query

**Incidents**:
- `createIncident()` - Log new problem
- `getIncidentsByProjectId()` - Project history
- `getOpenIncidents()` - All unresolved issues
- `updateIncident()` - Update status
- `resolveIncident()` - Mark resolved with details

---

### **3. tRPC API Router** (`server/routers/projects.ts`)

Full-featured API namespace: `projects.*`

#### **Project Management**
```typescript
projects.list()           // Get all user's projects
projects.get({ id })      // Get single project
projects.create({ ... })  // Add new project
projects.update({ id, ... }) // Update project
projects.delete({ id })   // Remove project
```

#### **Health Monitoring** ⚡ **CRITICAL**
```typescript
projects.runHealthCheck({ projectId })
```

**What it does**:
1. Tests uptime (productionUrl)
2. Tests Knowledge Lake read connection
3. Tests Knowledge Lake write connection
4. Tests Nera AI availability
5. Updates project's overall health status
6. Auto-creates incident if failures detected

**Response**:
```json
{
  "success": true,
  "checks": [
    { "type": "uptime", "status": "completed" },
    { "type": "knowledge_lake_read", "status": "completed" },
    { "type": "knowledge_lake_write", "status": "failed", "error": "..." },
    { "type": "nera_ai_availability", "status": "completed" }
  ],
  "overallStatus": "degraded",
  "totalChecks": 4
}
```

#### **Health History**
```typescript
projects.getHealthChecks({ projectId, limit: 50 })
projects.getLatestHealth({ projectId })
projects.getHealthChecksSince({ projectId, since: Date })
```

#### **Incident Management**
```typescript
projects.getIncidents({ projectId })
projects.getOpenIncidents() // Across all projects
projects.createIncident({ projectId, title, severity, ... })
projects.updateIncident({ id, status, ... })
projects.resolveIncident({ id, resolution, rootCause, ... })
```

---

### **4. Integration Complete** (`server/routers.ts`)

Router registered in main app:

```typescript
export const appRouter = router({
  // ... existing routers
  projects: projectsRouter, // ✅ ADDED
});
```

**Available everywhere as**: `trpc.projects.*`

---

## 🔧 **Health Check Implementation Details**

### **Expected PWA Health Endpoint Structure**

Each of your PWAs needs to expose a health endpoint:

```typescript
// In each PWA: /api/health/knowledge-lake
GET /api/health/knowledge-lake

Response:
{
  "knowledgeLake": {
    "canRead": true,
    "canWrite": true,
    "lastSync": "2025-12-24T10:30:00Z",
    "url": "https://knowledge-lake-api-production.up.railway.app"
  },
  "status": "healthy"
}

// In each PWA: /api/health/nera-ai
GET /api/health/nera-ai

Response:
{
  "neraAI": {
    "available": true,
    "responseTime": 345,
    "lastQuery": "2025-12-24T10:29:55Z"
  },
  "status": "healthy"
}
```

### **How Health Checks Work**

```
Dashboard Project Monitor
  ↓
  Calls: projects.runHealthCheck({ projectId: 1 })
  ↓
  For each enabled integration:
    ↓
    HTTP GET https://your-pwa.com/api/health/knowledge-lake
    ↓
    Measure response time
    ↓
    Check status in response.knowledgeLake.canRead/canWrite
    ↓
    Insert health_check record
  ↓
  Calculate overall status
  ↓
  Update project.currentHealthStatus
  ↓
  If any check failed → Auto-create incident
  ↓
  Return results to dashboard
```

---

## ⏳ **TODO - Frontend Components** (Next Steps)

### **1. Projects Page** (High Priority)

**File**: `client/src/pages/Projects.tsx`

**What it needs**:
- List all projects with status cards
- Health status indicators (🟢 healthy, 🟡 degraded, 🔴 down)
- "Add Project" button + modal form
- Quick actions: Edit, Delete, Run Health Check
- Filter by type (apps vs courses)
- Filter by status (production only, etc.)

**UI Preview**:
```
┌────────────────────────────────────────────────┐
│ Projects                        [+ Add Project]│
├────────────────────────────────────────────────┤
│                                                │
│ ┌──────────────────────────┐ ┌───────────────┐│
│ │ AI Leadership Academy    │ │ RWAV Course   ││
│ │ PWA Course               │ │ PWA Course    ││
│ │ 🟢 Healthy               │ │ 🟡 Degraded   ││
│ │                          │ │               ││
│ │ ✅ Knowledge Lake        │ │ ⚠️  KL Write  ││
│ │ ✅ Nera AI               │ │ ✅ Nera AI    ││
│ │                          │ │               ││
│ │ Last checked: 2 min ago  │ │ 5 min ago     ││
│ │ [Check Now] [View]       │ │ [Check] [View]││
│ └──────────────────────────┘ └───────────────┘│
│                                                │
└────────────────────────────────────────────────┘
```

---

### **2. Project Detail Page** (High Priority)

**File**: `client/src/pages/ProjectDetail.tsx`

**Route**: `/projects/:id`

**Sections**:
1. **Header**: Project name, type, status, quick actions
2. **Health Status Dashboard**:
   - Live status indicators for each integration
   - Last 24 hours health chart (uptime %)
   - Current response times
3. **Recent Health Checks** (last 10):
   - Timestamp, check type, status, response time
4. **Open Incidents** (if any):
   - Severity, title, time since detected
   - Quick resolve button
5. **Settings**:
   - Edit URLs
   - Toggle Knowledge Lake / Nera AI monitoring
   - Set check interval (1-60 min)

---

### **3. Health Monitor Dashboard Component** (High Priority)

**File**: `client/src/components/HealthMonitor.tsx`

**Reusable component** showing real-time health:

**Props**:
```typescript
{
  projectId: number;
  showChart?: boolean; // 24h uptime chart
  compact?: boolean;   // Small widget vs full view
}
```

**Displays**:
- ✅ All integrations healthy
- ⚠️ Knowledge Lake write degraded
- ❌ Nera AI unavailable
- 📊 Uptime chart (last 24h)
- ⏱️ Response time trends

**Use cases**:
- Embedded in Projects list (compact mode)
- Full view in Project Detail page
- Dashboard widget (main dashboard overview)

---

### **4. Automated Health Check Scheduler** (Critical)

**Options**:

#### **Option A: n8n Workflow** (Recommended)

Create workflow: "PWA Health Checker"

```
[Schedule Trigger: Every 5 minutes]
  ↓
[HTTP Request: GET dashboard.com/api/projects]
  ↓
[Loop through each project]
  ↓
[HTTP Request: POST dashboard.com/api/trpc/projects.runHealthCheck]
  Body: { projectId: {{ $loop.item.id }} }
  ↓
[If overall status is 'down' or 'degraded']
  ↓
[Send Notification]
  - Slack alert
  - Email alert
  - Dashboard notification
```

**Benefits**:
- Visual workflow editor
- Easy to modify schedule
- Built-in retry logic
- Notification integrations ready

#### **Option B: Server-Side Cron Job**

**File**: `server/jobs/healthCheckScheduler.ts`

```typescript
import cron from 'node-cron';
import { getProjectsByUserId, runHealthCheck } from '../db';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[Health Check] Running scheduled checks...');

  const projects = await getProjectsByUserId(1); // Your user ID

  for (const project of projects) {
    if (project.status === 'production') {
      await runHealthCheck(project.id);
    }
  }
});
```

**Benefits**:
- Runs inside the application
- No external dependencies
- Can access DB directly

---

## 📊 **Integration Checklist for Your PWAs**

Each PWA needs to implement these endpoints:

### **Required Health Endpoints**

```typescript
// 1. General health check
GET /api/health
Response: {
  status: 'healthy' | 'degraded' | 'down',
  timestamp: '2025-12-24T10:30:00Z',
  uptime: 99.98
}

// 2. Knowledge Lake health
GET /api/health/knowledge-lake
Response: {
  knowledgeLake: {
    canRead: boolean,
    canWrite: boolean,
    lastSync: timestamp,
    url: string
  },
  status: 'healthy'
}

// 3. Nera AI health
GET /api/health/nera-ai
Response: {
  neraAI: {
    available: boolean,
    responseTime: number,
    lastQuery: timestamp
  },
  status: 'healthy'
}
```

### **Implementation Example** (Next.js/Express)

```typescript
// pages/api/health/knowledge-lake.ts (Next.js)
export default async function handler(req, res) {
  try {
    // Test read
    const readResponse = await fetch(`${process.env.KNOWLEDGE_LAKE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, query: '', limit: 1 })
    });

    const canRead = readResponse.ok;

    // Test write (lightweight)
    const writeResponse = await fetch(`${process.env.KNOWLEDGE_LAKE_URL}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        topic: 'Health Check',
        content: 'Automated health check test',
        conversationDate: new Date().toISOString().split('T')[0],
        entities: [],
        relationships: [],
        metadata: { source: 'health_check', test: true }
      })
    });

    const canWrite = writeResponse.ok;

    res.status(200).json({
      knowledgeLake: {
        canRead,
        canWrite,
        lastSync: new Date().toISOString(),
        url: process.env.KNOWLEDGE_LAKE_URL
      },
      status: canRead && canWrite ? 'healthy' : 'degraded'
    });
  } catch (error) {
    res.status(503).json({
      knowledgeLake: {
        canRead: false,
        canWrite: false,
        error: error.message
      },
      status: 'down'
    });
  }
}
```

---

## 🚀 **Deployment Steps** (When Frontend Complete)

### **1. Database Migration**

```bash
# Generate migration
npm run db:generate

# Apply migration to Railway PostgreSQL
npm run db:migrate
```

### **2. Deploy Backend**

```bash
git push origin claude/connect-dashboard-data-flow-VGMLB

# Railway auto-deploys
# Verify: https://your-dashboard.railway.app/api/trpc/projects.list
```

### **3. Setup Automated Checks**

**Option A (n8n)**:
- Import workflow JSON
- Set schedule (every 5 min)
- Configure notification channels

**Option B (Cron)**:
- Deploy health check scheduler
- Monitor logs for execution

### **4. Add Your Projects**

```bash
# Via dashboard UI or API
curl -X POST https://your-dashboard.railway.app/api/trpc/projects.create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Leadership Academy",
    "type": "pwa_course",
    "status": "production",
    "productionUrl": "https://ai-leadership-academy.com",
    "knowledgeLakeEnabled": true,
    "neraAIEnabled": true,
    "healthCheckUrl": "https://ai-leadership-academy.com/api/health",
    "healthCheckInterval": 300
  }'
```

### **5. Verify Health Checks**

```bash
# Run manual check
curl -X POST https://your-dashboard.railway.app/api/trpc/projects.runHealthCheck \
  -d '{ "projectId": 1 }'

# View results
curl https://your-dashboard.railway.app/api/trpc/projects.getLatestHealth?projectId=1
```

---

## 🎯 **Success Metrics**

After full deployment:

✅ **All PWAs monitored** (apps + courses)
✅ **Knowledge Lake health checks** running every 5 min
✅ **Nera AI availability** monitored continuously
✅ **Incidents auto-detected** when failures occur
✅ **Uptime > 99.9%** maintained
✅ **Alert notifications** working (Slack/email)
✅ **Dashboard provides** real-time visibility

---

## 📈 **What's Next**

### **Immediate (This Session)**
1. ✅ Backend complete
2. ⏳ Create Projects UI page
3. ⏳ Create Health Monitor component
4. ⏳ Add to dashboard navigation

### **Next Session**
1. Build automated scheduler (n8n or cron)
2. Implement PWA health endpoints
3. Test end-to-end health checks
4. Setup alert notifications

### **Future Enhancements**
1. Uptime percentage tracking (30/60/90 days)
2. Historical incident reports
3. Performance trend analysis
4. Predictive failure detection (ML)
5. Integration with StatusPage.io

---

## 💡 **Critical Implementation Notes**

### **Why This Matters**

Your PWAs are **mission-critical** because:
- ✅ They embed Nera AI (your unique knowledge assistant)
- ✅ They connect bidirectionally to Knowledge Lake (your institutional memory)
- ✅ Any downtime = lost student/client access
- ✅ Any Knowledge Lake failure = Nera loses context
- ✅ Early detection = prevent revenue impact

### **What the System Catches**

**Before this system**:
- ❌ PWA down for hours before you notice
- ❌ Knowledge Lake connection broken silently
- ❌ Nera AI not responding, users confused
- ❌ No historical data on reliability

**With this system**:
- ✅ 5-minute detection window
- ✅ Automatic incident creation
- ✅ Immediate alerts via Slack/email
- ✅ Full health history for postmortems
- ✅ Uptime metrics for stakeholder reporting

---

## 🔗 **Related Documentation**

- **Knowledge Lake API**: `docs/KNOWLEDGE_LAKE_API_STATUS.md`
- **Database Schema**: `drizzle/schema.ts`
- **API Router**: `server/routers/projects.ts`
- **Health Check Logic**: See `runHealthCheck()` in projects router

---

**Status**: Backend 100% Complete ✅ | Frontend 0% Complete ⏳

**Next**: Build Projects UI page and Health Monitor component

**ETA**: 2-3 hours for complete frontend + scheduler setup

---

*Implementation Summary Created: December 24, 2025*
*Developer: Claude Code*
*Branch: claude/connect-dashboard-data-flow-VGMLB*
*Commit: 3275224*
