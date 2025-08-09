
# shop_api.py
# Shopify Admin API integration using python-shopify
import os, json
import shopify

SHOP_URL = os.getenv("SHOP_URL")           # e.g. your-shop-name.myshopify.com
API_KEY = os.getenv("SHOP_API_KEY")
PASSWORD = os.getenv("SHOP_API_PASSWORD")
RAZZ_TAG = os.getenv("RAZZ_TAG", "razz")
RAZZ_META_NS = os.getenv("RAZZ_META_NS", "razz")

def _init_session():
    assert SHOP_URL and API_KEY and PASSWORD, "Missing SHOP_URL/API_KEY/PASSWORD env vars"
    shop_url = f"https://{API_KEY}:{PASSWORD}@{SHOP_URL}/admin"
    shopify.ShopifyResource.set_site(shop_url)

def create_razz_product(title: str, description: str, price: str, image_url: str, total_spots: int = 0):
    _init_session()
    product = shopify.Product()
    product.title = title
    product.body_html = description
    product.tags = f"{RAZZ_TAG}"
    product.product_type = "Razz"
    product.variants = [
        shopify.Variant({
            "price": price,
            "inventory_management": "shopify",
            "inventory_policy": "deny",
            "requires_shipping": True,
            "taxable": True,
            "sku": f"RAZZ-{title[:24]}"
        })
    ]
    if image_url:
        product.images = [shopify.Image({"src": image_url})]

    ok = product.save()
    if not ok:
        raise RuntimeError(f"Failed to create product: {product.errors.full_messages() if hasattr(product, 'errors') else 'unknown error'}")

    # Set inventory (spots) if provided
    if total_spots and product.variants and product.variants[0].inventory_quantity != total_spots:
        variant = product.variants[0]
        variant.inventory_quantity = int(total_spots)
        variant.inventory_management = "shopify"
        variant.save()

    # Seed metafields
    pid = product.id
    _set_metafield(pid, "status", "open")
    _set_metafield(pid, "participants", json.dumps([]), value_type="json")
    # Keep a copy of total_spots (fallback to variant inventory if unset)
    if total_spots:
        _set_metafield(pid, "total_spots", str(total_spots))

    return product.to_dict()

def _set_metafield(product_id: int, key: str, value: str, value_type: str = "single_line_text_field"):
    mf = shopify.Metafield({
        "namespace": RAZZ_META_NS,
        "key": key,
        "owner_resource": "product",
        "owner_id": product_id,
        "type": value_type,
        "value": value,
    })
    mf.save()

def _get_metafields(product_id: int):
    return shopify.Metafield.find(resource="products", resource_id=product_id)

def get_razz_state(product_id: int):
    _init_session()
    fields = _get_metafields(product_id)
    state = {"participants": [], "status": "open", "total_spots": 0}
    for f in fields:
        if f.namespace != RAZZ_META_NS:
            continue
        if f.key == "participants":
            try:
                state["participants"] = json.loads(f.value or "[]")
            except Exception:
                state["participants"] = []
        elif f.key == "status":
            state["status"] = f.value or "open"
        elif f.key == "total_spots":
            try:
                state["total_spots"] = int(f.value)
            except Exception:
                pass
    return state

def set_draw_result(product_id: int, result: dict):
    _init_session()
    _set_metafield(product_id, "draw_result", json.dumps(result), value_type="json")
    _set_metafield(product_id, "status", "drawn")

def append_participants(product_id: int, new_participants: list[str]):
    _init_session()
    state = get_razz_state(product_id)
    merged = state.get("participants", []) + new_participants
    _set_metafield(product_id, "participants", json.dumps(merged), value_type="json")
    return merged

def get_product(product_id: int):
    _init_session()
    return shopify.Product.find(product_id)

def is_razz_product(product) -> bool:
    tags = (product.tags or "").lower()
    return RAZZ_TAG.lower() in tags or (product.product_type or "").lower() == "razz"

def register_orders_paid_webhook(callback_url: str):
    _init_session()
    topic = "orders/paid"
    existing = shopify.Webhook.find()
    for wh in existing:
        if wh.address == callback_url and wh.topic == topic:
            return wh.to_dict()
    webhook = shopify.Webhook({
        "topic": topic,
        "address": callback_url,
        "format": "json"
    })
    ok = webhook.save()
    if not ok:
        raise RuntimeError(f"Failed to create webhook: {webhook.errors.full_messages() if hasattr(webhook, 'errors') else 'unknown error'}")
    return webhook.to_dict()
