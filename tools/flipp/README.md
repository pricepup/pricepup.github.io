# PricePup weekly flyer pipeline
Run every Wednesday (Flipp shows next week's flyers as a preview on Wednesday). flipp_fetch.py picks flyers valid tomorrow or starting within LOOKAHEAD (default 2) days.
0. Broad items are split into specific ones by split_rules.py (applied in build.py).
1. `python3 flipp_fetch.py .` → all.json (this week's grocery flyers, Calgary SE, 8 stores via Flipp)
2. `python3 build.py` → ingest.json + unmatched.txt (rules.py + overrides.py map listings to canonical items; existing_items.json = legacy item modes)
3. In the signed-in PricePup tab (silveratca@gmail.com): add a file input, upload ingest.json, `window.__ING = JSON.parse(await file.text())`, then run ingest.js; read `window.__INGEST_RESULT`.
4. Sanity check: obs with price > $30 or odd listings; fix rules in overrides.py.
