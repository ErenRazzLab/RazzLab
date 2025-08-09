# README.md

## Razz Backend with Shopify Webhooks (Auto-Draw on Sellout)

This bundle adds:
- `/api/webhooks/shopify` — verifies Shopify HMAC and processes `orders/paid` events
- Auto-accumulates **participants** per Razz product via metafields
- Triggers the **on-platform randomizer** when **total spots** are sold
- Writes results back to product metafields

### Environment variables
Copy `.env.example` to `.env` (or set in your hosting UI):

```
SHOP_URL=your-shop-name.myshopify.com
SHOP_API_KEY=shpua_xxx
SHOP_API_PASSWORD=shppa_xxx
SHOP_API_SECRET=shpss_xxx          # App's API secret (used for webhook HMAC verification)
RAZZ_TAG=razz                      # Products with this tag are treated as razzes
RAZZ_META_NS=razz                  # Metafield namespace used by this backend
```

### Product model (recommended)
- **Tag:** `razz` (configurable via `RAZZ_TAG`)
- **Variant inventory quantity** = number of spots (e.g., 50)
- **Price** = price per spot
- Optional metafields (namespace = `razz`):
  - `total_spots` (int) — if omitted, we use variant inventory at create-time
  - `participants` (json) — managed by backend
  - `draw_result` (json) — set when draw completes
  - `status` (string) — `open` | `drawn`

### Endpoints
- `POST /api/create-razz-product` — creates a razz product; seeds `total_spots` and clears metafields.
- `POST /api/run-draw` — manual draw (for testing).
- `POST /api/webhooks/shopify` — receives `orders/paid`, accumulates participants, auto-draws on sellout.

### Local run
```
pip install -r requirements.txt
export $(cat .env | xargs)   # or set vars manually
python app.py
```

### Deploy (Docker)
```
docker build -t razz-backend .
docker run -p 8000:8000 --env-file .env razz-backend
```

### Register webhook (orders/paid)
Run once (or create in Shopify Admin):
```
python register_webhooks.py
```
