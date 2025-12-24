# n8n AI Agent Router - Quick Start Guide

**Estimated Setup Time**: 15 minutes
**Prerequisites**: n8n Community Edition deployed on Railway

---

## 🚀 Quick Setup (5 Steps)

### **Step 1: Import Workflow** (2 min)

1. Open your n8n instance: `https://your-n8n.railway.app`
2. Click **Workflows** → **Add workflow** → **Import from file**
3. Upload: `n8n-workflows/AAE_Agent_Router.json`
4. Workflow imports with all 14 nodes configured

---

### **Step 2: Set Environment Variables** (3 min)

In Railway (n8n service), add these variables:

```bash
# Copy/paste this into Railway CLI or UI
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
MANUS_FORGE_API_KEY=your-manus-key-here
KNOWLEDGE_LAKE_URL=https://knowledge-lake-api-production.up.railway.app
AAE_DASHBOARD_URL=https://your-dashboard.railway.app
AAE_WEBHOOK_API_KEY=$(openssl rand -hex 32)
```

**Via Railway CLI**:
```bash
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set OPENAI_API_KEY=sk-...
railway variables set PERPLEXITY_API_KEY=pplx-...
railway variables set MANUS_FORGE_API_KEY=...
railway variables set KNOWLEDGE_LAKE_URL=https://knowledge-lake-api-production.up.railway.app
railway variables set AAE_DASHBOARD_URL=https://your-dashboard.railway.app
railway variables set AAE_WEBHOOK_API_KEY=$(openssl rand -hex 32)
```

---

### **Step 3: Configure API Credentials in n8n** (5 min)

The workflow needs 5 credential sets:

#### **A. AAE Webhook Auth**
- Type: **Header Auth**
- Name: `AAE Webhook Auth`
- Header Name: `X-AAE-API-Key`
- Value: `{{ $env.AAE_WEBHOOK_API_KEY }}`

#### **B. Manus Forge API**
- Type: **Header Auth**
- Name: `Manus Forge API`
- Header Name: `Authorization`
- Value: `Bearer {{ $env.MANUS_FORGE_API_KEY }}`

#### **C. Anthropic API**
- Type: **Anthropic API** (built-in)
- Name: `Anthropic API`
- API Key: `{{ $env.ANTHROPIC_API_KEY }}`

#### **D. OpenAI API**
- Type: **OpenAI API** (built-in)
- Name: `OpenAI API`
- API Key: `{{ $env.OPENAI_API_KEY }}`

#### **E. Perplexity API**
- Type: **Header Auth**
- Name: `Perplexity API`
- Header Name: `Authorization`
- Value: `Bearer {{ $env.PERPLEXITY_API_KEY }}`

---

### **Step 4: Activate Workflow** (1 min)

1. Open the **AAE Agent Router** workflow
2. Click the **Activate** toggle (top-right)
3. Webhook URL appears: `https://your-n8n.railway.app/webhook/aae-chat`
4. **Copy this URL** - you'll need it for Step 5

---

### **Step 5: Update AAE Dashboard** (4 min)

#### **A. Add Environment Variables**

In Railway (AAE Dashboard service):
```bash
railway variables set N8N_WEBHOOK_URL=https://your-n8n.railway.app/webhook/aae-chat
railway variables set AAE_WEBHOOK_API_KEY=<same-key-from-step-2>
```

#### **B. Update Chat Router Code**

The design document includes the full code update needed for `server/routers/chat.ts`.

**Key change**: Replace the direct LLM call with n8n webhook call.

---

## ✅ Test the Integration

### **Test 1: Direct Webhook Test**

```bash
curl -X POST https://your-n8n.railway.app/webhook/aae-chat \
  -H "Content-Type: application/json" \
  -H "X-AAE-API-Key: your_webhook_api_key" \
  -d '{
    "userId": 1,
    "message": "How should I structure my n8n workflows?",
    "conversationHistory": [],
    "context": {"currentPage": "Dashboard"}
  }'
```

**Expected Response** (3-5 seconds):
```json
{
  "success": true,
  "agent": "Claude",
  "agentReason": "Strategic planning and architecture",
  "message": "For n8n workflows, I recommend...",
  "entitiesCount": 2,
  "ingested": true
}
```

### **Test 2: Different Query Types**

Test agent routing logic:

```bash
# Should route to Fred (technical)
curl ... -d '{"userId": 1, "message": "Fix this TypeScript error in my API", ...}'

# Should route to Colin (business)
curl ... -d '{"userId": 1, "message": "What is the ROI of this automation?", ...}'

# Should route to Penny (research)
curl ... -d '{"userId": 1, "message": "What are the latest trends in AI agents?", ...}'

# Should route to Multi-Agent (complex)
curl ... -d '{"userId": 1, "message": "Provide comprehensive analysis of migrating to microservices", ...}'
```

### **Test 3: Dashboard Integration**

1. Open AAE Dashboard: `https://your-dashboard.railway.app`
2. Navigate to **AI Chat** page
3. Send message: "How should I optimize my n8n workflows?"
4. Verify:
   - ✅ Agent name appears (e.g., "Claude")
   - ✅ Response is relevant and contextual
   - ✅ Entities extracted and displayed
   - ✅ Conversation ingested to Knowledge Lake

---

## 🔍 Troubleshooting

### **Issue: Webhook returns 401 Unauthorized**

**Cause**: API key mismatch

**Fix**:
```bash
# Verify both services have the SAME key
railway run --service n8n env | grep AAE_WEBHOOK_API_KEY
railway run --service aae-dashboard env | grep AAE_WEBHOOK_API_KEY
```

### **Issue: Agent always returns "Fred"**

**Cause**: Routing logic not matching patterns

**Fix**: Check the "Determine Agent & Complexity" node logs
- Verify `scores` object shows expected pattern matches
- Update regex patterns in the Code node if needed

### **Issue: Knowledge Lake ingestion fails**

**Cause**: Knowledge Lake API unavailable or wrong URL

**Fix**:
```bash
# Test Knowledge Lake health
curl https://knowledge-lake-api-production.up.railway.app/health

# Verify environment variable
railway run --service n8n env | grep KNOWLEDGE_LAKE_URL
```

**Note**: Ingestion failure won't block the response (continueOnFail: true)

### **Issue: Response timeout**

**Cause**: Agent response taking >30 seconds

**Fix**: Increase webhook timeout or implement async callback pattern

---

## 📊 Verify Success

After setup, you should see:

✅ **n8n workflow** active and receiving webhooks
✅ **All 4 agents** responding correctly based on query type
✅ **Entity extraction** working (entities appear in responses)
✅ **Knowledge Lake ingestion** succeeding (check API stats)
✅ **Dashboard UI** showing agent attribution

---

## 🎯 Next Steps

Once basic integration is working:

1. **Fine-tune routing logic** - Adjust patterns based on actual usage
2. **Implement multi-agent orchestration** - Phase 2 feature
3. **Add agent avatars** - Visual distinction in dashboard
4. **Enable conversation threading** - Multi-turn conversations
5. **Track agent performance** - Analytics on response quality

---

## 📞 Quick Reference

| Component | URL | Purpose |
|-----------|-----|---------|
| n8n Webhook | `https://your-n8n.railway.app/webhook/aae-chat` | Receives chat messages |
| Knowledge Lake | `https://knowledge-lake-api-production.up.railway.app` | Stores conversations |
| AAE Dashboard | `https://your-dashboard.railway.app` | User interface |

**Environment Variables Needed**: 7 total (see Step 2)
**n8n Credentials Needed**: 5 total (see Step 3)
**Code Changes Needed**: 1 file (`server/routers/chat.ts`)

---

**Total Setup Time**: ~15 minutes
**Your AAE Council is ready to serve!** 🚀
