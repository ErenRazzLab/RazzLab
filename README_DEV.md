# RazzLab Deploy Runbook

## Secrets (GitHub → Settings → Secrets and variables → Actions)
- FIREBASE_PROJECT_ID = razzlab
- GCP_SA_KEY_B64 = base64 of your Firebase service-account JSON

Create base64 (macOS):
    base64 -i ~/Downloads/<key>.json | pbcopy

## Deploy workflow
- On push to `main` or manual dispatch.
- Auth uses base64 secret, writes `$RUNNER_TEMP/gcp_sa.json`.
- Frontend: uses `npm ci` if lockfile exists else `npm install`; builds to `frontend/out`.
- Functions: builds if folder exists.
- Deploys Functions then Hosting.

## Local dev
- Frontend: `cd frontend && npm install && npm run dev`
- Functions: `cd functions && npm install && npm run build && npm run serve`

## Common failures
- Missing GCP_SA_KEY_B64 → set secret.
- `npm ci` error → commit `package-lock.json` or rely on fallback to `npm install`.
- Hosting path mismatch → `firebase.json` must point to `frontend/out`.
