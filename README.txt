# RazzLab minimal files

## Frontend (Next.js)
- Put `frontend/app/page.tsx` and `frontend/lib/api.ts` into your Next.js project (same paths).
- Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to your Cloud Run URL.

## Backend (Flask on Cloud Run)
Files inside `backend/` can be deployed with:

```bash
gcloud config set project razzlab
gcloud run deploy razzlab-backend --source backend --region australia-southeast2 --allow-unauthenticated
```

This uses a `Procfile` so Cloud Run runs Gunicorn with `app:app`.
