
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from randomizer import run_draw
from shop_api import (create_razz_product, get_product, is_razz_product,
                      append_participants, get_razz_state, set_draw_result)
from verify import verify_shopify_hmac

app = Flask(__name__)
CORS(app)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/run-draw")
def api_run_draw():
    data = request.get_json(force=True) or {}
    spots = data.get("spots", [])
    seed = data.get("seed")
    try:
        result = run_draw(spots, seed)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.post("/api/create-razz-product")
def api_create_product():
    data = request.get_json(force=True) or {}
    title = data.get("title")
    description = data.get("description", "")
    price = str(data.get("price"))
    image_url = data.get("image_url", "")
    total_spots = int(data.get("total_spots", 0) or 0)
    if not title or not price:
        return jsonify({"error": "title and price are required"}), 400
    try:
        product = create_razz_product(title, description, price, image_url, total_spots)
        return jsonify({"product": product})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.post("/api/webhooks/shopify")
def shopify_webhook():
    hmac_hdr = request.headers.get("X-Shopify-Hmac-Sha256", "")
    raw = request.get_data()
    if not verify_shopify_hmac(raw, hmac_hdr):
        return jsonify({"error": "invalid hmac"}), 401

    topic = request.headers.get("X-Shopify-Topic", "")
    data = request.get_json(force=True, silent=True) or {}
    try:
        if topic == "orders/paid":
            return _handle_order_paid(data)
        return jsonify({"status": "ignored", "topic": topic})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

def _handle_order_paid(order: dict):
    line_items = order.get("line_items", [])
    customer = order.get("customer") or {}
    buyer = customer.get("email") or str(customer.get("id") or "unknown")
    updates = []
    for li in line_items:
        pid = li.get("product_id")
        if not pid:
            continue
        product = get_product(pid)
        if not product or not is_razz_product(product):
            continue
        qty = int(li.get("quantity") or 1)
        participants = [buyer] * qty
        merged = append_participants(pid, participants)
        state = get_razz_state(pid)
        total_spots = state.get("total_spots") or (product.variants[0].inventory_quantity if product.variants else 0)
        updates.append({"product_id": pid, "participants": len(merged), "total_spots": total_spots})
        if total_spots and len(merged) >= total_spots and state.get("status") != "drawn":
            result = run_draw(merged)
            set_draw_result(pid, result)
            updates[-1]["drawn"] = True
            updates[-1]["winner"] = result["winner"]
    return jsonify({"ok": True, "updates": updates})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
