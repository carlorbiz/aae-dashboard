# 🔌 VibeSDK API Endpoints for AAE Dashboard Integration

**Base URL:** `https://vibe.mtmot.com`  
**Rolled Back To:** Commit `c5792e4` - Clean state with BYOK, before AAE Dashboard integration  
**Date:** November 12, 2025

---

## 🎯 Architecture Overview

The **AAE Dashboard** should be the **command center** that orchestrates all services:

```
┌─────────────────────────────────────┐
│      AAE Dashboard (Hub)            │
│   - Orchestrates workflows          │
│   - Manages API keys                │
│   - Monitors metrics                │
└──────────┬──────────────────────────┘
           │
           ├─────► VibeSDK (Code Generation)
           │       https://vibe.mtmot.com/api/*
           │
           ├─────► N8N (Workflow Automation)
           │       Your N8N instance
           │
           └─────► Other Services
                   (Mem0, Knowledge Lake, etc.)
```

---

## 🔐 Authentication

All authenticated endpoints require a session cookie or bearer token.

### Get CSRF Token
```http
GET /api/auth/csrf-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "csrfToken": "abc123..."
  }
}
```

### Login (Email/Password)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login (OAuth - GitHub)
```http
GET /api/auth/oauth/github
```
Redirects to GitHub OAuth flow, then back to `/api/auth/callback/github`

### Check Auth Status
```http
GET /api/auth/check
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

## 🤖 Code Generation (Agent) Endpoints

### Start Code Generation
```http
POST /api/agent
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Create a todo app with React and TypeScript",
  "template": "react-typescript",
  "modelConfig": {
    "provider": "openai",
    "model": "gpt-4"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "agent_abc123",
    "status": "running",
    "websocketUrl": "wss://vibe.mtmot.com/api/agent/agent_abc123/ws"
  }
}
```

### Connect to Agent WebSocket
```http
GET /api/agent/:agentId/ws
Upgrade: websocket
```

**WebSocket Messages:**
```json
{
  "type": "progress",
  "data": {
    "step": "Generating code...",
    "progress": 45
  }
}

{
  "type": "file_created",
  "data": {
    "path": "src/App.tsx",
    "content": "..."
  }
}

{
  "type": "complete",
  "data": {
    "appId": "app_123",
    "previewUrl": "https://app-123.vibe.mtmot.com"
  }
}
```

### Get Agent Status
```http
GET /api/agent/:agentId/connect
Authorization: Bearer <token>
```

### Deploy Preview
```http
GET /api/agent/:agentId/preview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "previewUrl": "https://app-abc123.vibe.mtmot.com",
    "status": "deployed"
  }
}
```

---

## 🔑 BYOK (Bring Your Own Key) Endpoints

### Get User's Model Providers
```http
GET /api/user/providers
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "provider_123",
        "provider": "openai",
        "name": "My OpenAI Key",
        "models": ["gpt-4", "gpt-3.5-turbo"],
        "isActive": true,
        "createdAt": "2025-11-07T12:00:00Z"
      },
      {
        "id": "provider_456",
        "provider": "anthropic",
        "name": "My Claude Key",
        "models": ["claude-3-opus", "claude-3-sonnet"],
        "isActive": true,
        "createdAt": "2025-11-07T13:00:00Z"
      }
    ]
  }
}
```

### Get Single Provider
```http
GET /api/user/providers/:id
Authorization: Bearer <token>
```

### Create Provider (Add API Key)
```http
POST /api/user/providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "openai",
  "name": "My OpenAI Key",
  "apiKey": "sk-...",
  "models": ["gpt-4", "gpt-3.5-turbo"]
}
```

**Supported Providers:**
- `openai` - OpenAI (GPT-4, GPT-3.5)
- `anthropic` - Anthropic (Claude)
- `google` - Google AI (Gemini)
- `groq` - Groq (Llama, Mixtral)
- `xai` - XAI (Grok)
- `perplexity` - Perplexity (Sonar)
- `cerebras` - Cerebras (Llama)

### Update Provider
```http
PUT /api/user/providers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "apiKey": "new-key-...",
  "isActive": false
}
```

### Delete Provider
```http
DELETE /api/user/providers/:id
Authorization: Bearer <token>
```

### Test Provider Connection
```http
POST /api/user/providers/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-...",
  "model": "gpt-4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "models": ["gpt-4", "gpt-3.5-turbo"],
    "message": "Connection successful"
  }
}
```

---

## 📊 Stats & Analytics Endpoints

### Get User Stats
```http
GET /api/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalApps": 42,
    "totalGenerations": 156,
    "tokensUsed": 1234567,
    "lastActivity": "2025-11-12T10:30:00Z"
  }
}
```

### Get User Activity
```http
GET /api/stats/activity
Authorization: Bearer <token>
Query Parameters:
  - startDate: ISO date string
  - endDate: ISO date string
  - limit: number (default 100)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "type": "code_generation",
        "appId": "app_456",
        "prompt": "Create a todo app",
        "model": "gpt-4",
        "tokensUsed": 1234,
        "timestamp": "2025-11-12T10:30:00Z"
      }
    ]
  }
}
```

---

## 📱 User Apps Management

### Get User's Apps
```http
GET /api/user/apps
Authorization: Bearer <token>
Query Parameters:
  - limit: number (default 50)
  - offset: number (default 0)
  - sortBy: "createdAt" | "updatedAt" | "name"
  - order: "asc" | "desc"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apps": [
      {
        "id": "app_123",
        "name": "My Todo App",
        "description": "A simple todo application",
        "previewUrl": "https://app-123.vibe.mtmot.com",
        "status": "deployed",
        "createdAt": "2025-11-12T10:00:00Z",
        "updatedAt": "2025-11-12T10:30:00Z"
      }
    ],
    "total": 42,
    "hasMore": true
  }
}
```

### Update User Profile
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": {
    "defaultModel": "gpt-4",
    "theme": "dark"
  }
}
```

---

## 🐙 GitHub Export Endpoints

### Initiate GitHub Export
```http
POST /api/github-app/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "appId": "app_123",
  "repoName": "my-todo-app",
  "isPrivate": true,
  "description": "My awesome todo app"
}
```

### Check Remote Status
```http
POST /api/github-app/check-remote
Authorization: Bearer <token>
Content-Type: application/json

{
  "appId": "app_123"
}
```

---

## 🏥 Health Check

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T10:30:00Z"
}
```

---

## 🔧 Integration Examples

### Example 1: Generate Code from AAE Dashboard

```javascript
// 1. Authenticate
const authResponse = await fetch('https://vibe.mtmot.com/api/auth/check', {
  credentials: 'include'
});

// 2. Start code generation
const generateResponse = await fetch('https://vibe.mtmot.com/api/agent', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a React dashboard',
    modelConfig: { provider: 'openai', model: 'gpt-4' }
  })
});

const { agentId, websocketUrl } = await generateResponse.json();

// 3. Connect to WebSocket for real-time updates
const ws = new WebSocket(websocketUrl);
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log(`Progress: ${type}`, data);
};
```

### Example 2: Add BYOK API Key

```javascript
// Add user's OpenAI key
const response = await fetch('https://vibe.mtmot.com/api/user/providers', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'openai',
    name: 'My OpenAI Key',
    apiKey: 'sk-...',
    models: ['gpt-4', 'gpt-3.5-turbo']
  })
});
```

### Example 3: Get User Stats for Dashboard

```javascript
// Fetch stats for AAE Dashboard display
const statsResponse = await fetch('https://vibe.mtmot.com/api/stats', {
  credentials: 'include'
});

const { totalApps, tokensUsed } = await statsResponse.json();

// Display in AAE Dashboard
console.log(`Total Apps: ${totalApps}, Tokens Used: ${tokensUsed}`);
```

---

## 📝 Notes

1. **Authentication:** All authenticated endpoints use cookie-based sessions. Make sure to include `credentials: 'include'` in fetch requests.

2. **CORS:** The vibesdk should be configured to allow requests from the AAE Dashboard domain.

3. **Rate Limiting:** API endpoints may have rate limits. Check response headers for `X-RateLimit-*` information.

4. **WebSockets:** For real-time code generation updates, use the WebSocket URL provided in the agent creation response.

5. **Error Handling:** All endpoints return errors in this format:
   ```json
   {
     "success": false,
     "error": {
       "code": "ERROR_CODE",
       "message": "Human-readable error message"
     }
   }
   ```

---

## 🚀 Next Steps

1. **Deploy AAE Dashboard** as a separate application
2. **Configure CORS** in vibesdk to allow AAE Dashboard domain
3. **Implement API calls** from AAE Dashboard to vibesdk endpoints
4. **Add authentication** flow between AAE Dashboard and vibesdk
5. **Monitor and optimize** API performance

---

**The vibesdk is now a clean, focused code generation service ready to be integrated into your AAE Dashboard ecosystem!** 🎉
