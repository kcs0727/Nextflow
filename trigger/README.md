Trigger worker
================

This folder contains the standalone Trigger.dev worker for the NextFlow app.

Local dev
---------

Install and run inside the `trigger` folder:

```bash
cd trigger
npm install
npm run dev
```

Deploy
------

Deploy the `trigger/` folder as a Node service on Render (or similar). Make sure to set the environment variables shown in `.env.example` in your Render service settings.

Notes
-----

- The main Next.js app is completely independent and only communicates with the trigger worker via Trigger.dev SDK calls.
- The Next.js app calls `tasks.trigger(taskId, payload)` which sends requests to this worker.
- Keep long-running work and ffmpeg/transloadit calls inside this worker to avoid Vercel timeouts.
