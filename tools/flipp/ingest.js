// Run in the signed-in PricePup tab after loading ingest JSON into window.__ING (via a file input).
// Existing items: only adds new variants (and photo if empty). New items: created. Obs: upserted by id (idempotent).
(async () => {
  const G = window.__ING, F = fb.F, now = Date.now(), td = new Date().toISOString().slice(0, 10);
  const have = {}; (await F.getDocsFromServer(col('items'))).docs.forEach(d => have[d.id] = d.data());
  const ops = []; let created = 0, updated = 0;
  for (const it of G.items) {
    const ref = docRef('items', it.id), cur = have[it.id];
    if (!cur) { created++; ops.push(b => b.set(ref, { name: it.name, en: it.en, cat: it.cat, mode: it.mode, cmpUses: !!it.cmpUses, aliases: [], variants: it.variants, photo: it.photo || '', created: td, by: 'backend', updated: now })); }
    else {
      const u = { updated: now }; let n = 0;
      for (const [vid, va] of Object.entries(it.variants)) if (!(cur.variants || {})[vid]) { u['variants.' + vid] = va; n++; }
      if (it.photo && !cur.photo) { u.photo = it.photo; n++; }
      if (n) { updated++; ops.push(b => b.update(ref, u)); }
    }
  }
  for (const o of G.obs) { const { id, ...d } = o; d.ts = now; d.updated = now; ops.push(b => b.set(docRef('obs', id), d)); }
  for (let i = 0; i < ops.length; i += 400) { const b = F.writeBatch(fb.db); ops.slice(i, i + 400).forEach(f => f(b)); await b.commit(); }
  window.__INGEST_RESULT = `items created ${created}, items updated ${updated}, obs written ${G.obs.length}`;
})();
