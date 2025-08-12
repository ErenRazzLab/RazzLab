{
  "hosting": {
    "public": "frontend/out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/stripe/create-payment-intent",
        "function": "createPaymentIntent"
      },
      {
        "source": "/api/stripe/webhook",
        "function": "stripeWebhook"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}