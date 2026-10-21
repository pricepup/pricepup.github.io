"""Download this week's grocery flyers from Flipp for Calgary SE and save item details to all.json.
Usage: python3 flipp_fetch.py [outdir]"""
import json, urllib.request, concurrent.futures as cf, sys, os, datetime
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
POSTAL = 'T2X0M4'
MERCHANTS = {'Real Canadian Superstore': 'Superstore', 'Sobeys': 'Sobeys', 'Save-On-Foods': 'Save-On-Foods',
             'T&T Supermarket': 'T&T', 'Costco': 'Costco', 'FreshCo': 'FreshCo', 'Safeway': 'Safeway', 'Walmart': 'Walmart'}
def get(u):
    err = None
    for _ in range(3):
        try: return json.load(urllib.request.urlopen(u, timeout=30))
        except Exception as e: err = e
    print('FAIL', u, err); return None
d = get(f'https://backflipp.wishabi.com/flipp/flyers?locale=en-ca&postal_code={POSTAL}')
fl = d.get('flyers', d)
# Runs on Wednesdays, when Flipp already shows next week's flyers as a preview.
# Pick every grocery flyer that is still valid tomorrow or starts within LOOKAHEAD days
# (catches Thursday starts, and T&T's Friday start). Flyers ending today were loaded last week.
LOOKAHEAD = int(os.environ.get('LOOKAHEAD', '2'))
d0 = datetime.date.today()
tomorrow = (d0 + datetime.timedelta(days=1)).isoformat()
horizon = (d0 + datetime.timedelta(days=LOOKAHEAD)).isoformat()
pick = [f for f in fl if f['merchant'] in MERCHANTS and 'Groceries' in (f.get('categories') or [])
        and f['valid_to'][:10] >= tomorrow and f['valid_from'][:10] <= horizon]
for f in pick: print('flyer', f['id'], f['merchant'], f['valid_from'][:10], f['valid_to'][:10], f.get('name'))
items = []
for f in pick:
    dd = get(f"https://backflipp.wishabi.com/flipp/flyers/{f['id']}?locale=en-ca") or {}
    for i in dd.get('items', []): items.append((MERCHANTS[f['merchant']], i))
def det(t):
    st, i = t
    dd = get(f"https://backflipp.wishabi.com/flipp/items/{i['id']}?locale=en-ca")
    it = (dd or {}).get('item', i); it['_store'] = st; return it
with cf.ThreadPoolExecutor(12) as ex: out = list(ex.map(det, items))
json.dump(out, open(os.path.join(OUT, 'all.json'), 'w'))
print('items', len(out))
