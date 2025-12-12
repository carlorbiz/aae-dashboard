# Cloudflare Pages Deployment Setup

## Overview

This guide adapts the AAE Dashboard (originally designed for Manus Platform with Express) to work with **Cloudflare Pages with Full-stack capabilities**.

## Architecture Changes

### Original (Manus Platform)
- **Frontend**: React built to `dist/public`
- **Backend**: Express server in `server/` running Node.js
- **Database**: MySQL/TiDB via Drizzle ORM
- **Auth**: Manus OAuth

### New (Cloudflare Pages)
- **Frontend**: React built to `dist/public` (unchanged)
- **Backend**: Cloudflare Pages Functions in `functions/` directory
- **Database**: Cloudflare D1 via Drizzle ORM
- **Auth**: Google/GitHub OAuth (already configured in mtmot-vibesdk-production)

## Implementation Plan

### Option 1: Use Cloudflare Pages Functions (Recommended)

**Pros**:
- Native Cloudflare integration
- Automatic asset serving (no ASSETS binding issues)
- Built-in routing based on file structure
- Can use D1 database

**Cons**:
- Need to port Express routes to Pages Functions
- Different API structure (`onRequest` instead of Express middleware)
- Limited Node.js compatibility

### Option 2: Copy OAuth from VibeSDK Worker

**Simpler approach**:
1. Keep AAE Dashboard structure
2. Copy working OAuth implementation from mtmot-vibesdk-production
3. Port tRPC routers to Cloudflare Workers format
4. Deploy as traditional Worker with better asset handling

## Step-by-Step: Option 2 (Recommended for Speed)

### 1. Copy OAuth Implementation

Copy from `mtmot-vibesdk-production/worker/routers/auth.ts`:
```typescript
// Google OAuth
export const googleOAuthRouter = router({
  authorize: publicProcedure
    .input(z.object({ redirectUrl: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation from vibesdk
    }),
  callback: publicProcedure
    .input(z.object({ code: z.string(), state: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation from vibesdk
    })
});
```

### 2. Replace Manus OAuth with Google/GitHub

In `server/_core/oauth.ts`, replace Manus SDK calls with:
- Google OAuth 2.0 flow
- GitHub OAuth 2.0 flow
- JWT session token generation (copy from vibesdk)

### 3. Update Database Schema

Change from MySQL to D1:
```typescript
// drizzle/schema.ts - update connection
import { drizzle } from 'drizzle-orm/d1';

export function getDb(env: Env) {
  return drizzle(env.DB);
}
```

### 4. Create wrangler.toml

```toml
name = "aae-dashboard"
main = "dist/index.js"
compatibility_date = "2025-11-11"

[[d1_databases]]
binding = "DB"
database_name = "aae-dashboard-db"
database_id = "your-database-id"

[site]
bucket = "./dist/public"
```

### 5. Update Build Process

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
    "build": "vite build && esbuild server/_core/index.ts --platform=neutral --packages=external --bundle --format=esm --outdir=dist",
    "deploy": "wrangler deploy"
  }
}
```

## Alternative: Merge into mtmot-vibesdk-production

**Even simpler**:
1. Copy AAE Dashboard pages to `mtmot-vibesdk-production/src/routes/`
2. Copy AAE Dashboard components to `mtmot-vibesdk-production/src/components/`
3. Add AAE Dashboard tRPC routers to `mtmot-vibesdk-production/worker/routers/`
4. Update routes to make dashboard the main entry point
5. Deploy using existing GitHub Actions workflow

This avoids all OAuth/database migration since VibeSDK already has everything configured.

## Recommendation

**Merge AAE Dashboard UI into mtmot-vibesdk-production Worker** because:

1. OAuth already working (Google + GitHub)
2. D1 database already configured
3. tRPC already set up
4. Deployment pipeline already exists
5. Custom domain already configured (vibe.mtmot.com)
6. Just copy frontend components - no backend porting needed

The ASSETS binding issue is likely a red herring - the real problem is that we're trying to deploy two different architectures simultaneously.

## Next Steps

1. Backup current mtmot-vibesdk-production
2. Copy AAE Dashboard pages/components into it
3. Update main route to load Dashboard instead of Home
4. Test locally
5. Deploy via existing GitHub Actions

This should work immediately since we're just swapping the UI, not touching the working backend.
