# PricePup weekly flyer pipeline
Run every Wednesday (Flipp shows next week's flyers as a preview on Wednesday). flipp_fetch.py picks flyers valid tomorrow or starting within LOOKAHEAD (default 2) days.
0. Broad items are split into specific ones by split_rules.py (applied in build.py).
1. `python3 flipp_fetch.py .` → all.json (this week's grocery flyers, Calgary SE, 14 stores via Flipp (5.1: + Co-op, No Frills, Wholesale Club, H Mart, Shoppers, London Drugs))
2. `python3 build.py` → ingest.json + unmatched.txt (rules.py + overrides.py map listings to canonical items; existing_items.json = legacy item modes)
3. In the signed-in PricePup tab (silveratca@gmail.com): add a file input, upload ingest.json, `window.__ING = JSON.parse(await file.text())`, then run ingest.js; read `window.__INGEST_RESULT`.
4. Sanity check: obs with price > $30 or odd listings; fix rules in overrides.py.


## Product photos (5.3)
build.py adds `img` (flyer cutout URL) to each price row. ingest.js shrinks it to a ~160 px JPEG in the browser and saves it ONCE per product: on new variants, or for loose/fresh products in `items.<id>.lphotos.<store_listing>`. Existing photos are never replaced; `img` is not stored on price rows.
Also fixed: "SAVE 21%" was read as $21 off (wrong Reg. price).
