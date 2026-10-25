// Run in the signed-in PricePup tab after loading ingest JSON into window.__ING (via a file input).
// Existing items: only adds new variants (and photo if empty). New items: created. Obs: upserted by id (idempotent).
// Product photos (5.3): saved ONCE per product, the first time it is seen, as a small JPEG (about 160 px):
//   packaged products -> on the new variant (variants.<vid>.photo); fresh/loose products -> items.<id>.lphotos.<store_listing>.
//   Later weeks never replace a photo that is already there. Photos are not stored on price rows.
(async () => {
  const G = window.__ING, F = fb.F, now = Date.now(), td = new Date().toISOString().slice(0, 10);
  const have = {}; (await F.getDocsFromServer(col('items'))).docs.forEach(d => have[d.id] = d.data());
  const small = async url => { // flyer images allow cross-origin reads, so we can shrink them here
    try { const b = await (await fetch(url, { mode: 'cors' })).blob(), img = await createImageBitmap(b), s = Math.min(1, 160 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', .72); } catch (e) { return url; } };
  const lkey = (store, listing) => (store + '_' + listing).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
  const ops = []; let created = 0, updated = 0, photos = 0;
  for (const it of G.items) {
    const ref = docRef('items', it.id), cur = have[it.id];
    for (const [vid, va] of Object.entries(it.variants || {})) if (va.photo && /^https?:/.test(va.photo) && !(cur && (cur.variants || {})[vid])) va.photo = await small(va.photo); // only shrink photos of variants we will actually add
    if (!cur) { created++; have[it.id] = { variants: it.variants, lphotos: {} }; ops.push(b => b.set(ref, { name: it.name, en: it.en, cat: it.cat, mode: it.mode, cmpUses: !!it.cmpUses, aliases: [], variants: it.variants, photo: it.photo || '', created: td, by: 'backend', updated: now })); }
    else {
      const u = { updated: now }; let n = 0;
      for (const [vid, va] of Object.entries(it.variants)) if (!(cur.variants || {})[vid]) { u['variants.' + vid] = va; n++; }
      if (it.photo && !cur.photo) { u.photo = it.photo; n++; }
      if (n) { updated++; ops.push(b => b.update(ref, u)); }
    }
  }
  // loose/fresh products (no variant): one photo per store + listing, only if we don't have one yet
  const lp = {};
  for (const o of G.obs) { if (!o.img || o.vid) continue; const k = lkey(o.store, o.listing || ''), cur = have[o.itemId] || {};
    if (!k || ((cur.lphotos || {})[k]) || (lp[o.itemId] || {})[k]) continue; (lp[o.itemId] = lp[o.itemId] || {})[k] = await small(o.img); photos++; }
  for (const [id, m] of Object.entries(lp)) { const u = { updated: now }; for (const [k, v] of Object.entries(m)) u['lphotos.' + k] = v; ops.push(b => b.update(docRef('items', id), u)); }
  for (const o of G.obs) { const { id, img, ...d } = o; d.ts = now; d.updated = now; ops.push(b => b.set(docRef('obs', id), d)); }
  for (let i = 0; i < ops.length; i += 400) { const b = F.writeBatch(fb.db); ops.slice(i, i + 400).forEach(f => f(b)); await b.commit(); }
  window.__INGEST_RESULT = `items created ${created}, items updated ${updated}, product photos ${photos}, obs written ${G.obs.length}`;
})();
