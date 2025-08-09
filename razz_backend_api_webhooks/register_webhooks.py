
# register_webhooks.py
import os
from shop_api import register_orders_paid_webhook

if __name__ == "__main__":
    callback = os.getenv("WEBHOOK_CALLBACK_URL")  # e.g. https://your-backend/api/webhooks/shopify
    assert callback, "Set WEBHOOK_CALLBACK_URL"
    wh = register_orders_paid_webhook(callback)
    print("Webhook registered:", wh)
