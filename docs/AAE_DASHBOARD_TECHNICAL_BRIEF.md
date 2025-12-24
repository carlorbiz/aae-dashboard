# AAE Dashboard - Technical Brief for Parallel Development

**Date:** December 24, 2025
**Priority:** MEDIUM (parallel work while Day 3-4 sprint continues)
**Status:** Needs attention
**Assignee:** Claude Code (different UI session)

---

## 🎯 Objective

Fix and update the AAE Dashboard to integrate with the newly enhanced Knowledge Lake API, which now includes classification features and multi-pass extraction workflow support.

---

## 📍 Current System Status

### Knowledge Lake API
- **URL:** `https://knowledge-lake-api-production.up.railway.app`
- **Version:** 2.1.0 (with classification extensions)
- **Total Conversations:** 169
- **Complex Conversations:** 7 (flagged for multi-pass extraction)
- **New Features:** Classification metadata, multi-pass flags, enhanced query capabilities

### AAE Dashboard Repo
- **Path:** `github-projects/aae-dashboard`
- **Tech Stack:** Next.js, TypeScript, React
- **Current Status:** Submodule with new commits + modified content (needs sync)
- **Integration:** Uses Knowledge Lake API for conversation data

---

## 🚨 Known Issues

### 1. Git Submodule Out of Sync
**Status:** `modified: github-projects/aae-dashboard (new commits, modified content)`

**Impact:** Dashboard code may be out of date with latest changes

**Action Required:**
```bash
cd github-projects/aae-dashboard
git status
git pull origin main
```

### 2. API Endpoint Compatibility
**Issue:** Dashboard may still be using old API endpoints or missing new classification fields

**Old API Structure:**
```json
{
  "id": 1,
  "topic": "...",
  "content": "...",
  "date": "..."
}
```

**New API Structure (2.1.0):**
```json
{
  "id": 1,
  "topic": "...",
  "content": "...",
  "date": "...",
  "complexity_classification": "complex",
  "complexity_score": 85.0,
  "word_count": 10672,
  "requires_multipass": true,
  "multipass_extracted": false
}
```

**Action Required:** Update TypeScript interfaces and API client

### 3. Missing Features
**Features to Add:**
1. Display complexity classification badges (🟢 COMPLEX / 🔵 SIMPLE)
2. Show word count and topic shift metrics
3. Filter conversations by classification
4. Highlight conversations flagged for multi-pass extraction
5. Status indicator for extracted vs pending multi-pass

---

## 📂 Repository Structure

```
github-projects/aae-dashboard/
├── src/
│   ├── pages/
│   │   ├── index.tsx              ← Main dashboard page
│   │   └── api/
│   │       └── conversations.ts   ← API route (if using Next.js API routes)
│   ├── components/
│   │   ├── ConversationList.tsx   ← List view of conversations
│   │   ├── ConversationCard.tsx   ← Individual conversation card
│   │   └── ComplexityBadge.tsx    ← NEW: Classification badge component
│   ├── lib/
│   │   └── knowledgeLakeClient.ts ← API client (needs update)
│   └── types/
│       └── conversation.ts        ← TypeScript types (needs update)
├── package.json
├── next.config.js
└── README.md
```

---

## 🔧 Required Changes

### Priority 1: Update TypeScript Types

**File:** `src/types/conversation.ts` (or wherever types are defined)

```typescript
export interface Conversation {
  id: number;
  user_id: number;
  topic: string;
  content: string;
  date: string;
  created_at: string;

  // NEW: Classification fields
  complexity_classification?: 'simple' | 'complex' | 'manual_review';
  complexity_score?: number;
  word_count?: number;
  topic_shift_count?: number;
  breakthrough_moment_count?: number;
  requires_multipass?: boolean;
  multipass_extracted?: boolean;
}
```

### Priority 2: Update API Client

**File:** `src/lib/knowledgeLakeClient.ts` (or similar)

**Current endpoint (likely):**
```typescript
const API_URL = 'https://knowledge-lake-api-production.up.railway.app';
```

**Verify endpoints:**
```typescript
// Correct endpoints:
GET  /health
GET  /api/stats
POST /api/query
POST /api/conversations
POST /api/conversations/search
```

**Update query function:**
```typescript
export async function queryConversations(
  query: string,
  limit: number = 10
): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 1,
      query,
      limit,
    }),
  });

  const data = await response.json();
  return data.results || [];
}
```

### Priority 3: Add Classification UI Components

**File:** `src/components/ComplexityBadge.tsx` (NEW)

```typescript
import React from 'react';

interface ComplexityBadgeProps {
  classification?: 'simple' | 'complex' | 'manual_review';
  requiresMultipass?: boolean;
  multipassExtracted?: boolean;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({
  classification,
  requiresMultipass,
  multipassExtracted,
}) => {
  if (!classification) return null;

  const badgeStyles = {
    simple: 'bg-blue-100 text-blue-800',
    complex: 'bg-green-100 text-green-800',
    manual_review: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded text-sm ${badgeStyles[classification]}`}>
        {classification === 'complex' ? '🟢 COMPLEX' : '🔵 SIMPLE'}
      </span>
      {requiresMultipass && (
        <span className="px-2 py-1 rounded text-sm bg-purple-100 text-purple-800">
          {multipassExtracted ? '✅ Extracted' : '⏳ Pending Multi-Pass'}
        </span>
      )}
    </div>
  );
};
```

### Priority 4: Update Conversation Display

**File:** `src/components/ConversationCard.tsx` (or similar)

**Add to card component:**
```typescript
import { ComplexityBadge } from './ComplexityBadge';

// Inside component JSX:
<ComplexityBadge
  classification={conversation.complexity_classification}
  requiresMultipass={conversation.requires_multipass}
  multipassExtracted={conversation.multipass_extracted}
/>

<div className="text-sm text-gray-600 mt-2">
  {conversation.word_count && (
    <span>{conversation.word_count.toLocaleString()} words</span>
  )}
  {conversation.complexity_score && (
    <span className="ml-3">
      Complexity: {conversation.complexity_score.toFixed(1)}/100
    </span>
  )}
</div>
```

### Priority 5: Add Filter Controls

**File:** `src/pages/index.tsx` (or main dashboard component)

**Add filter state:**
```typescript
const [filterClassification, setFilterClassification] = useState<string>('all');
const [filterMultipass, setFilterMultipass] = useState<boolean | null>(null);

// Filter conversations
const filteredConversations = conversations.filter(conv => {
  if (filterClassification !== 'all' && conv.complexity_classification !== filterClassification) {
    return false;
  }
  if (filterMultipass !== null && conv.requires_multipass !== filterMultipass) {
    return false;
  }
  return true;
});
```

**Add filter UI:**
```typescript
<div className="mb-4 flex gap-4">
  <select
    value={filterClassification}
    onChange={(e) => setFilterClassification(e.target.value)}
    className="border rounded px-3 py-2"
  >
    <option value="all">All Classifications</option>
    <option value="simple">Simple</option>
    <option value="complex">Complex</option>
  </select>

  <select
    value={filterMultipass === null ? 'all' : filterMultipass.toString()}
    onChange={(e) => {
      const val = e.target.value;
      setFilterMultipass(val === 'all' ? null : val === 'true');
    }}
    className="border rounded px-3 py-2"
  >
    <option value="all">All Conversations</option>
    <option value="true">Needs Multi-Pass</option>
    <option value="false">No Multi-Pass Needed</option>
  </select>
</div>
```

---

## 🧪 Testing Checklist

### API Integration Tests

```bash
# Test API endpoint
curl -s https://knowledge-lake-api-production.up.railway.app/health

# Test query endpoint
curl -X POST https://knowledge-lake-api-production.up.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "query": "test", "limit": 5}' | python -m json.tool
```

### Dashboard Tests

- [ ] Dashboard loads without errors
- [ ] Conversations display with classification badges
- [ ] Word count and complexity score visible
- [ ] Filter by classification works
- [ ] Filter by multi-pass status works
- [ ] Complex conversations show correct status (extracted/pending)
- [ ] API responses match TypeScript types

---

## 📊 Expected Results

### Before Fix
- Dashboard may show errors or missing data
- No classification information visible
- Cannot filter by complexity
- No multi-pass status indicators

### After Fix
- All 169 conversations display correctly
- Classification badges visible (7 complex, 162 simple)
- Filterable by classification type
- Multi-pass status clearly indicated
- Word count and complexity metrics displayed

---

## 🔗 Related Resources

### API Documentation
- **Full API Status:** [docs/KNOWLEDGE_LAKE_API_STATUS.md](./KNOWLEDGE_LAKE_API_STATUS.md)
- **Classification Algorithm:** [scripts/classify_conversation.py](../scripts/classify_conversation.py)

### Database Schema
```sql
-- Conversations table now includes:
complexity_classification VARCHAR(20),
complexity_score DECIMAL(5,2),
word_count INTEGER,
topic_shift_count INTEGER,
breakthrough_moment_count INTEGER,
requires_multipass BOOLEAN DEFAULT FALSE,
multipass_extracted BOOLEAN DEFAULT FALSE
```

### Sample API Response
```json
{
  "results": [
    {
      "id": 165,
      "user_id": 1,
      "topic": "2025-12-06 Hybrid Architecture",
      "date": "2025-12-06",
      "content": "...",
      "complexity_classification": "complex",
      "complexity_score": 95.0,
      "word_count": 184304,
      "topic_shift_count": 74,
      "breakthrough_moment_count": 59,
      "requires_multipass": true,
      "multipass_extracted": true
    }
  ]
}
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: CORS Errors
**Symptom:** Browser console shows CORS policy errors

**Solution:** API already configured for CORS, but verify:
```typescript
// Check if API_URL is correct
const API_URL = 'https://knowledge-lake-api-production.up.railway.app';
```

### Issue 2: Missing Fields in Old Conversations
**Symptom:** Some conversations don't have classification fields

**Solution:** Handle null/undefined gracefully:
```typescript
{conversation.complexity_classification && (
  <ComplexityBadge classification={conversation.complexity_classification} />
)}
```

### Issue 3: TypeScript Type Errors
**Symptom:** Build fails with type mismatches

**Solution:** Make new fields optional in interface:
```typescript
complexity_classification?: 'simple' | 'complex' | 'manual_review';
```

---

## 📝 Implementation Steps

### Step 1: Sync Submodule
```bash
cd github-projects/aae-dashboard
git pull origin main
npm install  # Update dependencies if needed
```

### Step 2: Update Types
1. Update `Conversation` interface with new classification fields
2. Mark all classification fields as optional

### Step 3: Update API Client
1. Verify API endpoint URLs
2. Update query functions to handle new response structure
3. Add error handling for missing fields

### Step 4: Add UI Components
1. Create `ComplexityBadge` component
2. Update conversation cards to display classification
3. Add filter controls to main dashboard

### Step 5: Test
1. Run dashboard locally: `npm run dev`
2. Verify all conversations load
3. Test classification filters
4. Check multi-pass status indicators

### Step 6: Deploy
1. Commit changes to aae-dashboard repo
2. Push to GitHub
3. Deploy to production (Vercel/Netlify?)

---

## 🎯 Success Criteria

- [ ] Dashboard displays all 169 conversations
- [ ] Classification badges visible on all applicable conversations
- [ ] Filters work correctly (classification type, multi-pass status)
- [ ] Word count and complexity metrics displayed
- [ ] 7 complex conversations correctly identified
- [ ] Multi-pass status accurate (7 extracted, 0 pending)
- [ ] No console errors
- [ ] TypeScript builds without errors

---

## 💬 Quick Reference

### API Health Check
```bash
curl -s https://knowledge-lake-api-production.up.railway.app/health | python -m json.tool
```

### Get All Conversations
```bash
curl -X POST https://knowledge-lake-api-production.up.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "query": "", "limit": 200}' | python -m json.tool
```

### Filter Complex Conversations
```bash
# Query Knowledge Lake directly
curl -X POST https://knowledge-lake-api-production.up.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "query": "complex", "limit": 10}' | python -m json.tool
```

---

## 🚀 Estimated Time

**Total Effort:** 2-3 hours

| Task | Time |
|------|------|
| Sync submodule & setup | 15 min |
| Update TypeScript types | 15 min |
| Update API client | 30 min |
| Create UI components | 45 min |
| Add filters | 30 min |
| Testing | 30 min |
| Documentation | 15 min |

---

## 📧 Contact & Coordination

**Working in Parallel With:**
- Claude Code (this session): Completing Day 3-4 sprint tasks
- Focus: Notion integration, automation scripts, final documentation

**Coordination Point:**
- Both sessions will commit to the same repo
- AAE Dashboard work is in `github-projects/aae-dashboard` subdirectory
- No conflicts expected - different file scopes

---

*Brief Created: 2025-12-24 01:15 UTC*
*Priority: MEDIUM*
*Est. Completion: 2-3 hours*
*Status: Ready for assignment to parallel Claude session*
