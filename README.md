# RazzLab

RazzLab is a platform for creating and joining collectible card raffles, offering fair razzes and real collectibles.

## Overview

- Create and join collectible card raffles.
- Frontend built with Next.js.
- Backend powered by Firebase Functions and Stripe for payments.

## Frontend Setup (Next.js)

1. Copy `frontend/app/page.tsx` and `frontend/lib/api.ts` into your Next.js project maintaining the same paths.
2. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to your backend Cloud Run URL.
3. Install dependencies and run the development server:

```bash
npm install
npm run dev
```

4. Open http://localhost:3000 to view the frontend.

## Backend Setup (Firebase Functions)

1. Copy the `functions/` directory into your repo root (merge if it exists).
2. Install dependencies and build:

```bash
cd functions
npm ci
npm run build
```

3. Deploy Firebase functions:

```bash
firebase deploy --only functions
```

## Stripe Integration

- Set Stripe keys in environment variables:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (publishable key)
  - `STRIPE_SECRET_KEY` (secret key)
  - `STRIPE_WEBHOOK_SECRET` (webhook secret)

- Configure Firebase hosting rewrites for Stripe API endpoints as per `firebase.json`.

## Deployment

- Frontend can be deployed using Next.js static export or your preferred hosting.
- Backend functions are deployed via Firebase.

## Additional Resources

- See `STRIPE_SETUP.md` for detailed Stripe setup instructions.
- See `frontend/README.md` for frontend-specific instructions.
- See `razzlab_casing_tool/README.md` for brand casing audit tooling.

## License

This project is licensed under the ISC License.
