# RazzLab Frontend

## Quick start
```bash
cp .env.local.example .env.local
# Put your Cloud Run URL in NEXT_PUBLIC_API_BASE (no trailing slash)
npm install
npm run dev
```

Open http://localhost:3000 — the home page will call `/health` on the backend.
