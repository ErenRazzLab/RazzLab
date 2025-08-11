# Stripe Test-Mode Setup

1) Keys (Stripe Test mode):
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
   - STRIPE_SECRET_KEY = sk_test_...
   - STRIPE_WEBHOOK_SECRET = whsec_... (from Webhooks > endpoint > Reveal)

2) Backend
   - Copy `functions/` into your repo root (merge if exists).
   - Run:
     ```bash
     cd functions
     npm ci
     npm run build
     firebase deploy --only functions
     ```

3) Hosting rewrites
   - Merge `firebase.rewrites.patch.json` into your existing `firebase.json` under `hosting.rewrites`:
     ```json
     {
       "source": "/api/stripe/create-payment-intent",
       "function": "createPaymentIntent"
     },
     {
       "source": "/api/stripe/webhook",
       "function": "stripeWebhook"
     }
     ```
   - Then `firebase deploy --only hosting`.

4) Test
   - Create PI: `POST https://<your-domain>/api/stripe/create-payment-intent` with body `{ "amount": 5000, "currency": "usd" }`.
   - Pay with card `4242 4242 4242 4242` (any future expiry, any CVC).
   - Confirm Cloud Functions logs show `payment_intent.succeeded`.
