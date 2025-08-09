# RazzLab Patch (Firebase + Cloud Run + React starter)

Files included:
- `.firebaserc` → sets project id to `razzlab` (lowercase).
- `firebase.json` → proxies `/api/**` to Cloud Run service `razz-backend` in `australia-southeast2`.
- `next-app/` → minimal Next.js starter.
- `public/index.html` → placeholder (Next export will overwrite).

## Apply
Unzip into your project root (same folder as your existing `firebase.json`). Allow overwrite.

## Deploy
firebase use razzlab
firebase deploy --only hosting

## Next.js (optional)
cd next-app
npm i
npm run build   # exports to ../public
cd ..
firebase deploy --only hosting
