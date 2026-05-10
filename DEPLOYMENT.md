# Deployment Guide

This project is split into two independent deployments:

## Architecture

```
nextflow/                    (Main app - deploy to Vercel)
├── src/                     → Next.js frontend + API routes
├── prisma/                  → Database schema
├── package.json             → Root dependencies (NO trigger CLI)
├── next.config.ts
└── tsconfig.json

trigger/                     (Worker - deploy to Render)
├── src/
│   ├── tasks.ts            → Trigger task definitions
│   └── transloadit-server.ts → Media processing helper
├── package.json             → Trigger dependencies (includes SDK + CLI)
├── tsconfig.json
├── trigger.config.ts        → Trigger configuration
└── .env                     → Worker environment vars
```

## Separation Principles

✅ **Root Next.js app:**
- ✓ Uses `@trigger.dev/sdk` (client only - to call tasks)
- ✓ NO `trigger.dev` CLI package
- ✓ NO cross-imports from `trigger/` folder
- ✓ Communicates via `tasks.trigger(taskId, payload)` API

✅ **Trigger worker (`trigger/` folder):**
- ✓ Uses both `@trigger.dev/sdk` AND `trigger.dev` CLI
- ✓ Completely independent, no imports from root `src/`
- ✓ Receives requests from Next.js app

## Deployment Steps

### 1. Deploy Root App to Vercel

```bash
# From root folder
npm install
npm run db:generate
npm run build
# Commit and push to GitHub
# Vercel auto-deploys on push
```

**Environment Variables in Vercel:**
```
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_TRIGGER_URL=https://your-trigger-project-ref.trigger.dev  (for SDK client)
```

✅ **No trigger CLI needed** - app will be lightweight on Vercel.

---

### 2. Deploy Trigger Worker to Render

```bash
# From trigger/ folder
cd trigger
npm install
# Connect to Render and deploy
```

**Render Service Settings:**
- **Runtime:** Node.js
- **Build Command:** `npm install`
- **Start Command:** `npm run dev` or `trigger start`
- **Environment Variables:** (from `trigger/.env.example`)

```
TRIGGER_PROJECT_REF=proj_...
TRANSLOADIT_AUTH_KEY=...
TRANSLOADIT_AUTH_SECRET=...
TRANSLOADIT_TEMPLATE_ID_IMAGE=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3-flash-preview
FFMPEG_PATH=(leave blank for auto-detect)
```

---

## Communication Flow

1. **Frontend (Vercel):** User triggers workflow
2. **Next.js API Route:** Calls `tasks.trigger(taskId, payload)` via Trigger SDK
3. **Trigger.dev Cloud:** Routes request to your Render worker
4. **Render Worker:** Executes heavy ffmpeg/Gemini/Transloadit work
5. **Response:** Returns back through Trigger.dev → Next.js API → Frontend

**Timeout Benefits:**
- ✓ Next.js API calls Trigger task (non-blocking)
- ✓ Vercel serverless timeout: 60s (plenty for quick orchestration)
- ✓ Render worker timeout: 30min (handles long ffmpeg encodes)

---

## Verification Checklist

✅ Root `package.json`:
```bash
grep "trigger.dev\|@trigger.dev" package.json
# Should only show: "@trigger.dev/sdk": "4.4.4"
```

✅ Root `package-lock.json`:
```bash
grep -c "\"trigger.dev\":" package-lock.json
# Should be: 0
```

✅ No cross-imports in Next.js source:
```bash
grep -r "from.*trigger/" src/ || echo "No cross-imports found ✓"
```

✅ Trigger folder is standalone:
```bash
cd trigger && npm install && npx tsc --noEmit
# Should pass without errors ✓
```

---

## Troubleshooting

**"Trigger task timed out"** on Vercel:
- ✓ This is expected for long tasks
- ✓ Render worker is processing in background
- ✓ Check Render logs for errors

**SDK version mismatch:**
- Ensure both root and `trigger/` use same `@trigger.dev/sdk` version (4.4.4)

**Worker not receiving tasks:**
- Verify `TRIGGER_PROJECT_REF` env var is set in both Vercel and Render
- Check Trigger.dev dashboard for active worker status

---

## Local Development

**Terminal 1 - Run Next.js app:**
```bash
npm run dev
```

**Terminal 2 - Run Trigger worker:**
```bash
cd trigger
npm run dev
```

Both will run locally and communicate via Trigger.dev.
