import json, re, sys, hashlib, collections, os
sys.path.insert(0, os.path.dirname(__file__))
from rules import R, SKIP
D = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(f'{D}/all.json'))
existing = json.load(open(f'{D}/existing_items.json'))  # {id:{mode,name,photo,variants:{}}}
SKIP_STORES = set(sys.argv[1].split(',')) if len(sys.argv) > 1 and sys.argv[1] else set()
skipre = re.compile(SKIP)
from overrides import OVR, SKIP_EXTRA, MOVE_BEFORE
R = list(R)
for mv, before in MOVE_BEFORE.items():
    x = next(r for r in R if r[0] == mv); R.remove(x); R.insert(next(i for i, r in enumerate(R) if r[0] == before), x)
R2 = []
for k, zh, en, cat, mode, inc, exc in R:
    if k in OVR:
        ni, ne = OVR[k]
        if ni: inc = ni
        if ne: exc = (exc + '|' + ne) if exc else ne
    R2.append((k, zh, en, cat, mode, inc, exc))
R = R2
skipx = re.compile(SKIP_EXTRA)
rules = [(k, zh, en, cat, mode, re.compile(inc, re.I), re.compile(exc, re.I) if exc else None) for k, zh, en, cat, mode, inc, exc in R]
LB_G = 453.592

def norm(s): return re.sub(r'\s+', ' ', (s or '').replace('®', '').replace('™', '').replace('‑', '-')).strip()
def title(s):
    if s.upper() == s: s = ' '.join(w.capitalize() if not re.match(r"^(PC|T&T|BBQ|XL|II|CO)$", w) else w for w in s.split(' '))
    return s
SZ = re.compile(r'(?<![\d.])(\d+(?:\.\d+)?)\s*(?:x|×)?\s*(kg|g|gr|mL|ml|L|l|lb|lbs|oz|pk|pack|ct|count|\'s|s|pcs|pc|rolls|loads|tablets|washes)\b', re.I)
MULTI = re.compile(r'(\d+)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l|oz)\b', re.I)
RANGE = re.compile(r'\d+(?:\.\d+)?\s*(?:-|–|/|to)\s*\d+(?:\.\d+)?\s*(kg|g|ml|l|lb|oz|pk|\'s)\b', re.I)
UMAP = {'kg': 'kg', 'g': 'g', 'gr': 'g', 'ml': 'mL', 'l': 'L', 'lb': 'lb', 'lbs': 'lb', 'oz': 'oz'}
CNT = {'pk', 'pack', 'ct', 'count', "'s", 's', 'pcs', 'pc', 'rolls', 'tablets', 'washes'}

def size_of(text):
    """returns (size, unit, uses) or (None, None, uses); ranges -> None"""
    uses = None
    m = re.search(r'(\d+)\s*(loads|washes|uses)\b', text, re.I)
    if m: uses = int(m.group(1))
    if RANGE.search(text): return None, None, uses
    m = MULTI.search(text)
    if m: return round(int(m.group(1)) * float(m.group(2)), 3), UMAP[m.group(3).lower()], uses
    for m in SZ.finditer(text):
        n, u = float(m.group(1)), m.group(2).lower()
        if u in UMAP: return n, UMAP[u], uses
    for m in SZ.finditer(text):
        n, u = float(m.group(1)), m.group(2).lower()
        if u in CNT and (u != 's' or re.match(r'\d+(\.\d+)?s$', m.group(0))) and n >= 2: return n, 'count', uses
    m = re.search(r'(?<![\d.])(\d+)\s*-\s*(pack|pk|count|ct)\b', text, re.I)
    if m and int(m.group(1)) >= 2: return int(m.group(1)), 'count', uses
    return None, None, uses

def money(s):
    try: return float(str(s).replace('$', '').replace(',', ''))
    except: return None

def classify(name, desc):
    t = norm(name)
    if skipre.search(t) or skipx.search(t): return None, 'skip'
    for k, zh, en, cat, mode, inc, exc in rules:
        if inc.search(t) and not (exc and exc.search(t)): return (k, zh, en, cat, mode), 'ok'
    return None, 'nomatch'

ST = {'Superstore': 'Superstore Seton'}
out_items, out_obs, stats, unmatched = {}, [], collections.Counter(), []
for i in items:
    st = i['_store']
    if st in SKIP_STORES: continue
    st = ST.get(st, st)
    name = norm(i.get('name')); desc = norm(i.get('description'))
    pre = norm(i.get('pre_price_text')); pt = norm(i.get('price_text')); story = norm(i.get('sale_story'))
    price = money(i.get('current_price') or i.get('price'))
    if not price or price <= 0: stats['noprice'] += 1; continue
    if re.search(r'starting|from|up to', pre + ' ' + pt, re.I): stats['from'] += 1; continue
    if re.search(r'after savings|% off', pt, re.I): stats['pct'] += 1; continue
    # mixed listings ("A, B, C or D") are too vague to compare
    core = re.sub(r',\s*[\d.\-–/ ]+\s*(g|kg|ml|l|lb|oz|\'s|pk)\b.*$', '', name, flags=re.I)
    if core.count(',') >= 2: stats['mixed'] += 1; continue
    c, why = classify(name, desc)
    if not c:
        stats[why] += 1
        if why == 'nomatch': unmatched.append(f'{st[:3]} {name} | {desc[:40]}')
        continue
    key, zh, en, cat, mode = c
    ex = existing.get(key)
    imode = ex['mode'] if ex else ('weight' if mode == 'w' else 'pack')
    if key == 'avocado': imode = 'pack'
    img = (i.get('cutout_image_url') or '').replace('http://', 'https://')
    # multi-buy
    multi = 1
    m = re.match(r'^(\d+)\s*(for|/)$', pre, re.I)
    if m: multi = int(m.group(1))
    # per-unit
    txt = f'{pt} | {pre}'
    per = None
    if re.search(r'(^|[/\s])(lb|lbs)\b', txt, re.I): per = 'lb'
    elif re.search(r'/\s*kg\b|^kg$', txt, re.I): per = 'kg'
    elif re.search(r'100\s*g', txt, re.I): per = '100g'
    elif re.search(r'(\d|^)\s*/?\s*kg\b', pt, re.I): per = 'kg'
    stext = f'{name} {desc}'
    size, unit, uses = size_of(stext)
    lst = title(re.sub(r',\s*$', '', re.sub(r'\s*,?\s*\d+(\.\d+)?\s*(kg|g|ml|l|lb|oz)\b.*$', '', name, flags=re.I)))
    reg = money(i.get('original_price'))
    m = re.search(r'save\s*\$?(\d+(?:\.\d+)?)(¢)?', story, re.I)
    if not reg and m and not re.search(r'up to', story, re.I):
        sv = float(m.group(1)) / (100 if m.group(2) else 1)
        reg = round(price / multi + sv, 2)
    o = {'id': f"o-flipp-{i['id']}", 'store': st, 'price': price, 'multi': multi, 'date': i['valid_from'][:10], 'until': i['valid_to'][:10],
         'sale': True, 'src': 'flyer', 'note': 'flyer', 'listing': lst, 'by': 'backend', 'flipp': i['id']}
    if reg and reg > price / multi: o['reg'] = reg
    if re.search(r'member|scene\+', pre + ' ' + pt + ' ' + story, re.I): o['note'] = 'flyer · member'
    if re.search(r'online', pre, re.I): o['note'] = 'flyer · online'
    vnew = None
    if imode == 'weight' and not per:
        m = re.search(r'(\d+(?:\.\d+)?)\s*/\s*kg', desc + ' ' + name, re.I)
        if m:
            x = float(m.group(1))
            if abs(x / 2.20462 - price) < 0.03: per = 'lb'
            elif abs(x - price) < 0.02: per = 'kg'
    if imode == 'weight':
        if per in ('lb', 'kg'): o['per'] = per
        elif per == '100g': o['per'] = 'kg'; o['price'] = round(price * 10, 2); o['multi'] = 1
        elif size and unit in ('g', 'kg', 'lb', 'oz', 'count'):
            o['per'] = 'pack'; vnew = (size, unit)
        else: o['per'] = 'pack'; vnew = (1, 'count')
    else:
        o['per'] = 'pack'
        if per == '100g': vnew = (100, 'g')
        elif per in ('lb', 'kg'): vnew = (1, per)
        else: vnew = (size, unit)
    if vnew:
        sz, un = vnew
        brand = norm(i.get('brand') or '')
        vdesc = lst if not brand else re.sub(re.escape(brand), '', lst, flags=re.I).strip(' -,')
        if sz is None and not re.search(r'\d', desc): pass
        rng = None if sz else (RANGE.search(stext).group(0) if RANGE.search(stext) else '')
        if rng: vdesc = f'{vdesc} {rng}'
        sig = f"{brand.lower()}|{re.sub(r'[^a-z0-9]', '', vdesc.lower())}|{sz}|{un}"
        vid = 'v-f' + hashlib.md5(sig.encode()).hexdigest()[:8]
        va = {'brand': title(brand), 'desc': vdesc[:80], 'size': sz or '', 'unit': un or 'count', 'uses': uses or '', 'barcode': '', 'photo': img}
        if not sz: va['unit'] = 'count'; va['size'] = ''
        o['vid'] = vid
    o['itemId'] = key
    rec = out_items.setdefault(key, {'id': key, 'new': not ex, 'name': zh, 'en': en, 'cat': cat, 'mode': imode,
                                     'cmpUses': mode == 'pu', 'variants': {}, 'photo': '', 'n': 0})
    rec['n'] += 1
    if vnew and vid not in (ex or {}).get('variants', {}): rec['variants'][vid] = va
    if not rec['photo'] and img and not (ex and ex.get('photo')): rec['photo'] = img
    out_obs.append(o)
    stats['obs'] += 1

json.dump({'items': list(out_items.values()), 'obs': out_obs}, open(f'{D}/ingest.json', 'w'), ensure_ascii=False)
open(f'{D}/unmatched.txt', 'w').write('\n'.join(sorted(unmatched)))
print(dict(stats))
print('items', len(out_items), 'new', sum(1 for x in out_items.values() if x['new']), 'variants', sum(len(x['variants']) for x in out_items.values()))
print(collections.Counter(o['store'] for o in out_obs))
