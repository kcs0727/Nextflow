# NextFlow

NextFlow is a Krea-inspired visual workflow builder that lets you assemble LLM and media-processing pipelines using a node-based canvas. It includes an editor and Trigger worker that runs background tasks.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + semantic CSS variables
- React Flow (node-based canvas)
- Zustand (local/store state)
- Prisma + PostgreSQL (Neon)
- Clerk (authentication)
- Google Gemini (`@google/generative-ai`) for LLMs
- Trigger.dev SDK for background worker flows
- Transloadit for media processing
- Lucide React for icons

The repository contains two runnable pieces:
- App: the Next.js + React UI under the repository root
- Trigger worker: background job worker in `trigger/`


## Local setup — App (Next.js)

1. Install dependencies

```bash
npm install
```

2. Required env vars (app)

- `DATABASE_URL` — Postgres connection string used by Prisma
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (client)
- `CLERK_SECRET_KEY` — Clerk secret key (server)
- `GEMINI_API_KEY` — Google Generative AI API key (used by Trigger and optionally server)
- `TRANSLOADIT_AUTH_KEY` — Transloadit auth key (server-only)
- `TRANSLOADIT_AUTH_SECRET` — Transloadit auth secret (server-only)
- `TRANSLOADIT_TEMPLATE_ID_IMAGE` — Transloadit template id for images
- `TRANSLOADIT_TEMPLATE_ID_VIDEO` — Transloadit template id for videos
- `TRIGGER_SECRET_KEY` 
- `TRIGGER_PROJECT_REF`

3. Prepare the database (Prisma)

```bash
# generate client
npm run prisma:generate
# run migrations or push schema
npm run db:push
# or if you prefer migrations
npm run migrate:dev
```

4. Run the app

```bash
npm run dev
# open http://localhost:3000
```

## Local setup — Trigger worker

1. Install and run from the `trigger/` folder

```bash
cd trigger
npm install
npm run dev
```

2. Env vars for the Trigger worker

- `GEMINI_API_KEY` — Google Generative AI API key (LLM calls)
- `TRANSLOADIT_AUTH_KEY` — Transloadit auth key (server-only)
- `TRANSLOADIT_AUTH_SECRET` — Transloadit auth secret (server-only)
- `TRANSLOADIT_TEMPLATE_ID_IMAGE` — Transloadit template id for images
- `TRANSLOADIT_TEMPLATE_ID_VIDEO` — Transloadit template id for videos
- `TRIGGER_SECRET_KEY` 
- `TRIGGER_PROJECT_REF`
- `TRIGGER_ACCESS_TOKEN`

3. Running in production

The `trigger/` package.json exposes `start` which runs `node render-start.cjs` (for Render-style startup). For other hosts follow Trigger.dev deployment docs.


## Deployment

- App: Deploy the Next.js app to Vercel (recommended) or any hosting that supports Node and Next.js App Router.
- Trigger worker: Deploy separately to a background worker platform (Render, Fly, Railway) or using Trigger.dev's own hosting/integrations.


## Features

- Visual node-based workflow builder (6 prebuilt nodes: Text, Upload Image, Upload Video, Run Any LLM, Crop Image, Extract Frame)
- Per-node handle coloring and node palette
- React Flow canvas with pan/zoom, grid dots, and minimap
- Live node search and quick-add in the left sidebar
- Persisted workflows and run history in PostgreSQL via Prisma
- Run scopes: full workflow, selected nodes, or single node
- Background execution through Trigger worker (LLM calls, media processing, Transloadit orchestration)
- Authentication with Clerk
- Import / export workflows
- Undo/redo and keyboard interactions

