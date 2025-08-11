import * as functions from "firebase-functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export const createPaymentIntent = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  try {
    const { amount, currency = "usd", metadata = {} } = req.body || {};
    if (!amount || typeof amount !== "number") {
      res.status(400).json({ error: "amount (number) is required" });
      return;
    }
    const pi = await stripe.paymentIntents.create({
      amount, currency, automatic_payment_methods: { enabled: true }, metadata
    });
    res.json({ clientSecret: pi.client_secret });
  } catch (err:any) {
    functions.logger.error("createPaymentIntent error", { message: err.message });
    res.status(500).json({ error: "internal_error" });
  }
});

export const stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) { res.status(400).send("Missing signature"); return; }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err:any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  switch (event.type) {
    case "payment_intent.succeeded":
      // TODO: mark raffle entry as paid in DB
      break;
    default:
      break;
  }
  res.json({ received: true });
});
