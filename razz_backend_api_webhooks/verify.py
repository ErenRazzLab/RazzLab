
# verify.py
import base64, hashlib, hmac, os

def verify_shopify_hmac(raw_body: bytes, hmac_header: str) -> bool:
    secret = os.getenv("SHOP_API_SECRET", "")
    if not secret or not hmac_header:
        return False
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).digest()
    computed = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(computed, hmac_header)
