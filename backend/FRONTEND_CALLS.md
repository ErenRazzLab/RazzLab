# How to call from your website (example)

```js
// POST /api/run-draw
const res = await fetch("https://YOUR-BACKEND-URL/api/run-draw", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ spots: ["u1","u2","u3"], seed: Date.now().toString() })
});
const draw = await res.json();
console.log("winner", draw.winner);

// POST /api/create-razz-product
const res2 = await fetch("https://YOUR-BACKEND-URL/api/create-razz-product", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "2020 Prizm Zion Razz",
    description: "50 spots, $10/spot. Winner gets the card.",
    price: "10.00",
    image_url: "https://.../card.jpg"
  })
});
const product = await res2.json();
console.log(product);
```
