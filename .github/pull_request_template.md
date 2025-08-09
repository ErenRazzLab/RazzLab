## Summary
- Wire API client to Cloud Run via `NEXT_PUBLIC_API_BASE`
- Add `/health` page to verify end-to-end
- Add CI to build and hit `/health`
- Deploy on main via Firebase

## Checks
- [ ] `NEXT_PUBLIC_API_BASE` secret exists
- [ ] `FIREBASE_SERVICE_ACCOUNT` secret exists
- [ ] `FIREBASE_PROJECT_ID` secret exists
