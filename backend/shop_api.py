# shop_api.py
# Shopify Admin API integration using python-shopify
# Docs: https://github.com/Shopify/shopify_python_api
import os
import shopify

SHOP_URL = os.getenv("SHOP_URL")           # e.g. your-shop-name.myshopify.com
API_KEY = os.getenv("SHOP_API_KEY")
PASSWORD = os.getenv("SHOP_API_PASSWORD")

def _init_session():
    assert SHOP_URL and API_KEY and PASSWORD, "Missing SHOP_URL/API_KEY/PASSWORD env vars"
    shop_url = f"https://{API_KEY}:{PASSWORD}@{SHOP_URL}/admin"
    shopify.ShopifyResource.set_site(shop_url)

def create_razz_product(title: str, description: str, price: str, image_url: str):
    _init_session()
    product = shopify.Product()
    product.title = title
    product.body_html = description
    product.variants = [
        shopify.Variant({
            "price": price,
            "inventory_management": "shopify",
            "inventory_policy": "deny",
            "requires_shipping": True,
            "taxable": True,
            "sku": f"RAZZ-{title[:20]}"
        })
    ]
    if image_url:
        product.images = [shopify.Image({"src": image_url})]
    ok = product.save()
    if not ok:
        raise RuntimeError(f"Failed to create product: {product.errors.full_messages() if hasattr(product, 'errors') else 'unknown error'}")
    return product.to_dict()
