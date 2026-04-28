# NextFlow

NextFlow is a Krea-inspired LLM workflow builder using React Flow, Next.js App Router, Clerk auth, Prisma + Neon Postgres, and Trigger.dev-oriented execution endpoints.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- React Flow
- Zustand
- Zod
- Prisma + PostgreSQL (Neon)
- Clerk authentication
- Google Gemini (`@google/generative-ai`)
- Trigger.dev SDK (installed and script-ready)
- Transloadit SDK (installed and env placeholders ready)
- Lucide React

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env values:

```bash
copy .env.example .env.local
```

3. Fill required env vars in `.env.local`:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `GEMINI_API_KEY`

4. Push Prisma schema:

```bash
npm run db:push
npm run db:generate
```

5. Start app:

```bash
npm run dev
```

## Implemented Features

- Left sidebar Quick Access with exactly 6 node buttons:
  - Text Node
  - Upload Image Node
  - Upload Video Node
  - Run Any LLM Node
  - Crop Image Node
  - Extract Frame from Video Node
- React Flow canvas with pan/zoom, minimap, dot background, animated edges
- Type-safe connection validation and cycle prevention (DAG enforcement)
- Connected-input behavior that disables manual controls
- LLM inline output rendering on LLM node
- Parallel execution per DAG topological layers
- Run scopes: full workflow, selected nodes (with dependencies), single node
- Workflow and run history persistence in PostgreSQL via Prisma
- Right sidebar run history with expandable node-level details
- Undo/redo and keyboard delete support
- Pre-built sammple workflow
- import and export workflows
