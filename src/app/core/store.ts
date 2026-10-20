// @ts-nocheck -- verbatim port of the untyped design-prototype logic; add types incrementally.
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService, authErrorMessage } from './auth';
import { CatalogService } from './catalog';
import { deserializeUser, freshUser, lastAccount, readLocal, savedCardCount, serializeUser, setLastAccount, writeLocal } from './persist';
import { SETS, LANGS, LNAME, TYPES, RAR, CONDS, COLS, isCard, isRes, COVERS, RAR_ORDER, IMGS, BGS, PIX, pixShadow, STK_ICONS, STK_TEXT, TEMPLATES, SIZES, EMPTYD, DEFCROP, tplAreas, syncSlots, decoPiece, isBufD, KINDS, smartCards, kindDesc, buildLayout, pad, CARDS, ILLUS, REGIONS, VARL, SP, BYSP, tot, priceAt, priceInfo, eur, pctf, UPDATED, chgStyle, initOwned, range, mkB, RECIPES, RSTEPS, STEPT, PREFS, DEFRECIPE, pixShadowU, pickVersion, recipeItems, buildRecipe, regLabel, autoName, recipeLabel, mkRecipeBinder, initBinders, NAV, BYSET, CATALOG_MOCK, ILLUS_N, RARITIES, BASIC_RARITIES, rarAbbr, rarLabel } from './data';

/**
 * Central app state + all derived view values, ported from the Cardcase design prototype.
 * `state` mirrors the prototype's component state; `vals` recomputes every view model on change.
 */
/** Cost of buying these cards; prices are fetched lazily, so say so when some are still unknown. */
const costLabel = cards => { const known = cards.filter(c => c.trend != null); if (!known.length) return 'prijs nog onbekend'; return (known.length < cards.length ? 'minstens ' : '') + eur(known.reduce((a, c) => a + c.trend, 0)); };

/** Pixel sprite of the card's Pokémon (PokéAPI, ~1 kB), drawn in the placeholder when TCGdex has no photo of the card. */
const spriteOf = c => c.sp >= 1 && c.sp <= 1025 ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${c.sp}.png` : null;

@Injectable({ providedIn: 'root' })
export class CardcaseStore {
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  /** Firebase uid whose data is in the state, or null for the guest collection. */
  private account: string | null = null;
  /** False while an account's data is loading (or failed to load): nothing gets saved then. */
  private syncReady = false;
  private lastSaved: any[] = [];
  private readonly _state = signal<any>(this.initialState());
  /** Bumped by go() so the shell can scroll the main area back to top. */
  readonly scrollTick = signal(0);
  readonly vals = computed(() => this.renderVals());
  readonly lcdPixels = true;

  get state(): any {
    return this._state();
  }

  setState(p: any) {
    const cur = this._state();
    const patch = typeof p === 'function' ? p(cur) : p;
    if (patch) this._state.set({ ...cur, ...patch });
  }

  /** Demo collection for the mock catalog; otherwise the saved collection, or an empty one on first use. */
  private initialUser() {
    if (!CATALOG_MOCK) { this.account = this.auth.enabled ? lastAccount() : null; return deserializeUser(readLocal(this.account)) ?? freshUser(); }
    const r = initOwned(); const now = Date.now(); const added = {};
    Object.entries(r.d).forEach(([id, days]) => { added[id] = now - days * 864e5; });
    return { owned: r.o, added, binders: initBinders(r.o), dark: false };
  }

  private initialState() { const u = this.initialUser(); return {
    screen: 'home', prev: 'home', dark: u.dark, authPanel: null, importOffer: null,
    wide: typeof window !== 'undefined' && window.innerWidth >= 900,
    owned: u.owned, added: u.added, detailId: 1, detailLang: CARDS[1].avail[0],
    q: '', fLangs: [], fSet: '', fRar: '', fType: '',
    view: 'grid', sort: 'set', collSet: '', missingOnly: false,
    binders: u.binders, edId: u.binders[0].id, edSpread: 0, autoSet: 'set:' + SETS[0].code, sideQ: '', sideSet: '',
    drag: null, over: null, sel: null, sideOver: false,
    vId: u.binders[0].id, vSpread: 0, flip: null,
    scan: { phase: 'search', matches: [], sel: 0, lang: 'EN', cond: 'NM', qty: 1 }, toast: null,
    create: { name: 'Nieuwe binder', cover: '#3E6FB0', fmt: 9, kind: 'set', sets: SETS.filter(s => !s.cat).slice(0, 2).map(s => s.code), sort: 'set', newPage: true, buffer: 1, types: ['fire', 'dragon'], langs: [], rars: [], minVal: 0, ownedOnly: true, group: 'none', freePages: 4 },
    shiftMode: 'buffer', job: null, done: {}, tip: false, showPrice: false, fSort: '', valRange: 'month',
    rc: Object.assign({}, DEFRECIPE), rcStep: 0, rcMore: false, rcText: '', rcSpQ: '', verSheet: null, newSheet: false, searchLimit: 60, collLimit: 60,
    edMode: 'cards', decoTab: 'images', decoSize: '2x2', decoSel: null, decoPage: 0, decoOver: null, crop: null, share: false, paper: 'A4', bleed: true, stkText: '', bgBoth: false, uploads: [], ps: { binderId: u.binders[0].id, pages: [0, 1], i: 0, phase: 'align', done: 0 }, psRes: {}, fixes: {}, fix: null,
  }; }
  seq = 0; pd: any = null; dragPayload: any = null; tt: any; ft: any; t1: any;

  /** Window listeners and timers the prototype set up in componentDidMount. */
  init() {
    const onResize = () => { const w = window.innerWidth >= 900; if (w !== this.state.wide) this.setState({ wide: w }); };
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', e => { if (this.state.screen !== 'viewer') return; if (e.key === 'ArrowRight') this.flip(1); if (e.key === 'ArrowLeft') this.flip(-1); });
    window.addEventListener('pointermove', e => this.onPD(e));
    window.addEventListener('pointerup', () => { this.pd = null; });
    // Save the user's collection and binders (debounced) whenever they change.
    effect(() => {
      const st = this.state; if (CATALOG_MOCK) return;
      const key = [st.owned, st.added, st.binders, st.dark];
      if (key.every((x, i) => x === this.lastSaved[i])) return;
      this.lastSaved = key;
      if (this.syncReady) untracked(() => this.scheduleSave());
    });
    // Switch collections when someone logs in or out.
    effect(() => {
      const u = this.auth.user(); const ready = this.auth.ready();
      if (!CATALOG_MOCK && ready) untracked(() => this.onAuth(u ? u.uid : null, u));
    });
    // Fetch Cardmarket prices for the cards that are owned or on screen.
    effect(() => {
      const st = this.state; const v = this.vals(); const ids = new Set<number>();
      for (const k in st.owned) if (tot(st.owned[k])) ids.add(+k);
      ids.add(st.detailId);
      [v.resultsShown, v.collShown, v.sideItems, v.recent].forEach(list => (list || []).forEach(x => ids.add(x.key)));
      const b = this.curB(); if (b) b.slots.forEach(x => { if (isCard(x)) ids.add(x); });
      this.catalog.ensurePrices(ids);
    });
  }
  saveT: any; remoteT: any;

  private scheduleSave(delay = 400) {
    clearTimeout(this.saveT);
    this.saveT = setTimeout(() => {
      const saved = serializeUser(this.state); const acc = this.account;
      writeLocal(acc, saved);
      if (!acc) return;
      this.auth.syncStatus.set('saving');
      clearTimeout(this.remoteT);
      this.remoteT = setTimeout(() => this.auth.saveRemote(acc, saved).then(() => { if (this.account === acc) this.auth.syncStatus.set('saved'); }).catch(err => { console.warn('[sync]', err); this.auth.syncStatus.set('error'); }), 1200);
    }, delay);
  }

  /** Replaces the collection, binders and settings (after login, logout or import). */
  applyUser(u) {
    const id = u.binders[0].id;
    this.setState(s => ({ owned: u.owned, added: u.added, binders: u.binders, dark: u.dark, edId: id, vId: id, edSpread: 0, vSpread: 0, ps: { ...s.ps, binderId: id }, sel: null, verSheet: null }));
    const st = this.state; this.lastSaved = [st.owned, st.added, st.binders, st.dark];
  }

  private async onAuth(uid: string | null, user) {
    if (uid === this.account && this.syncReady) return;
    if (!uid) {
      const wasAccount = this.account;
      this.account = null; setLastAccount(null); this.setState({ importOffer: null });
      if (wasAccount || !this.syncReady) this.applyUser(deserializeUser(readLocal(null)) ?? freshUser());
      this.syncReady = true; this.auth.syncStatus.set('guest');
      if (wasAccount) this.toast('Uitgelogd · je ziet nu de collectie op dit apparaat');
      return;
    }
    this.syncReady = false; this.account = uid; setLastAccount(uid); this.auth.syncStatus.set('loading');
    const name = user?.displayName || user?.email || '';
    let remote;
    try { remote = await this.auth.loadRemote(uid); } catch (err) {
      console.warn('[sync]', err); this.auth.syncStatus.set('error');
      const cached = deserializeUser(readLocal(uid)); if (cached) this.applyUser(cached);
      this.toast('Kon je collectie niet laden · ' + authErrorMessage(err));
      return;
    }
    if (this.account !== uid) return;
    if (remote) {
      this.applyUser(deserializeUser(remote) ?? freshUser()); writeLocal(uid, remote);
      this.syncReady = true; this.auth.syncStatus.set('saved');
      this.toast('Welkom ' + name + ' · ' + savedCardCount(remote) + ' kaarten geladen');
      return;
    }
    // New account: offer to bring along the collection made on this device as guest.
    const guest = readLocal(null); const n = savedCardCount(guest);
    if (n > 0) { this.setState({ importOffer: { count: n } }); return; }
    this.applyUser(freshUser()); this.syncReady = true; this.scheduleSave(0);
    this.toast('Account klaar · je collectie wordt nu online bewaard');
  }

  /** Answer to the import offer after a first login. */
  importGuest(yes: boolean) {
    const data = yes ? deserializeUser(readLocal(null)) ?? freshUser() : freshUser();
    this.setState({ importOffer: null }); this.applyUser(data);
    this.syncReady = true; this.scheduleSave(0);
    this.toast(yes ? 'Collectie van dit apparaat in je account gezet' : 'Je begint met een lege collectie');
  }
  toast(msg) { clearTimeout(this.tt); this.setState({ toast: msg }); this.tt = setTimeout(() => this.setState({ toast: null }), 2600); }
  go(screen, extra = {}) {
    if (screen === 'decorate') { screen = 'editor'; extra = Object.assign({ edId: 'b5', edMode: 'deco', edSpread: 0 }, extra); }
    if (screen === 'scan') this.startScan(); else this.clearScan();
    this.setState(s => ({ screen, prev: s.screen === 'detail' ? s.prev : s.screen, drag: null, over: null, sel: null, flip: null, ...extra }));
    this.scrollTick.update(n => n + 1);
  }
  clearScan() { clearTimeout(this.t1); }
  startScan() {
    this.clearScan();
    this.setState(s => ({ scan: { phase: 'search', matches: [], sel: 0, lang: 'EN', cond: s.scan.cond, qty: 1 } }));
  }
  /** The scanner recognised a card: show it briefly in the frame, then the matches sheet. `matches` is [{ id, conf }], best first. */
  scanFound(matches) {
    if (this.state.scan.phase !== 'search' || !matches.length) return;
    this.setScan({ phase: 'found', matches, sel: 0, lang: CARDS[matches[0].id].avail[0] });
    clearTimeout(this.t1); this.t1 = setTimeout(() => this.setScan({ phase: 'sheet' }), 700);
  }
  setScan(p) { this.setState(s => ({ scan: { ...s.scan, ...p } })); }
  /** Language of the cards being scanned, chosen in the scanner (EN also covers German cards); remembered on this device. */
  scanLang(): 'EN' | 'JA' | 'ZH' { let l = null; try { l = localStorage.getItem('cc-scan-lang'); } catch {} return l === 'JA' || l === 'ZH' ? l : 'EN'; }
  setScanLang(l: 'EN' | 'JA' | 'ZH') { try { localStorage.setItem('cc-scan-lang', l); } catch {} }
  addScan() {
    const s = this.state.scan; const m = s.matches[s.sel]; if (!m) return; const c = CARDS[m.id];
    const lang = c.avail.includes(s.lang) ? s.lang : c.avail[0]; const seq = ++this.seq;
    this.setState(st => ({ owned: { ...st.owned, [c.id]: { ...st.owned[c.id], [lang]: (st.owned[c.id][lang] || 0) + s.qty } }, added: { ...st.added, [c.id]: Date.now() } }));
    this.toast(`${c.names[lang]} toegevoegd · ${lang} · ${s.cond} · ×${s.qty}`);
    this.startScan();
  }
  cv(c, lang, missing) { const l = c.avail.includes(lang) ? lang : c.avail[0]; return { name: c.names[l], num: c.set + ' ' + c.numStr, bg: TYPES[c.type][1], typeLabel: TYPES[c.type][0], rar: rarAbbr(c), badge: c.rarityName && !BASIC_RARITIES.includes(c.rarityName) ? rarAbbr(c) : null, holo: c.rarity === 'HR', missing: !!missing, img: c.img ? (c.img[l] || c.img[c.avail[0]] || c.img.EN || null) : null, art: spriteOf(c) }; }
  openDetail(id, lang) { const c = CARDS[id]; this.go('detail', { detailId: id, detailLang: lang && c.avail.includes(lang) ? lang : c.avail[0] }); }
  setOwn(id, l, delta) { this.setState(s => ({ owned: { ...s.owned, [id]: { ...s.owned[id], [l]: Math.max(0, (s.owned[id][l] || 0) + delta) } }, added: delta > 0 ? { ...s.added, [id]: Date.now() } : s.added })); }

  curB() { return this.state.binders.find(b => b.id === this.state.edId); }
  updB(id, fn) { this.setState(s => ({ binders: s.binders.map(b => b.id === id ? fn({ ...b, slots: [...b.slots] }) : b) })); }
  setFmt(fmt) {
    this.updB(this.state.edId, b => { let L = 0; b.slots.forEach((x, i) => { if (x != null) L = i + 1; }); let pages = Math.max(2, Math.ceil(L / fmt)); if (pages % 2) pages++; const slots = b.slots.slice(0, L); while (slots.length < pages * fmt) slots.push(null); return { ...b, fmt, pages, slots }; });
    this.setState({ edSpread: 0 });
  }
  autofill() {
    const code = this.state.autoSet; const b = this.curB(); const own = this.state.owned; let src;
    if (code.startsWith('set:')) src = (BYSET[code.slice(4)] || []);
    else if (code.startsWith('type:')) src = CARDS.filter(c => c.type === code.slice(5) && tot(own[c.id]));
    else if (code.startsWith('lang:')) src = CARDS.filter(c => (own[c.id][code.slice(5)] || 0) > 0);
    else if (code === 'dupes') src = CARDS.filter(c => tot(own[c.id]) > 1).sort((a, z) => z.trend - a.trend);
    else if (code === 'want') src = CARDS.filter(c => !tot(own[c.id]));
    else src = CARDS.filter(c => tot(own[c.id])).sort((a, z) => z.trend - a.trend).slice(0, 18);
    const ids = src.filter(c => !b.slots.includes(c.id)).map(c => c.id);
    if (!ids.length) { this.toast('Alles uit deze selectie zit al in de binder'); return; }
    const miss = ids.filter(id => !tot(this.state.owned[id])).length; const start = this.state.edSpread * 2 * b.fmt;
    this.updB(b.id, nb => { let i = start; const q = [...ids]; while (q.length) { if (i >= nb.slots.length) { nb.pages += 2; for (let k = 0; k < 2 * nb.fmt; k++) nb.slots.push(null); } if (nb.slots[i] == null) nb.slots[i] = q.shift(); i++; } return nb; });
    this.toast(`${ids.length} kaarten geplaatst · ${miss} ontbrekend`);
  }
  dropOn(idx) {
    const d = this.state.drag; if (!d) return;
    this.updB(this.state.edId, b => { if (d.type === 'side') b.slots[idx] = d.cardId; else if (d.idx !== idx) { const t = b.slots[idx]; b.slots[idx] = b.slots[d.idx]; b.slots[d.idx] = t; } return b; });
    this.setState({ drag: null, over: null });
  }
  pageModel(b, p, editable, ov) {
    const { owned, drag, over, sel } = this.state; const fmt = b.fmt; const src = (ov && ov.slots) || b.slots; const slots = [];
    for (let j = 0; j < fmt; j++) {
      const idx = p * fmt + j; const x = p < b.pages ? src[idx] : null; const has = isCard(x); const isD = typeof x === 'string' && x.startsWith('D:'); const res = isRes(x) && !isD; const own = has && tot(owned[x]) > 0;
      const mv = ov && ov.moved && ov.moved[idx];
      const s = { key: idx, n: j + 1, hasCard: has, isEmpty: x == null, isReserved: res, resLabel: res ? (x === 'B' ? 'BUFFER' : 'VERWACHT #' + x.slice(2)) : '', isMissing: has && !own, missLabel: has ? '#' + pad(CARDS[x].num) : '', isOver: editable && over === idx, isTarget: editable && sel != null && !has && over !== idx, isDragging: !!(editable && drag && drag.type === 'slot' && drag.idx === idx), canRemove: editable && has, draggable: editable && (has || res), cursor: editable ? (has || res ? 'grab' : 'pointer') : 'default', card: has ? { ...this.cv(CARDS[x], 'EN', !own), dim: !own } : null, isMoved: !!mv, moveIcon: mv || '', hasWarn: !!((editable || b.showWarn) && has && b.warn && b.warn[idx]), warnText: (b.warn && b.warn[idx]) || '', canSwap: !!(editable && has && b.recipe), onSwap: e => { e.stopPropagation(); this.setState({ verSheet: { idx } }); }, isDeco: isD, ...decoPiece(b, x, j), isNew: !!(ov && ov.newIdx === idx), showPrice: has && (this.state.showPrice || !own), priceLabel: has ? (own ? '' : '≈ ') + eur(CARDS[x].trend) : '', priceBorder: own ? 'solid' : 'dashed' };
      if (editable) {
        s.onDragStart = e => { e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed = 'move'; this.setState({ drag: { type: 'slot', idx, cardId: x }, sel: null }); };
        s.onDragOver = e => { e.preventDefault(); if (this.state.over !== idx) this.setState({ over: idx }); };
        s.onDragLeave = () => { if (this.state.over === idx) this.setState({ over: null }); };
        s.onDrop = e => { e.preventDefault(); this.dropOn(idx); };
        s.onDragEnd = () => this.setState({ drag: null, over: null, sideOver: false });
        s.onClick = () => { const sl = this.state.sel; if (sl != null) { this.updB(b.id, nb => { nb.slots[idx] = sl; return nb; }); this.setState({ sel: null }); } else if (x == null) { this.updB(b.id, nb => { nb.slots[idx] = 'B'; return nb; }); } else if (res) { this.updB(b.id, nb => { nb.slots[idx] = null; return nb; }); } };
        s.onRemove = e => { e.stopPropagation(); this.updB(b.id, nb => { nb.slots[idx] = null; return nb; }); };
      }
      slots.push(s);
    }
    return { cols: COLS[fmt], slots, label: 'PAGINA ' + (p + 1), align: p % 2 ? 'flex-end' : 'flex-start', radius: p % 2 ? '3px 10px 10px 3px' : '10px 3px 3px 10px' };
  }
  shiftPlan(b, mode) {
    const ids = b.slots; let cand = null;
    const setsIn = [...new Set(ids.filter(isCard).map(i => CARDS[i].set))];
    for (const code of setsIn) { const cs = (BYSET[code] || []); const c = cs.find(x => !ids.includes(x.id)); if (c) { const pred = cs.filter(x => x.num < c.num && ids.includes(x.id)).pop(); const pos = pred ? ids.indexOf(pred.id) + 1 : ids.indexOf(cs.find(x => ids.includes(x.id)).id); cand = { card: c, pos }; break; } }
    if (!cand) return null;
    const pos = cand.pos; let end = ids.length;
    for (let i = pos; i < ids.length; i++) { if (ids[i] == null || (mode === 'buffer' && (ids[i] === 'B' || isBufD(b, ids[i])))) { end = i; break; } }
    const slots = [...ids]; let pages = b.pages;
    if (end >= slots.length) { pages += 2; for (let k = 0; k < 2 * b.fmt; k++) slots.push(null); }
    const moves = []; for (let i = end - 1; i >= pos; i--) moves.push({ from: i, to: i + 1, item: ids[i] });
    for (let i = end; i > pos; i--) slots[i] = ids[i - 1]; slots[pos] = cand.card.id;
    const pg = new Set(); for (let i = pos; i <= end; i++) pg.add(Math.floor(i / b.fmt));
    const moved = {}; moves.forEach(m => { const pf = Math.floor(m.from / b.fmt), pt = Math.floor(m.to / b.fmt); moved[m.to] = pf !== pt ? 'redo' : (m.to % COLS[b.fmt] === 0 ? 'subdirectory_arrow_right' : 'arrow_forward'); });
    return { card: cand.card, pos, end, slots, pages, moves, cardMoves: moves.filter(m => isCard(m.item)), pageList: [...pg].sort((x, y) => x - y), moved, usedBuffer: mode === 'buffer' && (ids[end] === 'B' || isBufD(b, ids[end])) };
  }
  jobFrom(b, plan) {
    const steps = plan.cardMoves.map(m => ({ from: m.from, to: m.to, cardId: m.item })); steps.push({ from: null, to: plan.pos, cardId: plan.card.id });
    return { binderId: b.id, fmt: b.fmt, title: plan.card.names.EN + ' invoegen in ' + b.name, steps, pages: plan.pageList };
  }
  confirmShift(mode) {
    const b = this.curB(); const plan = this.shiftPlan(b, mode); if (!plan) return;
    const job = this.jobFrom(b, plan);
    this.updB(b.id, nb => { const n = { ...nb, slots: plan.slots, pages: plan.pages }; n.slots = syncSlots(n); return n; });
    this.go('moves', { job, done: {} });
  }
  startPageScan(bid, pages, i = 0) {
    this.go('pagescan', { ps: { binderId: bid, pages, i, phase: 'align', done: 0 }, psRes: {}, fixes: {}, fix: null });
  }
  setPs(p) { this.setState(s => ({ ps: { ...s.ps, ...p } })); }
  /** The binder page currently being scanned: its binder, page number and slot indexes. */
  pageScanTarget() {
    const st = this.state; const b = st.binders.find(x => x.id === st.ps.binderId) || st.binders[0]; const p = Math.min(st.ps.pages[st.ps.i] ?? 0, b.pages - 1);
    const expect = i => isCard(b.slots[i]) && tot(st.owned[b.slots[i]]) > 0 ? b.slots[i] : null;
    return { b, p, idxs: range(p * b.fmt, p * b.fmt + b.fmt), expect };
  }
  /** Recognition per slot of the scanned page: { [slotIndex]: { got: cardId | null, conf, cands: [{ id, conf }] } }. */
  pageScanned(res) { this.go('pageresult', { psRes: res, fixes: {}, fix: null }); }
  resultModel() {
    const st = this.state; const { b, p, idxs, expect } = this.pageScanTarget(); const fmt = b.fmt;
    // Compare what the scan read in each slot with the binder plan.
    const det = {}; idxs.forEach(i => { const r = st.psRes[i] || { got: null, conf: 0, cands: [] }; det[i] = { exp: expect(i), got: r.got, conf: r.conf, cands: r.cands, st: 'ok' }; });
    idxs.forEach(i => { const d = det[i]; if (d.got === d.exp) { if (d.got != null && d.conf < 60) d.st = 'doubt'; return; }
      if (d.got == null) { d.st = 'empty'; return; }
      const home = idxs.find(j => j !== i && det[j].exp === d.got); if (home != null) { d.st = 'swap'; d.with = home; return; }
      d.st = d.conf < 60 ? 'doubt' : 'wrong'; });
    Object.entries(st.fixes).forEach(([i, f]) => { if (det[i]) { det[i].got = f.got; det[i].st = 'fixed'; } });
    return { b, p, fmt, idxs, det };
  }
  updDeco(fn) { this.updB(this.state.edId, nb => { const o = nb.deco || EMPTYD; const dd = { bg: Object.assign({}, o.bg), images: o.images.map(i => Object.assign({}, i)), stickers: o.stickers.map(s => Object.assign({}, s)) }; fn(dd, nb); nb.deco = dd; nb.slots = syncSlots(nb); return nb; }); }
  cellAt(e, cols, rows) { const r = e.currentTarget.getBoundingClientRect(); return { col: Math.max(0, Math.min(cols - 1, Math.floor((e.clientX - r.left) / r.width * cols))), row: Math.max(0, Math.min(rows - 1, Math.floor((e.clientY - r.top) / r.height * rows))) }; }
  sizeOf(k, cols, rows) { if (k === 'page') return [cols, rows]; const s = SIZES[k] || [1, 1]; return [Math.min(s[0], cols), Math.min(s[1], rows)]; }
  fitSize(cols, rows) { return this.sizeOf(this.state.decoSize, cols, rows); }
  newId(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1000); }
  activeP() { const b = this.curB(); const es = Math.min(this.state.edSpread, b.pages / 2 - 1); return 2 * es + (this.state.decoPage || 0); }
  freeSpot(b, p, w, h) { const cols = COLS[b.fmt], rows = b.fmt / cols; const d = b.deco || EMPTYD; const busy = (c, r) => isCard(b.slots[p * b.fmt + r * cols + c]) || d.images.some(im => im.page === p && c >= im.col && c < im.col + im.w && r >= im.row && r < im.row + im.h); for (let r = 0; r + h <= rows; r++) for (let c = 0; c + w <= cols; c++) { let ok = true; for (let y = r; y < r + h && ok; y++) for (let x = c; x < c + w; x++) if (busy(x, y)) { ok = false; break; } if (ok) return [c, r]; } return [0, 0]; }
  placeImage(fill, extra) { const b = this.curB(); const cols = COLS[b.fmt], rows = b.fmt / cols; const p = this.activeP(); const sz = extra && extra.w ? [Math.min(extra.w, cols), Math.min(extra.h, rows)] : this.fitSize(cols, rows); const sp = this.freeSpot(b, p, sz[0], sz[1]); const id = this.newId('i'); this.updDeco(dd => { dd.images.push(Object.assign({ x: 50, y: 50, zoom: 1, buffer: false }, extra || {}, { id, page: p, col: sp[0], row: sp[1], w: sz[0], h: sz[1], fill })); }); this.setState({ decoSel: { type: 'img', id } }); }
  dropOnGrid(p, k) { const pl = this.dragPayload; const o = this.state.decoOver; this.dragPayload = null; if (!pl || !o) { this.setState({ decoOver: null }); return; } const b = this.curB(); const cols = COLS[b.fmt];
    if (pl.type === 'img') { const id = this.newId('i'); this.updDeco(dd => { dd.images.push({ id, page: p, col: o.col, row: o.row, w: o.w, h: o.h, fill: pl.fill, x: 50, y: 50, zoom: 1, buffer: false }); }); this.setState({ decoSel: { type: 'img', id }, decoOver: null, decoPage: k }); }
    else if (pl.type === 'card') { const idx = p * b.fmt + o.row * cols + o.col; this.updB(b.id, nb => { nb.slots[idx] = pl.id; return nb; }); this.setState({ decoOver: null }); this.toast(CARDS[pl.id].names.EN + ' geplaatst'); } }
  dropOnPage(e, p, k) { const pl = this.dragPayload; if (!pl || pl.type !== 'stk') return; this.dragPayload = null; const r = e.currentTarget.getBoundingClientRect(); this.addSticker(pl.obj, p, (e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100); this.setState({ decoPage: k }); }
  addSticker(obj, p, x, y) { const id = this.newId('s'); this.updDeco(dd => { dd.stickers.push(Object.assign({ id, page: p, x: x == null ? 50 : x, y: y == null ? 50 : y, rot: Math.round(Math.random() * 16 - 8) }, obj)); }); this.setState({ decoSel: { type: 'stk', id } }); }
  setBg(targets, fill, label) { this.updDeco(dd => { targets.forEach(p => { if (fill === 'none') delete dd.bg[p]; else dd.bg[p] = { fill, label }; }); }); }
  genBgs(b, p) { const ids = range(p * b.fmt, p * b.fmt + b.fmt).map(i => b.slots[i]).filter(isCard).map(i => CARDS[i]); const tc = {}, sc = {}; ids.forEach(c => { tc[c.type] = (tc[c.type] || 0) + 1; sc[c.set] = (sc[c.set] || 0) + 1; }); const ts = Object.keys(tc).sort((a, z) => tc[z] - tc[a]); const t1 = ts[0] || 'grass', t2 = ts[1] || (t1 === 'water' ? 'grass' : 'water'); const c1 = TYPES[t1][1], c2 = TYPES[t2][1]; const a = (c, al) => c.replace(')', ' / ' + al + ')'); const setCode = Object.keys(sc).sort((x, z) => sc[z] - sc[x])[0]; const setName = setCode ? SETS.find(s => s.code === setCode).name : 'Mijn binder';
    return [{ key: 'grad', name: 'Kleurverloop', fill: 'linear-gradient(160deg, ' + c1 + ', ' + c2 + ')' }, { key: 'pix', name: 'Pixelpatroon', fill: 'repeating-linear-gradient(0deg, ' + a(c1, 0.5) + ' 0 4px, transparent 4px 12px), repeating-linear-gradient(90deg, ' + a(c1, 0.5) + ' 0 4px, transparent 4px 12px), linear-gradient(' + a(c2, 0.35) + ', ' + a(c2, 0.35) + ')' }, { key: 'theme', name: TYPES[t1][0] + '-thema', fill: 'repeating-linear-gradient(135deg, ' + a(c1, 0.55) + ' 0 12px, ' + a(c1, 0.2) + ' 12px 24px)' }, { key: 'label', name: 'Tekstvak met setnaam', fill: 'linear-gradient(180deg, ' + a(c2, 0.3) + ', ' + a(c1, 0.6) + ')', label: setName.toUpperCase() }]; }
  applyTemplate(t, name) { const b = this.curB(); const cols = COLS[b.fmt], rows = b.fmt / cols; const p = this.activeP(); const fills = this.genBgs(b, p).map(g => g.fill); this.updDeco(dd => { dd.images = dd.images.filter(i => i.page !== p); if (t === 'full') dd.bg[p] = { fill: fills[0], label: '' }; else tplAreas(t, cols, rows).forEach((ar, i) => dd.images.push(Object.assign({ id: this.newId('i') + i, page: p, fill: t === 'checker' ? fills[i % 2] : (t === 'banner' ? IMGS[2].fill : IMGS[0].fill), x: 50, y: 50, zoom: 1, buffer: t === 'checker' }, ar))); }); this.setState({ decoSel: null }); this.toast('Template ' + name + ' toegepast op pagina ' + (p + 1)); }
  decoDown(e, kind, item, k, sx, sy) { e.stopPropagation(); if (e.button) return; const b = this.curB(); const cols = COLS[b.fmt], rows = b.fmt / cols; const grid = e.currentTarget.closest('[data-grid]'); const page = e.currentTarget.closest('[data-page]'); const gr = grid ? grid.getBoundingClientRect() : null; const pr = page ? page.getBoundingClientRect() : null;
    this.pd = { kind, id: item.id, x0: e.clientX, y0: e.clientY, col: item.col, row: item.row, w: item.w, h: item.h, sx: sx || 1, sy: sy || 1, ix: item.x, iy: item.y, cols, rows, pw: gr ? (gr.width + 8) / cols : 1, ph: gr ? (gr.height + 8) / rows : 1, pgw: pr ? pr.width : 1, pgh: pr ? pr.height : 1, last: '' };
    this.setState({ decoSel: { type: kind === 'stk' ? 'stk' : 'img', id: item.id }, decoPage: k }); }
  onPD(e) { const d = this.pd; if (!d) return; const dx = e.clientX - d.x0, dy = e.clientY - d.y0; const cl = (v, a, z) => Math.max(a, Math.min(z, v)); let upd;
    if (d.kind === 'crop') { const x = cl(d.ix - dx / d.pgw * 100, 0, 100), y = cl(d.iy - dy / d.pgh * 100, 0, 100); this.setState(s => ({ crop: Object.assign({}, s.crop || DEFCROP, { x, y }) })); return; }
    if (d.kind === 'move') upd = { col: cl(d.col + Math.round(dx / d.pw), 0, d.cols - d.w), row: cl(d.row + Math.round(dy / d.ph), 0, d.rows - d.h) };
    else if (d.kind === 'resize') { const dc = Math.round(dx / d.pw), dr = Math.round(dy / d.ph); let col = d.col, w = d.w, row = d.row, h = d.h; if (d.sx < 0) { const nc = cl(d.col + dc, 0, d.col + d.w - 1); w = d.w + d.col - nc; col = nc; } else w = cl(d.w + dc, 1, d.cols - d.col); if (d.sy < 0) { const nr = cl(d.row + dr, 0, d.row + d.h - 1); h = d.h + d.row - nr; row = nr; } else h = cl(d.h + dr, 1, d.rows - d.row); upd = { col, row, w, h }; }
    else if (d.kind === 'stk') upd = { x: cl(d.ix + dx / d.pgw * 100, 3, 97), y: cl(d.iy + dy / d.pgh * 100, 3, 97) };
    const key = JSON.stringify(upd); if (key === d.last) return; d.last = key;
    this.updDeco(dd => { const it = d.kind === 'stk' ? dd.stickers.find(s => s.id === d.id) : dd.images.find(i => i.id === d.id); if (it) Object.assign(it, upd); }); }
  decoVals() {
    const st = this.state; const { owned } = st; const b = this.curB(); const fmt = b.fmt, cols = COLS[fmt], rows = fmt / cols; const d = b.deco || EMPTYD;
    const es = Math.min(st.edSpread, b.pages / 2 - 1); const pages = [2 * es, 2 * es + 1]; const ap = pages[st.decoPage] == null ? pages[0] : pages[st.decoPage];
    const sel = st.decoSel; const G = 8;
    const segBtn = on => ({ bg: on ? 'var(--red)' : 'var(--surface)', fg: on ? '#FFF8EE' : 'var(--ink)' });
    const chip = on => ({ bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)' });
    const posC = (n, k) => '(100% - ' + ((n - 1) * G) + 'px) / ' + n + ' * ' + k + ' + ' + (k * G) + 'px';
    const spanC = (n, k) => '(100% - ' + ((n - 1) * G) + 'px) / ' + n + ' * ' + k + ' + ' + ((k - 1) * G) + 'px';
    const mkPage = (p, k, editable, wm) => {
      const bgv = d.bg[p]; const o = st.decoOver;
      const cells = range(0, fmt).map(j => { const idx = p * fmt + j; const x = b.slots[idx]; const has = isCard(x); const own = has && tot(owned[x]) > 0; const isD = typeof x === 'string' && x.startsWith('D:'); const c = j % cols, r = Math.floor(j / cols); const ov = !!(editable && o && o.p === p && c >= o.col && c < o.col + o.w && r >= o.row && r < o.row + o.h); return { key: idx, hasCard: has, cv: has ? { ...this.cv(CARDS[x], 'EN', !own), dim: !own } : null, border: has || isD ? '0' : '1.5px dashed rgba(106,101,88,.55)', pocket: has || isD ? 'transparent' : 'rgba(255,255,255,.22)', isOver: ov }; });
      const images = d.images.filter(im => im.page === p).map(im => { const on = !!(editable && sel && sel.type === 'img' && sel.id === im.id); const n = im.w * im.h; return { key: im.id, l: posC(cols, im.col), t: posC(rows, im.row), w: spanC(cols, im.w), h: spanC(rows, im.h), fill: im.fill, pos: im.x + '% ' + im.y + '%', zoom: im.zoom, selected: on, outline: on ? '3px solid #9BBC0F' : 'none', cursor: editable ? 'move' : 'default', buffer: !!im.buffer, sizeLabel: im.w + '×' + im.h + ' · ' + n + (n > 1 ? ' SLOTS' : ' SLOT'), onDown: editable ? e => this.decoDown(e, 'move', im, k) : undefined, hTL: e => this.decoDown(e, 'resize', im, k, -1, -1), hTR: e => this.decoDown(e, 'resize', im, k, 1, -1), hBL: e => this.decoDown(e, 'resize', im, k, -1, 1), hBR: e => this.decoDown(e, 'resize', im, k, 1, 1) }; });
      const stickers = d.stickers.filter(s => s.page === p).map(s => { const on = !!(editable && sel && sel.type === 'stk' && sel.id === s.id); return { key: s.id, x: s.x, y: s.y, rot: s.rot || 0, isPixel: s.kind === 'icon', isText: s.kind === 'text', shadow: s.kind === 'icon' ? pixShadow(s.icon, s.color) : 'none', text: s.text || '', bg: s.bg || '#FFFDF6', fg: s.fg || '#1A1C22', selected: on, outline: on ? '2px dashed #306230' : 'none', pe: editable ? 'auto' : 'none', cursor: editable ? 'grab' : 'default', onDown: editable ? e => this.decoDown(e, 'stk', s, k) : undefined, onRemove: e => { e.stopPropagation(); this.updDeco(dd => { dd.stickers = dd.stickers.filter(x => x.id !== s.id); }); this.setState({ decoSel: null }); } }; });
      return { cols, bg: bgv ? bgv.fill : 'none', hasLabel: !!(bgv && bgv.label), label: bgv && bgv.label ? bgv.label : '', radius: p % 2 ? '3px 10px 10px 3px' : '10px 3px 3px 10px', outline: editable && st.decoPage === k ? '3px dashed #9BBC0F' : 'none', align: p % 2 ? 'flex-end' : 'flex-start', num: 'PAGINA ' + (p + 1), watermark: !!wm, cells, images, stickers,
        onPageDown: editable ? () => this.setState({ decoPage: k, decoSel: null }) : undefined,
        onPageDragOver: editable ? e => e.preventDefault() : undefined,
        onPageDrop: editable ? e => { e.preventDefault(); this.dropOnPage(e, p, k); } : undefined,
        onGridDragOver: editable ? e => { const pl = this.dragPayload; if (!pl || pl.type === 'stk') return; e.preventDefault(); const cell = this.cellAt(e, cols, rows); const sz = pl.type === 'img' ? this.fitSize(cols, rows) : [1, 1]; const col = Math.min(cell.col, cols - sz[0]), row = Math.min(cell.row, rows - sz[1]); const oo = this.state.decoOver; if (!oo || oo.p !== p || oo.col !== col || oo.row !== row || oo.w !== sz[0] || oo.h !== sz[1]) this.setState({ decoOver: { p, col, row, w: sz[0], h: sz[1] } }); } : undefined,
        onGridDrop: editable ? e => { const pl = this.dragPayload; if (!pl || pl.type === 'stk') return; e.preventDefault(); e.stopPropagation(); this.dropOnGrid(p, k); } : undefined };
    };
    const sizeKeys = [['1x1', '1 slot'], ['1x2', '1×2 hoog'], ['2x1', '2×1 breed'], ['2x2', '2×2'], ['page', 'Hele pagina']];
    const payload = pl => e => { e.dataTransfer.setData('text/plain', pl.type); e.dataTransfer.effectAllowed = 'copy'; this.dragPayload = pl; };
    const endDrag = () => { this.dragPayload = null; this.setState({ decoOver: null }); };
    const bgTargets = st.bgBoth ? pages : [ap];
    const selImg = sel && sel.type === 'img' ? d.images.find(i => i.id === sel.id) : null;
    const selStk = sel && sel.type === 'stk' ? d.stickers.find(s => s.id === sel.id) : null;
    const spreadIdx = pages.reduce((a, p) => a.concat(range(p * fmt, p * fmt + fmt)), []);
    const empties = spreadIdx.filter(i => b.slots[i] == null);
    const onPage = spreadIdx.map(i => b.slots[i]).filter(isCard).map(i => CARDS[i]);
    const inAny = new Set(st.binders.reduce((a, x) => a.concat(x.slots.filter(isCard)), [])); const inThis = new Set(b.slots.filter(isCard));
    const tc = {}; onPage.forEach(c => { tc[c.type] = (tc[c.type] || 0) + 1; }); const dom = Object.keys(tc).sort((a, z) => tc[z] - tc[a])[0] || 'grass';
    const decoOn = st.screen === 'editor' && st.edMode === 'deco';
    const cats = !decoOn ? [] : [['Zelfde evolutielijn', CARDS.filter(c => onPage.some(pc => pc.set === c.set && pc.type === c.type && Math.abs(pc.num - c.num) <= 2))], ['Zelfde illustrator', CARDS.filter(c => onPage.some(pc => pc.id !== c.id && pc.id % 7 === c.id % 7))], ['Past bij kleuren', CARDS.filter(c => c.type === dom)], ['Al in bezit, nog niet in een binder', CARDS.filter(c => tot(owned[c.id]) && !inAny.has(c.id))], ['wish', CARDS.filter(c => !tot(owned[c.id]))]].map(([r, l]) => [r, l.filter(c => !inThis.has(c.id))]);
    const picks = []; const used = new Set();
    for (let round = 0; round < 4 && picks.length < 6; round++) cats.forEach(([r, l]) => { if (picks.length >= 6) return; const c = l.find(x => !used.has(x.id)); if (c) { used.add(c.id); picks.push({ c, reason: r === 'wish' ? 'Op je wantlist · ' + eur(c.trend) : r }); } });
    const sugCards = picks.slice(0, Math.min(6, empties.length)).map((pk, i) => { const slot = empties[i]; const c = pk.c; const own = tot(owned[c.id]) > 0; return { key: c.id, cv: this.cv(c, 'EN', !own), name: c.names.EN, meta: c.set + ' ' + pad(c.num), reason: pk.reason, where: '→ pagina ' + (Math.floor(slot / fmt) + 1) + ', slot ' + (slot % fmt + 1), place: () => { this.updB(b.id, nb => { nb.slots[slot] = c.id; return nb; }); this.toast(c.names.EN + ' geplaatst op pagina ' + (Math.floor(slot / fmt) + 1)); }, onDragStart: payload({ type: 'card', id: c.id }), onDragEnd: endDrag }; });
    const cr = st.crop || DEFCROP; const setCrop = p => this.setState(s => ({ crop: Object.assign({}, s.crop || DEFCROP, p) }));
    const paperMM = st.paper === 'A4' ? [210, 297] : [215.9, 279.4]; const bl = st.bleed ? 3 : 0; const pw = 63 + 2 * bl, ph = 88 + 2 * bl; const gp = st.bleed ? 2 : 0, mg = 5;
    const pcn = Math.max(1, Math.floor((paperMM[0] - 2 * mg + gp) / (pw + gp))), prn = Math.max(1, Math.floor((paperMM[1] - 2 * mg + gp) / (ph + gp))); const per = pcn * prn;
    const ox = (paperMM[0] - (pcn * pw + (pcn - 1) * gp)) / 2, oy = (paperMM[1] - (prn * ph + (prn - 1) * gp)) / 2;
    const pieces = []; b.slots.forEach((x, i) => { if (typeof x === 'string' && x.startsWith('D:')) { const pz = decoPiece(b, x, i % fmt); pieces.push({ fill: pz.decoFill, size: pz.decoSize, pos: pz.decoPos, label: 'P' + (Math.floor(i / fmt) + 1) + ' · S' + (i % fmt + 1) }); } });
    const sheets = []; for (let s = 0; s < pieces.length; s += per) sheets.push(pieces.slice(s, s + per));
    return {
      isCardsMode: st.edMode !== 'deco', isDecoMode: st.edMode === 'deco', modeCards: segBtn(st.edMode !== 'deco'), modeDeco: segBtn(st.edMode === 'deco'),
      modeHint: st.edMode === 'deco' ? 'Maak van je pagina een display: afbeeldingen tussen de kaarten, bewuste lege ruimte, stickers.' : 'Plan welke kaart in welk slot komt.',
      setCardsMode: () => this.setState({ edMode: 'cards', decoSel: null }), setDecoMode: () => this.setState({ edMode: 'deco', sel: null }),
      dLeft: mkPage(pages[0], 0, true), dRight: mkPage(pages[1], 1, true),
      decoSpreadLabel: 'PAGINA ' + (pages[0] + 1) + '–' + (pages[1] + 1) + ' / ' + b.pages, activePageLabel: 'Actief: pagina ' + (ap + 1) + ' · klik een afbeelding of sticker om te bewerken',
      decoTabs: [['images', 'Afbeeldingen', 'image'], ['bgs', 'Achtergronden', 'wallpaper'], ['stickers', 'Stickers', 'star'], ['templates', 'Templates', 'dashboard'], ['suggest', 'Suggesties', 'auto_awesome']].map(([k, l, icon]) => ({ key: k, label: l, icon, ...chip(st.decoTab === k), select: () => this.setState({ decoTab: k }) })),
      tabImages: st.decoTab === 'images', tabBgs: st.decoTab === 'bgs', tabStickers: st.decoTab === 'stickers', tabTemplates: st.decoTab === 'templates', tabSuggest: st.decoTab === 'suggest',
      sizeOpts: sizeKeys.map(([k, l]) => ({ key: k, label: l, ...chip(st.decoSize === k), select: () => this.setState({ decoSize: k }) })),
      imgThumbs: IMGS.concat(st.uploads || []).map(im => ({ key: im.id, name: im.name, fill: im.fill, onDragStart: payload({ type: 'img', fill: im.fill }), onDragEnd: endDrag, onClick: () => this.placeImage(im.fill) })),
      onUpload: e => { const f = e.target.files && e.target.files[0]; if (!f) return; const url = URL.createObjectURL(f); const fill = 'url("' + url + '")'; const sz = this.fitSize(cols, rows); this.setState(s => ({ uploads: (s.uploads || []).concat([{ id: this.newId('u'), name: f.name.slice(0, 18), fill }]) })); this.go('crop', { crop: { fill, name: f.name, w: sz[0], h: sz[1], x: 50, y: 50, zoom: 1 } }); e.target.value = ''; },
      sampleCrop: () => { const sz = this.fitSize(cols, rows); this.go('crop', { crop: { fill: IMGS[7].fill, name: 'Voorbeeldfoto.jpg', w: sz[0], h: sz[1], x: 50, y: 50, zoom: 1 } }); },
      bgBoth: chip(st.bgBoth), toggleBgBoth: () => this.setState(s => ({ bgBoth: !s.bgBoth })),
      bgThumbs: BGS.map(g => ({ key: g.id, name: g.name, fill: g.fill, apply: () => this.setBg(bgTargets, g.fill, '') })),
      sugBgs: this.genBgs(b, ap).map(g => ({ key: g.key, name: g.name, fill: g.fill, label: g.label || '', hasLabel: !!g.label, apply: () => this.setBg(bgTargets, g.fill, g.label || '') })),
      stkIcons: STK_ICONS.map(([icon, color], i) => ({ key: i, shadow: pixShadow(icon, color), onDragStart: payload({ type: 'stk', obj: { kind: 'icon', icon, color } }), onDragEnd: endDrag, onClick: () => this.addSticker({ kind: 'icon', icon, color }, ap) })),
      stkTexts: STK_TEXT.map(([text, bg, fg], i) => ({ key: i, text, bg, fg, onDragStart: payload({ type: 'stk', obj: { kind: 'text', text, bg, fg } }), onDragEnd: endDrag, onClick: () => this.addSticker({ kind: 'text', text, bg, fg }, ap) })),
      stkText: st.stkText, onStkText: e => this.setState({ stkText: e.target.value }),
      addCustomStk: () => { const t = (this.state.stkText || '').trim(); if (!t) return; this.addSticker({ kind: 'text', text: t.toUpperCase().slice(0, 20), bg: '#FFFDF6', fg: '#1A1C22' }, ap); this.setState({ stkText: '' }); },
      fmtLabel: fmt + '-pocket (' + cols + '×' + rows + ')',
      tpls: TEMPLATES.map(([key, name]) => { const areas = tplAreas(key, cols, rows); return { key, name, cols, frameBg: key === 'full' ? IMGS[1].fill : 'var(--page)', cells: range(0, fmt).map(j => { const c = j % cols, r = Math.floor(j / cols); const inA = areas.some(a => c >= a.col && c < a.col + a.w && r >= a.row && r < a.row + a.h); return { key: j, bg: inA ? '#9BBC0F' : (key === 'full' ? 'rgba(255,253,246,.85)' : 'var(--soft)'), bd: inA ? '#306230' : 'var(--line)' }; }), apply: () => this.applyTemplate(key, name) }; }),
      sugCards, noEmpties: !empties.length,
      hasImgSel: !!selImg, hasStkSel: !!selStk, noDecoSel: !selImg && !selStk,
      selSizeOpts: sizeKeys.map(([k, l]) => { const sz = this.sizeOf(k, cols, rows); return { key: k, label: l, ...chip(!!selImg && selImg.w === sz[0] && selImg.h === sz[1]), select: () => this.updDeco(dd => { const im = dd.images.find(i => sel && i.id === sel.id); if (!im) return; im.w = sz[0]; im.h = sz[1]; im.col = Math.min(im.col, cols - sz[0]); im.row = Math.min(im.row, rows - sz[1]); }) }; }),
      selBuf: chip(!!(selImg && selImg.buffer)),
      toggleSelBuf: () => this.updDeco(dd => { const im = dd.images.find(i => sel && i.id === sel.id); if (im) im.buffer = !im.buffer; }),
      cropSel: () => selImg && this.go('crop', { crop: { editId: selImg.id, fill: selImg.fill, name: 'Geplaatste afbeelding', w: selImg.w, h: selImg.h, x: selImg.x, y: selImg.y, zoom: selImg.zoom } }),
      removeSel: () => { this.updDeco(dd => { if (selImg) dd.images = dd.images.filter(i => i.id !== selImg.id); if (selStk) dd.stickers = dd.stickers.filter(s => s.id !== selStk.id); }); this.setState({ decoSel: null }); },
      rotL: () => this.updDeco(dd => { const s = dd.stickers.find(x => sel && x.id === sel.id); if (s) s.rot = (s.rot || 0) - 15; }),
      rotR: () => this.updDeco(dd => { const s = dd.stickers.find(x => sel && x.id === sel.id); if (s) s.rot = (s.rot || 0) + 15; }),
      goPrint: () => this.go('print'), goEditorDeco: () => this.go('editor', { edMode: 'deco' }), isPrint: st.screen === 'print', isCrop: st.screen === 'crop',
      cropv: { fill: cr.fill, name: cr.name, aspect: (cr.w * 63 + (cr.w - 1) * 6) + ' / ' + (cr.h * 88 + (cr.h - 1) * 6), maxW: Math.min(620, 230 * cr.w) + 'px', maxH: Math.round(Math.min(620, 230 * cr.w) * (cr.h * 88 + (cr.h - 1) * 6) / (cr.w * 63 + (cr.w - 1) * 6)) + 'px', cols: cr.w, rows: cr.h, pos: cr.x + '% ' + cr.y + '%', zoom: cr.zoom, zoomVal: Math.round(cr.zoom * 100), target: 'PAGINA ' + (ap + 1) + ' · ' + cr.w + '×' + cr.h + ' SLOTS', title: cr.editId ? 'Uitsnede aanpassen' : 'Plaats je afbeelding over de slots' },
      cropCells: range(0, cr.w * cr.h).map(i => ({ key: i })),
      cropSizes: sizeKeys.map(([k, l]) => { const sz = this.sizeOf(k, cols, rows); return { key: k, label: l, ...chip(cr.w === sz[0] && cr.h === sz[1]), select: () => setCrop({ w: sz[0], h: sz[1] }) }; }),
      onCropZoom: e => setCrop({ zoom: Number(e.target.value) / 100 }),
      cropDown: e => { const r = e.currentTarget.getBoundingClientRect(); const c0 = this.state.crop || DEFCROP; this.pd = { kind: 'crop', x0: e.clientX, y0: e.clientY, ix: c0.x, iy: c0.y, pgw: r.width, pgh: r.height, last: '' }; },
      cropReset: () => setCrop({ x: 50, y: 50, zoom: 1 }),
      applyCrop: () => { const c0 = this.state.crop || DEFCROP; this.go('editor', { edMode: 'deco' }); if (c0.editId) this.updDeco(dd => { const im = dd.images.find(i => i.id === c0.editId); if (im) { im.w = Math.min(c0.w, cols); im.h = Math.min(c0.h, rows); im.col = Math.min(im.col, cols - im.w); im.row = Math.min(im.row, rows - im.h); im.x = c0.x; im.y = c0.y; im.zoom = c0.zoom; } }); else this.placeImage(c0.fill, { w: c0.w, h: c0.h, x: c0.x, y: c0.y, zoom: c0.zoom }); this.toast('Afbeelding geplaatst op pagina ' + (ap + 1)); },
      cancelCrop: () => this.go('editor', { edMode: 'deco' }),
      printSheets: sheets.map((arr, si) => ({ key: si, label: 'VEL ' + (si + 1) + ' / ' + sheets.length + ' · ' + (st.paper === 'A4' ? 'A4' : 'LETTER'), pieces: arr.map((q, i) => { const c = i % pcn, r = Math.floor(i / pcn); return { key: i, l: (ox + c * (pw + gp)) / paperMM[0] * 100, t: (oy + r * (ph + gp)) / paperMM[1] * 100, w: pw / paperMM[0] * 100, h: ph / paperMM[1] * 100, fill: q.fill, size: q.size, pos: q.pos, inset: (bl / ph * 100) + '% ' + (bl / pw * 100) + '%', tick: st.bleed ? 1 : 0, label: q.label }; }) })),
      pr: { aspect: paperMM[0] + ' / ' + paperMM[1], info: pieces.length + ' STUKKEN · ' + per + ' PER VEL · ' + sheets.length + (sheets.length === 1 ? ' VEL' : ' VELLEN'), bleedLabel: st.bleed ? 'Met overloop: 3 mm extra beeld rondom, zodat er na het snijden geen witte randjes ontstaan.' : 'Zonder overloop: de stukken liggen tegen elkaar en delen een snijlijn.' },
      noPieces: !pieces.length,
      paperOpts: [['A4', 'A4'], ['Letter', 'Letter']].map(([k, l]) => ({ key: k, label: l, ...segBtn(st.paper === k), select: () => this.setState({ paper: k }) })),
      toggleBleed: () => this.setState(s => ({ bleed: !s.bleed })), bleedTrack: st.bleed ? '#9BBC0F' : 'var(--soft)', bleedKnob: st.bleed ? '22px' : '2px',
      downloadPdf: () => this.toast('Printvel (PDF) wordt gedownload · ' + (st.paper === 'A4' ? 'A4' : 'Letter')),
      hasShare: !!st.share, openShare: () => this.setState({ share: true, decoSel: null }), closeShare: () => this.setState({ share: false }),
      shareLeft: mkPage(pages[0], 0, false, false), shareRight: mkPage(pages[1], 1, false, true),
      downloadPng: () => { this.setState({ share: false }); this.toast('Pagina ' + (pages[0] + 1) + '–' + (pages[1] + 1) + ' opgeslagen als PNG'); },
    };
  }
  newSugs(b) { if (!b.recipe || !b.suggestOn) return []; const r = b.recipe; const inScope = c => r.type === 'dex' ? (c.sp >= r.from && c.sp <= r.to) : r.type === 'type' ? SP[c.sp].type === r.ptype : r.type === 'illus' ? c.illus === r.illus : r.type === 'master' ? c.set === r.set : r.type === 'single' ? c.sp === r.sp : false; return CARDS.filter(c => c.isNew && inScope(c) && !b.slots.includes(c.id) && !(b.dismissed || []).includes(c.id)); }
  createFromRecipe() { const r = this.state.rc; const res = buildRecipe(r, this.state.owned); const t = RECIPES.find(x => x[0] === r.type); const id = 'b' + Date.now(); const name = (r.name || '').trim() || autoName(r);
    this.setState(s => ({ binders: s.binders.concat([{ id, name, fmt: r.fmt, pages: res.pages, cover: t[4] === '#FFFDF6' ? '#2B2E36' : t[4], slots: res.slots, warn: res.warn, recipe: Object.assign({}, r), suggestOn: r.type !== 'empty', dismissed: [], kind: r.type === 'empty' ? 'free' : 'recipe', desc: r.type === 'empty' ? 'Vrije indeling' : recipeLabel(r).split(' · ').slice(1, 3).join(' · ').toLowerCase(), deco: { bg: {}, images: [], stickers: [] } }]) }));
    this.go('editor', { edId: id, edSpread: 0, edMode: r.type === 'empty' ? 'deco' : 'cards' }); this.toast(name + ' aangemaakt · ' + res.n + ' kaarten'); }
  parseRc() {
    const t = (this.state.rcText || '').toLowerCase(); if (!t.trim()) return; const p = {}; let type = null;
    const reg = REGIONS.find(x => t.includes(x[1].toLowerCase())); if (reg) { type = 'dex'; Object.assign(p, { region: reg[0], custom: false, from: reg[2], to: reg[3] }); }
    const m = t.match(/#?(\d{1,4})\s*[-–]\s*#?(\d{1,4})/); if (m) { type = 'dex'; Object.assign(p, { custom: true, from: +m[1], to: +m[2] }); }
    const il = ILLUS.find(n => t.includes(n.toLowerCase()) || t.includes(n.split(' ')[1].toLowerCase())); if (il && !type) { type = 'illus'; p.illus = il; }
    const ty = Object.entries(TYPES).find(([k, v]) => t.includes(v[0].toLowerCase())); if (ty && !type) { type = 'type'; p.ptype = ty[0]; }
    const se = SETS.find(s => t.includes(s.name.toLowerCase())); if (se && (!type || t.includes('master'))) { type = 'master'; p.set = se.code; }
    if (!type) { for (let d = 1; d <= 1025; d++) if (t.includes(SP[d].name.EN.toLowerCase())) { type = 'single'; p.sp = d; break; } }
    if (/(één|een|1) (per|kaart)/.test(t)) p.per = 'one'; if (/alle versies|elke versie/.test(t)) p.per = 'all';
    if (/full ?art|illustration|illustratie/.test(t)) p.pref = 'fullart'; else if (/goedkoo|al heb|in bezit/.test(t)) p.pref = 'owned'; else if (/oudste|origineel/.test(t)) p.pref = 'oldest'; else if (/waardevol|duurste/.test(t)) p.pref = 'value';
    if (/vorm/.test(t)) p.forms = true; if (/japans/.test(t)) p.lang = 'JA'; else if (/duits/.test(t)) p.lang = 'DE'; else if (/chinees/.test(t)) p.lang = 'ZH';
    if (/leeg|vrij/.test(t) && !type) type = 'empty';
    if (!type) { this.toast('Geen recept herkend · kies hieronder een tegel'); return; }
    const nr = Object.assign({}, this.state.rc, { type, name: '' }, p); const steps = RSTEPS[type].filter(k => k !== 'pref' || nr.per === 'one');
    this.setState({ rc: nr, rcStep: steps.length }); this.toast('Recept ingevuld · ' + recipeLabel(nr));
  }
  recipeVals() {
    const st = this.state; const { owned } = st; const r = st.rc; const setR = p => this.setState(s => ({ rc: Object.assign({}, s.rc, p) }));
    const segBtn = on => ({ bg: on ? 'var(--red)' : 'var(--surface)', fg: on ? '#FFF8EE' : 'var(--ink)' });
    const chip = on => ({ bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)' });
    const choice = on => ({ bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)', sh: on ? '3px 3px 0 var(--line)' : 'none' });
    const steps = RSTEPS[r.type].filter(k => k !== 'pref' || r.per === 'one'); const step = Math.min(st.rcStep, steps.length); const cur = steps[Math.max(0, step - 1)];
    const onR = st.screen === 'recipe' && step > 0;
    const res = onR ? buildRecipe(r, owned) : { fmt: r.fmt, pages: 2, slots: Array(2 * r.fmt).fill(null), warn: {}, n: 0, ownedN: 0, cost: 0, formsN: 0 };
    const lay = { fmt: r.fmt, pages: res.pages, slots: res.slots, warn: res.warn, showWarn: true };
    const pokeNoun = (r.type === 'dex' || r.type === 'type' || r.type === 'illus') && r.per === 'one';
    const main = r.type === 'empty' ? 'Lege binder' : pokeNoun ? (res.n - res.formsN) + ' Pokémon' + (res.formsN ? ' + ' + res.formsN + ' vormen' : '') : res.n + ' kaarten';
    const tile = RECIPES.find(x => x[0] === r.type);
    const warnN = Object.keys(res.warn).length; const firstWarn = warnN ? res.warn[Object.keys(res.warn)[0]] : '';
    const spq = (st.rcSpQ || '').trim().toLowerCase(); const spList = []; for (let d = 1; d <= 1025 && spList.length < 10; d++) { if (!spq || SP[d].name.EN.toLowerCase().includes(spq) || String(d) === spq.replace('#', '')) spList.push(d); } if (!spList.includes(r.sp)) spList.unshift(r.sp);
    const eb = this.curB(); const ns = this.newSugs(eb); const ebWarn = Object.keys(eb.warn || {}).length;
    const vsx = st.verSheet; let verList = [], verHead = { title: '', sub: '', warn: '', hasWarn: false };
    if (vsx && isCard(eb.slots[vsx.idx])) { const curC = CARDS[eb.slots[vsx.idx]]; const w = (eb.warn && eb.warn[vsx.idx]) || ''; verHead = { title: '#' + pad(curC.sp) + ' · ' + SP[curC.sp].name.EN, sub: 'PAGINA ' + (Math.floor(vsx.idx / eb.fmt) + 1) + ', SLOT ' + (vsx.idx % eb.fmt + 1), warn: w, hasWarn: !!w };
      verList = (BYSP[curC.sp] || []).slice().sort((a, b) => a.year - b.year || a.id - b.id).map(c => { const n = tot(owned[c.id]); const isCur = c.id === curC.id; return { key: c.id, cv: this.cv(c, (eb.recipe && eb.recipe.lang) || 'EN', !n), set: c.setName + ' · ' + c.year, variant: VARL[c.variant] + (c.isNew ? ' · nieuw' : ''), price: eur(c.trend), langs: c.avail.join(' '), owned: n ? 'In bezit ×' + n : 'Niet in bezit', ownBg: n ? '#306230' : 'var(--soft)', ownFg: n ? '#F7F3E8' : 'var(--ink)', ownIcon: n ? 'check' : 'close', bd: isCur ? 'var(--red)' : 'var(--line)', sh: isCur ? '4px 4px 0 var(--red)' : '3px 3px 0 var(--line)', btn: isCur ? 'Huidige versie' : 'Kies deze', btnBg: isCur ? 'var(--bg)' : 'var(--red)', btnFg: isCur ? 'var(--muted)' : '#FFF8EE', choose: () => { if (isCur) return; this.updB(eb.id, nb => { nb.slots[vsx.idx] = c.id; if (nb.warn) { nb.warn = Object.assign({}, nb.warn); delete nb.warn[vsx.idx]; } return nb; }); this.setState({ verSheet: null }); this.toast(SP[c.sp].name.EN + ': ' + c.setName + ' gekozen'); } }; }); }
    return {
      isRecipe: st.screen === 'recipe', rcChoose: step === 0, rcConfig: step > 0,
      rcTiles: RECIPES.map(([k, l, icon, desc, bg, fg]) => ({ key: k, label: l, desc, bg, fg, shadow: pixShadowU(icon, fg, 6), select: () => this.setState(s => ({ rc: Object.assign({}, s.rc, { type: k, name: '' }), rcStep: 1, rcMore: false })) })),
      rcText: st.rcText, onRcText: e => this.setState({ rcText: e.target.value }), onRcKey: e => { if (e.key === 'Enter') this.parseRc(); }, parseRc: () => this.parseRc(),
      goManual: () => this.go('create'), rcBackTiles: () => this.setState({ rcStep: 0 }), rcTitle: tile[1], rcCover: tile[4],
      rcSteps: steps.map((k, i) => ({ key: k, label: (i + 1) + ' · ' + STEPT[k][0].toUpperCase(), ...chip(i + 1 === step), select: () => this.setState({ rcStep: i + 1 }) })),
      rcStepLabel: 'STAP ' + step + ' / ' + steps.length, rcQ: STEPT[cur][1],
      qRegion: cur === 'region', qPer: cur === 'per', qPref: cur === 'pref', qSet: cur === 'set', qOrder: cur === 'order', qSpecies: cur === 'species', qIllus: cur === 'illus', qPtype: cur === 'ptype', qPages: cur === 'pages',
      regionChips: REGIONS.map(([k, l, a, z]) => ({ key: k, label: l, sub: '#' + pad(a) + '–#' + pad(z), ...chip(!r.custom && r.region === k), select: () => setR({ region: k, custom: false, from: a, to: z }) })).concat([{ key: 'custom', label: 'Eigen bereik', sub: '#' + pad(r.from) + '–#' + pad(r.to), ...chip(r.custom), select: () => setR({ custom: true }) }]),
      rcCustom: r.custom, rcFrom: r.from, rcTo: r.to,
      onRcFrom: e => setR({ from: Math.max(1, Math.min(1025, parseInt(e.target.value, 10) || 1)) }), onRcTo: e => setR({ to: Math.max(1, Math.min(1025, parseInt(e.target.value, 10) || 1)) }),
      toggleForms: () => setR({ forms: !r.forms }), formsTrack: r.forms ? '#9BBC0F' : 'var(--soft)', formsKnob: r.forms ? '22px' : '2px',
      perOpts: [['one', 'Eén', 'Eén kaart per Pokémon, zoals een dex.', 'looks_one'], ['all', 'Alle versies', 'Elke kaart van elke Pokémon naast elkaar.', 'layers']].map(([k, l, d, icon]) => ({ key: k, label: l, desc: d, icon, ...choice(r.per === k), select: () => setR({ per: k }) })),
      prefOpts: PREFS.map(([k, l, d, icon]) => ({ key: k, label: l, desc: d, icon, ...choice(r.pref === k), select: () => setR({ pref: k }) })),
      rcPrefIsSet: r.pref === 'set', prefSetChips: SETS.map(s => ({ key: s.code, label: s.name, ...chip(r.prefSet === s.code), select: () => setR({ prefSet: s.code }) })),
      setChipsR: SETS.map(s => ({ key: s.code, label: s.name + ' · ' + s.n, ...chip(r.set === s.code), select: () => setR({ set: s.code }) })),
      orderOpts: (r.type === 'master' ? [['num', 'Setnummer'], ['type', 'Per type'], ['value', 'Waarde']] : [['oldest', 'Oudste eerst'], ['value', 'Meest waardevol'], ['owned', 'In bezit eerst']]).map(([k, l]) => ({ key: k, label: l, ...segBtn(r.order === k), select: () => setR({ order: k }) })),
      rcSpQ: st.rcSpQ, onRcSpQ: e => this.setState({ rcSpQ: e.target.value }),
      spChips: spList.map(d => ({ key: d, label: '#' + pad(d) + ' ' + SP[d].name.EN + ' · ' + (BYSP[d] || []).length + ' versies', ...chip(r.sp === d), select: () => setR({ sp: d }) })),
      illusChips: ILLUS.filter((n, i) => i < 30 || n === r.illus).map(n => ({ key: n, label: n + ' · ' + (ILLUS_N[n] || 0), ...chip(r.illus === n), select: () => setR({ illus: n }) })),
      ptypeChips: Object.entries(TYPES).map(([k, v]) => ({ key: k, label: v[0], color: v[1], ...chip(r.ptype === k), select: () => setR({ ptype: k }) })),
      rcPageOpts: [2, 4, 6, 10].map(n => ({ key: n, label: n + ' pag.', ...segBtn(r.pages === n), select: () => setR({ pages: n }) })),
      rcSummary: main + ' · ' + res.pages + " pagina's" + (r.type === 'empty' ? '' : ' · ' + res.ownedN + ' in bezit · nog nodig ± € ' + Math.round(res.cost)),
      rcLabel: recipeLabel(r), rcWarnText: r.type === 'empty' ? 'Lege pagina\'s · opent in de decoratiemodus' : warnN ? warnN + ' slots met alternatief · ' + firstWarn : 'Elke regel vond een passende kaart',
      rcLeft: this.pageModel(lay, 0, false), rcRight: this.pageModel(lay, 1, false),
      rcMore: st.rcMore, toggleRcMore: () => this.setState(s => ({ rcMore: !s.rcMore })), rcMoreIcon: st.rcMore ? 'expand_less' : 'expand_more',
      rcName: r.name || autoName(r), onRcName: e => setR({ name: e.target.value }),
      rcLangOpts: LANGS.map(l => ({ key: l, label: l, ...segBtn(r.lang === l), select: () => setR({ lang: l }) })),
      rcFmtOpts: [4, 9, 12, 16].map(n => ({ key: n, label: n + '-pocket', ...segBtn(r.fmt === n), select: () => setR({ fmt: n }) })),
      rcSortOpts: [['dex', 'Dex-nr.'], ['set', 'Set'], ['value', 'Waarde'], ['name', 'Naam']].map(([k, l]) => ({ key: k, label: l, ...segBtn(r.sort === k), select: () => setR({ sort: k }) })),
      rcBufOpts: [[0, 'Geen'], [1, '1 rij'], [2, '2 rijen']].map(([k, l]) => ({ key: k, label: l, ...segBtn(r.buffer === k), select: () => setR({ buffer: k }) })),
      rcPrev: () => this.setState({ rcStep: Math.max(0, step - 1) }), rcPrevLabel: step > 1 ? 'Vorige' : 'Recepten',
      rcNext: () => step < steps.length ? this.setState({ rcStep: step + 1 }) : this.createFromRecipe(), rcNextLabel: step < steps.length ? 'Volgende' : 'Binder maken', rcNextIcon: step < steps.length ? 'arrow_forward' : 'auto_awesome',
      hasRecipe: !!(eb.recipe && eb.kind === 'recipe'),
      rcCard: { shadow: pixShadowU((RECIPES.find(x => eb.recipe && x[0] === eb.recipe.type) || RECIPES[0])[2], '#0F380F', 4), label: eb.recipe ? recipeLabel(eb.recipe) : '', stats: eb.slots.filter(isCard).length + ' kaarten · ' + (ebWarn ? ebWarn + ' slots met alternatief (oranje !)' : 'alle regels gevonden'), hasNew: ns.length > 0, newCount: ns.length, newText: ns.length + (ns.length === 1 ? ' nieuwe kaart past' : ' nieuwe kaarten passen') + ' bij je ' + (eb.recipe ? autoName(eb.recipe) : '') + '-binder' },
      toggleSuggest: () => this.updB(eb.id, nb => { nb.suggestOn = !nb.suggestOn; return nb; }), sgTrack: eb.suggestOn ? '#9BBC0F' : 'var(--soft)', sgKnob: eb.suggestOn ? '22px' : '2px',
      openNewSug: () => this.setState({ newSheet: true }), closeNewSheet: () => this.setState({ newSheet: false }), hasNewSheet: !!st.newSheet && ns.length > 0,
      newSugList: ns.map(c => { const slot = eb.slots.findIndex(x => isCard(x) && CARDS[x].sp === c.sp && CARDS[x].variant !== 'form'); const curC = slot >= 0 ? CARDS[eb.slots[slot]] : null; return { key: c.id, cv: this.cv(c, 'EN', !tot(owned[c.id])), name: '#' + pad(c.sp) + ' · ' + c.names.EN, meta: c.setName + ' · ' + VARL[c.variant] + ' · ' + eur(c.trend), reason: curC ? 'Nu in je binder: ' + curC.setName + ' (' + VARL[curC.variant] + ')' : 'Nog niet in je binder', actionLabel: curC ? 'Vervang huidige' : 'Toevoegen',
        accept: () => { this.updB(eb.id, nb => { if (slot >= 0) { nb.slots[slot] = c.id; if (nb.warn) { nb.warn = Object.assign({}, nb.warn); delete nb.warn[slot]; } } else { let i = nb.slots.findIndex(x => x == null || x === 'B'); if (i < 0) { i = nb.slots.length; for (let k = 0; k < 2 * nb.fmt; k++) nb.slots.push(null); nb.pages += 2; } nb.slots[i] = c.id; } return nb; }); this.toast(c.names.EN + ' (' + c.setName + ') in je binder gezet'); },
        dismiss: () => this.updB(eb.id, nb => { nb.dismissed = (nb.dismissed || []).concat([c.id]); return nb; }) }; }),
      hasVerSheet: verList.length > 0, verHead, verList, closeVer: () => this.setState({ verSheet: null }),
    };
  }
  valueVals() {
    const st = this.state; const { owned } = st; const own = CARDS.filter(c => tot(owned[c.id]) > 0);
    const V = d => own.reduce((a, c) => a + tot(owned[c.id]) * priceAt(c, d), 0);
    const v0 = V(0), v7 = V(7); const wk = (v0 - v7) / (v7 || 1) * 100;
    const bars = vals => { const mn = Math.min(...vals), mx = Math.max(...vals); return vals.map((v, i) => ({ key: i, h: Math.round(12 + 88 * (v - mn) / ((mx - mn) || 1)), bg: i === vals.length - 1 ? '#0F380F' : '#306230' })); };
    const R = st.valRange; const ds = R === 'week' ? range(0, 7).map(i => 6 - i) : R === 'month' ? range(0, 30).map(i => 29 - i) : range(0, 52).map(i => (51 - i) * 7);
    const vs = ds.map(V); const rc = (vs[vs.length - 1] - vs[0]) / (vs[0] || 1) * 100;
    const withChg = own.map(c => ({ c, chg: priceInfo(c).chg }));
    const mover = ({ c, chg }) => ({ key: c.id, cv: this.cv(c, 'EN'), name: c.names.EN, meta: c.set + ' ' + pad(c.num), price: eur(c.trend), chg: pctf(chg), up: chg >= 0, down: chg < 0, ...chgStyle(chg), open: () => this.openDetail(c.id) });
    const hp = items => { const mx = Math.max(...items.map(i => i.v), 0.01); return items.map(i => { const n = i.v > 0 ? Math.max(1, Math.round(i.v / mx * 20)) : 0; return { key: i.key, label: i.label, value: eur(i.v), segs: range(0, 20).map(k => ({ key: k, bg: k < n ? '#9BBC0F' : '#3A3E47' })) }; }); };
    const dc = CARDS[st.detailId]; const dp = priceInfo(dc); const dn = tot(owned[dc.id]);
    const missC = CARDS.filter(c => !tot(owned[c.id]) && (!st.collSet || c.set === st.collSet)); const setNm = st.collSet ? SETS.find(s => s.code === st.collSet).name : '';
    const eb = this.curB(); const setsIn = [...new Set(eb.slots.filter(isCard).map(i => CARDS[i].set))];
    return {
      isValue: st.screen === 'value', goValue: () => this.go('value'), priceSource: 'Prijzen via Cardmarket · bijgewerkt op ' + UPDATED,
      vTotal: eur(v0), vCount: own.reduce((a, c) => a + tot(owned[c.id]), 0) + ' KAARTEN · ' + own.length + ' UNIEK',
      vc: { chg: pctf(wk), up: wk >= 0, down: wk < 0, ...chgStyle(wk) }, vcl: { chg: pctf(wk), up: wk >= 0, down: wk < 0, ...chgStyle(wk, true) },
      monthBars: bars(range(0, 30).map(i => V(29 - i))), vBars: bars(vs),
      vTabs: [['week', 'WEEK'], ['month', 'MAAND'], ['year', 'JAAR']].map(([k, l]) => ({ key: k, label: l, bg: R === k ? '#0F380F' : 'transparent', fg: R === k ? '#9BBC0F' : '#0F380F', select: () => this.setState({ valRange: k }) })),
      vRange: { start: R === 'week' ? '7 DAGEN GELEDEN' : R === 'month' ? '30 DAGEN GELEDEN' : '52 WEKEN GELEDEN', chg: pctf(rc) + ' IN DEZE PERIODE' },
      top10: [...own].sort((a, b) => b.trend - a.trend).slice(0, 10).map((c, i) => ({ key: c.id, rank: String(i + 1).padStart(2, '0'), cv: this.cv(c, 'EN'), name: c.names.EN, meta: c.setName + ' · ' + c.set + ' ' + pad(c.num), langs: LANGS.filter(l => owned[c.id][l]).join(' '), price: eur(c.trend), open: () => this.openDetail(c.id) })),
      gainers: [...withChg].sort((a, b) => b.chg - a.chg).slice(0, 3).map(mover), losers: [...withChg].sort((a, b) => a.chg - b.chg).slice(0, 3).map(mover),
      bySet: hp(SETS.map(s => ({ key: s.code, label: s.name, v: own.filter(c => c.set === s.code).reduce((a, c) => a + tot(owned[c.id]) * (c.trend || 0), 0) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 12)),
      byLang: hp(LANGS.map(l => ({ key: l, label: l + ' · ' + LNAME[l], v: own.reduce((a, c) => a + (owned[c.id][l] || 0) * c.trend, 0) }))),
      byBinder: hp(st.binders.map(b => ({ key: b.id, label: b.name, v: b.slots.filter(x => isCard(x) && tot(owned[x])).reduce((a, x) => a + CARDS[x].trend, 0) }))),
      dv: { trend: eur(dp.trend), low: eur(dp.low), avg7: eur(dp.avg7), avg30: eur(dp.avg30), chg: pctf(dp.chg), up: dp.chg >= 0, down: dp.chg < 0, ...chgStyle(dp.chg, true), owned: dn ? dn + '× in bezit · ' + eur(dn * dp.trend) : 'Nog niet in bezit · vanaf ' + eur(dp.low) },
      dBars: bars(dp.series), tip: st.tip, toggleTip: () => this.setState(s => ({ tip: !s.tip })),
      fSort: st.fSort, onFSort: e => this.setState({ fSort: e.target.value }),
      hasCollNeed: st.missingOnly && missC.length > 0, collNeedText: (st.collSet ? 'Nog nodig om ' + setNm + ' compleet te maken: ' : 'Nog nodig om alle sets compleet te maken: ') + costLabel(missC),
      toggleShowPrice: () => this.setState(s => ({ showPrice: !s.showPrice })), spTrack: st.showPrice ? '#9BBC0F' : 'var(--soft)', spKnob: st.showPrice ? '22px' : '2px',
      edNeed: setsIn.map(code => { const s = SETS.find(x => x.code === code); const m = (BYSET[code] || []).filter(c => !tot(owned[c.id])); return { key: code, text: m.length ? 'Nog nodig om ' + s.name + ' compleet te maken: ' + costLabel(m) : s.name + ' is compleet' }; }),
    };
  }
  extraVals() {
    const st = this.state; const { owned, screen } = st;
    const segBtn = on => ({ bg: on ? 'var(--red)' : 'var(--surface)', fg: on ? '#FFF8EE' : 'var(--ink)' });
    const cr = st.create; const lay = screen === 'create' ? buildLayout(Object.assign({}, cr, { owned })) : { fmt: cr.fmt, pages: 0, slots: [] }; const setCr = p => this.setState(s => ({ create: { ...s.create, ...p } }));
    const createSpreads = [0, 1].filter(s => s * 2 < lay.pages).map(s => ({ key: s, cover: cr.cover, left: this.pageModel(lay, 2 * s, false), right: this.pageModel(lay, 2 * s + 1, false) }));
    const sb = this.curB(); const onShift = screen === 'shift'; const planS = onShift ? this.shiftPlan(sb, 'shift') : null; const planB = onShift ? this.shiftPlan(sb, 'buffer') : null; const plan = st.shiftMode === 'shift' ? planS : planB;
    const where = i => `pagina ${Math.floor(i / sb.fmt) + 1}, slot ${i % sb.fmt + 1}`;
    const shOpts = plan ? [['shift', 'Verschuif kaarten', planS, 'Alles schuift één slot op tot het eerste lege vak. Buffers en reserveringen schuiven mee.', 'low_priority', 'var(--red)', '#FFF8EE'], ['buffer', 'Gebruik dichtstbijzijnde buffer', planB, planB.usedBuffer ? `De buffer op ${where(planB.end)} vangt de verschuiving op. De rest van de binder blijft staan.` : 'Geen buffer gevonden achter deze plek: dit werkt hetzelfde als verschuiven.', 'shield', '#9BBC0F', '#0F380F']].map(([k, title, p, note, icon, btnBg, btnFg]) => { const on = st.shiftMode === k; return { key: k, title, stat: `${p.cardMoves.length} kaarten`, sub: `over ${p.pageList.length} pagina's`, note, icon, btnBg, btnFg, bd: on ? 'var(--red)' : 'var(--line)', sh: on ? '4px 4px 0 var(--red)' : '4px 4px 0 var(--line)', dot: on ? 'var(--red)' : 'transparent', preview: () => this.setState({ shiftMode: k }), confirm: e => { e.stopPropagation(); this.confirmShift(k); } }; }) : [];
    const shPages = plan ? plan.pageList.map(p => this.pageModel({ ...sb, pages: plan.pages }, p, false, { slots: plan.slots, moved: plan.moved, newIdx: plan.pos })) : [];
    const sh = plan ? { name: plan.card.names.EN, num: plan.card.set + ' ' + plan.card.numStr, cv: this.cv(plan.card, 'EN', !tot(owned[plan.card.id])), where: `Hoort op ${where(plan.pos)} van ${sb.name}. Die plek is bezet.`, summary: `${plan.cardMoves.length} KAARTEN OVER ${plan.pageList.length} PAGINA'S` } : { name: '', num: '', cv: null, where: '', summary: '' };
    const job = st.job; let moveGroups = [], hpSegs = [], doneN = 0;
    if (job) {
      const g = {}; job.steps.forEach((s, i) => { const k = Math.floor((s.from ?? s.to) / job.fmt); (g[k] = g[k] || []).push({ ...s, i }); });
      doneN = job.steps.filter((_, i) => st.done[i]).length;
      const loc = i => `pagina ${Math.floor(i / job.fmt) + 1}, slot ${i % job.fmt + 1}`;
      moveGroups = Object.keys(g).map(Number).sort((x, y) => y - x).map(k => ({ key: k, title: 'Pagina ' + (k + 1), count: g[k].length + (g[k].length === 1 ? ' stap' : ' stappen'), steps: g[k].map(s => { const dn = !!st.done[s.i]; const c = CARDS[s.cardId]; return { key: s.i, no: String(s.i + 1).padStart(2, '0'), text: s.from == null ? 'Nieuw → ' + loc(s.to) : 'P' + loc(s.from).slice(1) + ' → ' + loc(s.to), name: c.names.EN + ' · ' + c.set + ' ' + pad(c.num), cv: this.cv(c, 'EN'), checkBg: dn ? '#9BBC0F' : 'var(--bg)', checkIcon: dn ? 'check' : '', deco: dn ? 'line-through' : 'none', op: dn ? 0.55 : 1, toggle: () => this.setState(x => ({ done: { ...x.done, [s.i]: !x.done[s.i] } })) }; }) }));
      hpSegs = job.steps.map((_, i) => ({ key: i, bg: st.done[i] ? '#9BBC0F' : '#3A3E47' }));
    }
    const ps = st.ps; const pb = st.binders.find(b => b.id === ps.binderId) || st.binders[0]; const pp = ps.pages[ps.i] ?? 0; const pcols = COLS[pb.fmt]; const prows = pb.fmt / pcols; const align = ps.phase === 'align';
    const rm = this.resultModel();
    const S = { ok: ['check', 'Klopt', '#306230', '#F7F3E8'], fixed: ['check', 'Gecorrigeerd', '#306230', '#F7F3E8'], doubt: ['question_mark', 'Twijfel', '#F0A030', '#1A1C22'], swap: ['close', 'Verkeerd slot', '#E3350D', '#FFF8EE'], wrong: ['close', 'Andere kaart', '#E3350D', '#FFF8EE'], empty: ['close', 'Leeg', '#E3350D', '#FFF8EE'] };
    const rsSlots = rm.idxs.map(i => { const d = rm.det[i]; const [icon, label, bg, fg] = S[d.st]; const c = d.got != null ? CARDS[d.got] : null; let text = label; if (d.st === 'ok' && d.exp == null) text = 'Leeg · klopt'; if (d.st === 'doubt') text = 'Twijfel ' + d.conf + '%'; return { key: i, hasCard: !!c, isEmpty: !c, cv: c ? this.cv(c, 'EN') : null, icon, text, bg, fg, ring: d.st === 'ok' || d.st === 'fixed' ? 'transparent' : bg, open: () => this.setState({ fix: i }) }; });
    const cnt = k => rm.idxs.filter(i => k.includes(rm.det[i].st)).length;
    const parts = [cnt(['ok', 'fixed']) + ' kloppen']; if (cnt(['swap'])) parts.push(cnt(['swap']) + ' verkeerd slot'); if (cnt(['wrong'])) parts.push(cnt(['wrong']) + ' andere kaart'); if (cnt(['doubt'])) parts.push(cnt(['doubt']) + ' twijfel'); if (cnt(['empty'])) parts.push(cnt(['empty']) + ' leeg');
    const rsIssues = rm.idxs.filter(i => ['swap', 'wrong', 'doubt', 'empty'].includes(rm.det[i].st)).map(i => { const d = rm.det[i]; const [icon, , bg, fg] = S[d.st]; const n = i % rm.fmt + 1; const name = id => id != null ? CARDS[id].names.EN : 'leeg'; const text = d.st === 'swap' ? `Slot ${n} · ${name(d.got)} hoort in slot ${d.with % rm.fmt + 1}` : d.st === 'wrong' ? `Slot ${n} · ${name(d.got)}, verwacht ${name(d.exp)}` : d.st === 'doubt' ? `Slot ${n} · twijfel (${d.conf}%)` : `Slot ${n} · leeg, verwacht ${name(d.exp)}`; return { key: i, icon, bg, fg, text, open: () => this.setState({ fix: i }) }; });
    const fx = st.fix != null && rm.det[st.fix] ? rm.det[st.fix] : null; let fixMatches = [];
    if (fx) { const conf = new Map((fx.cands || []).map(m => [m.id, m.conf])); const list = [...new Set([fx.got, fx.exp, ...(fx.cands || []).map(m => m.id)].filter(x => x != null))].slice(0, 3);
      fixMatches = list.map(id => { const c = CARDS[id]; return { key: id, cv: this.cv(c, 'EN'), name: c.names.EN, meta: c.setName + ' · ' + c.set + ' ' + c.numStr + (id === fx.exp ? ' · verwacht' : ''), conf: conf.get(id) ?? 0, select: () => this.setState(s => ({ fixes: { ...s.fixes, [s.fix]: { got: id } }, fix: null })) }; }); }
    return {
      isCreate: screen === 'create', isShift: screen === 'shift', isMoves: screen === 'moves', isResult: screen === 'pageresult', isPageScan: screen === 'pagescan',
      goEditor: () => this.go('editor'), goCreate: () => this.go('recipe', { rcStep: 0 }), goShift: () => this.go('shift', { shiftMode: 'buffer' }), goPageScan: () => this.startPageScan(st.edId, [2 * st.edSpread, 2 * st.edSpread + 1]),
      goPageScanFromScan: () => this.startPageScan(st.edId, [2 * st.edSpread, 2 * st.edSpread + 1]),
      modeCardBg: screen === 'scan' ? '#9BBC0F' : '#2A2D35', modeCardFg: screen === 'scan' ? '#0F380F' : '#F7F3E8', modePageBg: screen === 'pagescan' ? '#9BBC0F' : '#2A2D35', modePageFg: screen === 'pagescan' ? '#0F380F' : '#F7F3E8',
      crName: cr.name, onCrName: e => setCr({ name: e.target.value }),
      coverOpts: COVERS.map(c => ({ key: c, color: c, ring: cr.cover === c ? 'var(--ink)' : 'transparent', select: () => setCr({ cover: c }) })),
      crFmtOpts: [4, 9, 12, 16].map(n => ({ key: n, label: String(n), sub: COLS[n] + '×' + (n / COLS[n]), ...segBtn(cr.fmt === n), select: () => setCr({ fmt: n }) })),
      setChips: SETS.map(s => { const on = cr.sets.includes(s.code); return { key: s.code, code: s.code, label: s.name, bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)', toggle: () => setCr({ sets: on ? cr.sets.filter(x => x !== s.code) : [...cr.sets, s.code] }) }; }),
      crSort: cr.sort, onCrSort: e => setCr({ sort: e.target.value }),
      toggleNewPage: () => setCr({ newPage: !cr.newPage }), npTrack: cr.newPage ? '#9BBC0F' : 'var(--soft)', npKnob: cr.newPage ? '22px' : '2px',
      bufOpts: [0, 1, 2].map(n => ({ key: n, label: n === 0 ? 'Geen' : n + (n > 1 ? ' rijen' : ' rij'), ...segBtn(cr.buffer === n), select: () => setCr({ buffer: n }) })),
      crStats: `${lay.slots.filter(isCard).length} KAARTEN · ${lay.pages} PAGINA'S · ${lay.slots.filter(x => x === 'B').length} BUFFER`,
      createSpreads,
      createBinder: () => { const id = 'b' + Date.now(); const c = this.state.create; const l = buildLayout(Object.assign({}, c, { owned: this.state.owned })); this.setState(s => ({ binders: [...s.binders, Object.assign({ id, name: c.name.trim() || 'Nieuwe binder', cover: c.cover, kind: c.kind, desc: kindDesc(c), deco: { bg: {}, images: [], stickers: [] } }, l)] })); this.go('editor', { edId: id, edSpread: 0, edMode: c.kind === 'free' ? 'deco' : 'cards' }); this.toast('Binder aangemaakt'); },
      kindOpts: KINDS.map(([k, l, icon, desc]) => { const on = cr.kind === k; return { key: k, label: l, icon, desc, bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)', sh: on ? '3px 3px 0 var(--line)' : 'none', select: () => setCr({ kind: k, sort: k === 'trade' ? 'value' : k === 'set' ? 'set' : cr.sort }) }; }),
      crIsSet: cr.kind === 'set', crIsSmart: cr.kind === 'smart', crIsTrade: cr.kind === 'trade', crIsFree: cr.kind === 'free',
      crShowSort: cr.kind !== 'free', crSortLabel: cr.kind === 'set' ? 'Sortering binnen een set' : (cr.kind === 'smart' && cr.group !== 'none') ? 'Sortering binnen een groep' : 'Sortering',
      crShowStrategy: cr.kind === 'set' || (cr.kind === 'smart' && cr.group !== 'none'), crNewPageLabel: cr.kind === 'set' ? 'Elke set begint op een nieuwe pagina' : 'Elke groep begint op een nieuwe pagina', crBufferLabel: cr.kind === 'set' ? 'Buffer per set' : 'Buffer per groep',
      crTypeChips: Object.entries(TYPES).map(([k, [label, color]]) => { const on = cr.types.includes(k); return { key: k, label, color, bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)', select: () => setCr({ types: on ? cr.types.filter(x => x !== k) : cr.types.concat([k]) }) }; }),
      crLangChips: LANGS.map(l => { const on = cr.langs.includes(l); return { key: l, label: l + ' · ' + LNAME[l], bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)', select: () => setCr({ langs: on ? cr.langs.filter(x => x !== l) : cr.langs.concat([l]) }) }; }),
      crRarChips: Object.entries(RAR).map(([k, [label, sym]]) => { const on = cr.rars.includes(k); return { key: k, label: sym + ' ' + label, bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)', select: () => setCr({ rars: on ? cr.rars.filter(x => x !== k) : cr.rars.concat([k]) }) }; }),
      crMinOpts: [[0, 'Alle'], [1, '€ 1+'], [5, '€ 5+'], [10, '€ 10+']].map(([v, l]) => ({ key: v, label: l, ...segBtn(cr.minVal === v), select: () => setCr({ minVal: v }) })),
      toggleOwnedOnly: () => setCr({ ownedOnly: !cr.ownedOnly }), ooTrack: cr.ownedOnly ? '#9BBC0F' : 'var(--soft)', ooKnob: cr.ownedOnly ? '22px' : '2px',
      crGroupOpts: [['none', 'Niet'], ['set', 'Set'], ['type', 'Type'], ['lang', 'Taal']].map(([k, l]) => ({ key: k, label: l, ...segBtn(cr.group === k), select: () => setCr({ group: k }) })),
      crPageOpts: [2, 4, 6, 10].map(n => ({ key: n, label: n + " pag.", ...segBtn(cr.freePages === n), select: () => setCr({ freePages: n }) })),
      crMatch: screen !== 'create' ? '' : (() => { if (cr.kind === 'trade') { const d = CARDS.filter(c => tot(owned[c.id]) > 1 && c.trend >= (cr.minVal || 0)); const n = d.reduce((a, c) => a + tot(owned[c.id]) - 1, 0); return n + ' dubbele exemplaren · ruilwaarde ' + eur(d.reduce((a, c) => a + (tot(owned[c.id]) - 1) * c.trend, 0)); } const m = smartCards(cr, owned); return m.length + ' kaarten voldoen · ' + eur(m.reduce((a, c) => a + c.trend, 0)); })(),
      hasShift: !!plan, noShift: !plan, sh, shOpts, shPages,
      hasJob: !!job, noJob: !job, jobTitle: job ? job.title : 'Verplaatslijst', moveGroups, hpSegs, jobDone: job ? `${doneN}/${job.steps.length} STAPPEN` : '',
      jobPagesLabel: job ? 'Daarna controleer je pagina ' + job.pages.map(p => p + 1).join(', ') : '',
      scanAdjusted: () => job && this.startPageScan(job.binderId, job.pages),
      psv: { title: `PAGINA ${pp + 1} VAN ${pb.pages}`, sub: pb.name + ' · ' + pb.fmt + '-pocket', cols: pcols, rows: prows, aspect: `${pcols * 63} / ${prows * 88}`, cellBorder: align ? '2px dashed #306230' : '2px solid #0F380F', cellBg: align ? 'transparent' : 'rgba(15,56,15,.12)', status: align ? 'CAMERA STARTEN…' : ps.phase === 'reading' ? `HERKENNEN ${ps.done}/${pb.fmt}` : 'LIJN DE PAGINA UIT · DRUK A', capOp: ps.phase === 'locked' ? 1 : 0.6 },
      psCells: range(0, pb.fmt).map(i => ({ key: i, n: i + 1 })),
      psChips: ps.pages.map((p, i) => ({ key: p, label: 'P' + (p + 1), bg: i === ps.i ? '#9BBC0F' : '#2A2D35', fg: i === ps.i ? '#0F380F' : '#F7F3E8', select: () => this.startPageScan(ps.binderId, ps.pages, i) })),
      psAlign: align,
      psDotColor: align ? "#306230" : "#0F380F",
      closePageScan: () => this.go('editor', { edId: pb.id, edSpread: Math.floor(pp / 2) }),
      rs: { title: rm.b.name + ' · pagina ' + (rm.p + 1), cols: COLS[rm.fmt], summary: parts.join(' · '), confirmLabel: ps.i < ps.pages.length - 1 ? 'Alles bevestigen · volgende pagina' : 'Alles bevestigen' },
      rsSlots, rsIssues, noIssues: !rsIssues.length,
      confirmAll: () => { this.toast('Pagina ' + (rm.p + 1) + ' bevestigd'); if (ps.i < ps.pages.length - 1) this.startPageScan(ps.binderId, ps.pages, ps.i + 1); else this.go('editor', { edId: rm.b.id, edSpread: Math.floor(rm.p / 2) }); },
      rescanPage: () => this.startPageScan(ps.binderId, ps.pages, ps.i),
      hasFix: !!fx, fixKicker: fx ? 'SLOT ' + (st.fix % rm.fmt + 1) + ' CORRIGEREN' : '', fixMatches,
      closeFix: () => this.setState({ fix: null }), stop: e => e.stopPropagation(),
      fixEmpty: () => this.setState(s => ({ fixes: { ...s.fixes, [s.fix]: { got: null } }, fix: null })),
    };
  }
  flip(dir) {
    const b = this.state.binders.find(x => x.id === this.state.vId); const last = b.pages / 2 - 1; const s = this.state.vSpread;
    if (this.state.flip || (dir > 0 && s >= last) || (dir < 0 && s <= 0)) return;
    this.setState({ flip: { dir, angle: 0 } });
    requestAnimationFrame(() => requestAnimationFrame(() => this.setState({ flip: { dir, angle: dir > 0 ? -180 : 180 } })));
    clearTimeout(this.ft); this.ft = setTimeout(() => this.setState({ vSpread: s + dir, flip: null }), 780);
  }

  /** Sets for the set dropdowns, grouped by edition and newest first. With `langs`, only groups in those languages. */
  setGroups(langs = []) {
    const groups = [['EN', 'Internationaal (EN · DE)'], ['JA', 'Japans'], ['ZH', 'Chinees']];
    return groups
      .filter(([l]) => !langs.length || langs.includes(l) || (l === 'EN' && langs.includes('DE')))
      .map(([l, label]) => ({ key: l, label, sets: SETS.filter(x => (x.lang || 'EN') === l).sort((a, b) => (b.year || 0) - (a.year || 0)).map(x => ({ key: x.code, code: x.code, name: x.name + (x.year ? ' (' + x.year + ')' : '') })) }))
      .filter(g => g.sets.length);
  }

  /** Rarity filter options: basic tiers, then special rarities (IR/AR, SIR/SAR, …) by number of cards. Cached per catalog. */
  rarGroups() {
    if (this._rarGroups && this._rarGroups.n === CARDS.length) return this._rarGroups.groups;
    let groups;
    if (!CARDS.some(c => c.rarityName)) groups = [{ key: 'basic', label: 'Zeldzaamheid', opts: Object.entries(RAR).filter(([k]) => k !== 'X').map(([k, [l, sym]]) => ({ key: k, label: sym + ' ' + l })) }];
    else {
      const n = {}; let unknown = 0;
      CARDS.forEach(c => { if (c.rarityName) n[c.rarityName] = (n[c.rarityName] || 0) + 1; else unknown++; });
      const label = k => { const r = RARITIES[k]; const ab = !r ? '' : r[0] === r[1] ? r[0] : r[0] + ' / ' + r[1]; return (ab ? ab + ' · ' : '') + (k === 'None' ? 'Geen (energie e.d.)' : k) + ' (' + n[k] + ')'; };
      const names = Object.keys(n).sort((a, b) => n[b] - n[a]);
      groups = [
        { key: 'basic', label: 'Basis', opts: BASIC_RARITIES.filter(k => n[k]).map(k => ({ key: k, label: label(k) })) },
        { key: 'special', label: 'Speciaal', opts: names.filter(k => !BASIC_RARITIES.includes(k)).map(k => ({ key: k, label: label(k) })) },
      ];
      if (unknown) groups.push({ key: 'unknown', label: 'Overig', opts: [{ key: '?', label: '? · Onbekend (' + unknown + ')' }] });
    }
    this._rarGroups = { n: CARDS.length, groups };
    return groups;
  }
  _rarGroups: any;

  renderVals() {
    this.catalog.priceTick(); // recompute when prices arrive
    const st = this.state; const { owned, added, screen } = st;
    const navItem = ([id, label, icon]) => { const on = screen === id || (id === 'binders' && ['editor', 'create', 'recipe', 'shift', 'moves', 'pageresult', 'crop', 'print'].includes(screen)) || (id === 'collection' && screen === 'value'); return { key: id, label, icon, go: () => this.go(id), bg: on ? '#FFFDF6' : 'transparent', fg: on ? '#1A1C22' : '#FFF4EC', bd: on ? '#1A1C22' : 'transparent', sh: on ? '3px 3px 0 #1A1C22' : 'none', mfg: on ? 'var(--red)' : 'var(--muted)', bar: on ? 'var(--red)' : 'transparent' }; };
    const navAll = NAV.map(navItem);
    const ownedCards = CARDS.filter(c => tot(owned[c.id]) > 0);
    const totalCards = CARDS.reduce((a, c) => a + tot(owned[c.id]), 0);
    const langN = LANGS.map(l => CARDS.reduce((a, c) => a + (owned[c.id][l] || 0), 0)); const maxL = Math.max(...langN, 1);
    // Sets you own cards from (most complete first); before you own anything, the newest sets.
    const progressSets = (() => { const h = SETS.filter(x => (BYSET[x.code] || []).some(c => tot(owned[c.id]))); return h.length ? h : [...SETS].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 4); })();
    const setProgress = progressSets.map(s => { const cs = (BYSET[s.code] || []); const have = cs.filter(c => tot(owned[c.id])).length; const pct = Math.round(have / cs.length * 100); return { key: s.code, code: s.code, name: s.name, pct, done: have === cs.length, notDone: have < cs.length, label: `${have}/${cs.length}`, langs: s.avail.join(' · '), needLabel: have === cs.length ? 'Set compleet' : 'Nog nodig: ' + costLabel(cs.filter(c => !tot(owned[c.id]))), open: () => this.go('search', { fSet: s.code, q: '', fLangs: [], fRar: '', fType: '' }) }; }).sort((a, b) => b.pct - a.pct);
    const when = t => { const d = Math.floor((Date.now() - (t || 0)) / 864e5); return d <= 0 ? 'vandaag' : d === 1 ? 'gisteren' : `${d} dagen geleden`; };
    const recent = [...ownedCards].sort((a, b) => (added[b.id] || 0) - (added[a.id] || 0)).slice(0, 10).map(c => ({ key: c.id, cv: this.cv(c, 'EN'), when: when(added[c.id]), open: () => this.openDetail(c.id) }));

    // search
    const ql = st.q.trim().toLowerCase(); const langs = st.fLangs.length ? st.fLangs : LANGS;
    const resultsRaw = CARDS.filter(c => (!st.fSet || c.set === st.fSet) && (!st.fRar || (st.fRar === '?' ? !c.rarityName && c.rarity === 'X' : c.rarityName ? c.rarityName === st.fRar : c.rarity === st.fRar)) && (!st.fType || c.type === st.fType) && langs.some(l => c.avail.includes(l)) && (!ql || c.numStr.includes(ql) || langs.some(l => c.avail.includes(l) && c.names[l].toLowerCase().includes(ql))));
    const showLang = c => { const l = st.fLangs.find(x => c.avail.includes(x)); return l || c.avail[0]; };
    const byValue = (a, b) => (b.trend ?? -1) - (a.trend ?? -1);
    const results = st.fSort === 'value' ? [...resultsRaw].sort(byValue) : resultsRaw;
    // Only the visible slice is turned into view models (the full catalog has ~40k cards).
    const toResult = c => { const n = tot(owned[c.id]); const l = showLang(c); return { key: c.id, cv: this.cv(c, l), name: c.names[l], price: eur(c.trend), shadow: '3px 3px 0 var(--line)', open: () => this.openDetail(c.id, l) }; }; // browsing: no owned/missing marks
    const toggleLang = l => this.setState(s => ({ fLangs: s.fLangs.includes(l) ? s.fLangs.filter(x => x !== l) : [...s.fLangs, l] }));
    const langChips = LANGS.map(l => { const on = st.fLangs.includes(l); return { key: l, code: l, bg: on ? '#9BBC0F' : 'var(--surface)', fg: on ? '#0F380F' : 'var(--ink)', toggle: () => toggleLang(l) }; });
    const typeChips = Object.entries(TYPES).map(([k, [label, color]]) => { const on = st.fType === k; return { key: k, label, color, bg: on ? 'var(--ink)' : 'var(--surface)', fg: on ? 'var(--bg)' : 'var(--ink)', toggle: () => this.setState({ fType: on ? '' : k }) }; });

    // detail
    const dc = CARDS[st.detailId]; const dl = st.detailLang; const dAvail = dc.avail.includes(dl); const dOwn = owned[dc.id];
    const dBinders = []; st.binders.forEach(b => b.slots.forEach((x, i) => { if (x === dc.id) { const p = Math.floor(i / b.fmt); dBinders.push({ key: b.id + i, name: b.name, cover: b.cover, where: `Pagina ${p + 1} · slot ${i % b.fmt + 1} · ${b.fmt}-pocket`, open: () => this.go('editor', { edId: b.id, edSpread: Math.floor(p / 2) }) }); } }));
    const d = { set: dc.set, numStr: dc.numStr, setName: dc.setName, name: dc.names[dAvail ? dl : 'EN'], typeLabel: TYPES[dc.type][0], typeColor: TYPES[dc.type][1], rarLabel: rarLabel(dc), availLabel: dc.avail.join(' · '), total: tot(dOwn), unavailable: !dAvail, notOwnedLang: dAvail && !dOwn[dl], cv: this.cv(dc, dl, !dAvail || !dOwn[dl]), others: dc.avail.filter(l => l !== dl).map(l => ({ key: l, code: l, name: dc.names[l] })) };
    const dTabs = LANGS.map(l => { const on = dl === l; const av = dc.avail.includes(l); return { key: l, code: l, bg: on ? 'var(--red)' : 'var(--surface)', fg: on ? '#FFF8EE' : (av ? 'var(--ink)' : 'var(--muted)'), deco: av ? 'none' : 'line-through', sub: av ? (dOwn[l] ? '×' + dOwn[l] : '—') : 'n.v.t.', select: () => this.setState({ detailLang: l }) }; });
    const dOwnRows = dc.avail.map(l => ({ key: l, code: l, lname: LNAME[l], name: dc.names[l], n: dOwn[l] || 0, inc: () => this.setOwn(dc.id, l, 1), dec: () => this.setOwn(dc.id, l, -1) }));

    // collection
    let cl = CARDS.filter(c => st.missingOnly ? !tot(owned[c.id]) : tot(owned[c.id]) > 0);
    if (st.collSet) cl = cl.filter(c => c.set === st.collSet);
    if (st.sort === 'num') cl = [...cl].sort((a, b) => (a.num - b.num) || (a.id - b.id));
    if (st.sort === 'date') cl = [...cl].sort((a, b) => (added[b.id] || 0) - (added[a.id] || 0));
    if (st.sort === 'value') cl = [...cl].sort(byValue);
    const collItems = cl;
    const toCollItem = c => { const n = tot(owned[c.id]); return { key: c.id, cv: this.cv(c, 'EN', !n), name: c.names.EN, price: (n ? '' : '≈ ') + eur(c.trend), setNum: c.set + ' ' + c.numStr, typeLabel: TYPES[c.type][0], langs: LANGS.filter(l => owned[c.id][l]).map(l => owned[c.id][l] > 1 ? `${l}×${owned[c.id][l]}` : l).join(' '), qtyLabel: n ? '×' + n : 'mist', qtyColor: n ? 'var(--ink)' : 'var(--red)', shadow: n ? '3px 3px 0 var(--line)' : 'none', open: () => this.openDetail(c.id) }; };

    // binders
    const binderCards = st.binders.map(b => { const filled = b.slots.filter(isCard); const miss = filled.filter(x => !tot(owned[x])).length; const pct = Math.round(filled.length / b.slots.length * 100); return { key: b.id, name: b.name, cover: b.cover, fmt: b.fmt + '-POCKET', pct, stats: `${filled.length}/${b.slots.length} slots · ${b.pages} pagina's`, missLabel: !filled.length ? 'nog leeg' : miss ? `${miss} ontbrekend` : 'alles in bezit', newCount: this.newSugs(b).length, hasNewSug: this.newSugs(b).length > 0, kindLabel: (b.kind === 'recipe' ? 'SLIMME BINDER' : (KINDS.find(k => k[0] === (b.kind || 'set')) || KINDS[0])[1].toUpperCase()) + (b.desc ? ' · ' + b.desc : ''), value: eur(filled.filter(x => tot(owned[x])).reduce((a, x) => a + CARDS[x].trend, 0)), complete: filled.length > 0 && miss === 0, preview: filled.slice(0, 3).map((id, i) => ({ key: id, cv: this.cv(CARDS[id], 'EN', !tot(owned[id])), left: [0, 29, 58][i], rot: [-9, 0, 9][i] })), edit: () => this.go('editor', { edId: b.id, edSpread: 0 }), view: () => this.go('viewer', { vId: b.id, vSpread: 0 }) }; });

    // editor
    const eb = this.curB(); const lastSpread = eb.pages / 2 - 1; const es = Math.min(st.edSpread, lastSpread);
    const inB = new Set(eb.slots.filter(x => x != null)); const sq = st.sideQ.trim().toLowerCase();
    const sideItems = screen !== 'editor' ? [] : CARDS.filter(c => (!st.sideSet || c.set === st.sideSet) && (!sq || LANGS.some(l => c.names[l].toLowerCase().includes(sq)))).slice(0, 60).map(c => { const n = tot(owned[c.id]); const on = st.sel === c.id; return { key: c.id, cv: this.cv(c, 'EN', !n), num: c.set + ' ' + c.num, label: inB.has(c.id) ? '✓ geplaatst' : n ? '×' + n : 'mist', labelColor: n ? 'var(--muted)' : 'var(--red)', op: inB.has(c.id) ? 0.5 : 1, bd: on ? '#9BBC0F' : 'transparent', onDragStart: e => { e.dataTransfer.setData('text/plain', 'c' + c.id); e.dataTransfer.effectAllowed = 'copyMove'; this.setState({ drag: { type: 'side', cardId: c.id }, sel: null }); }, onDragEnd: () => this.setState({ drag: null, over: null }), onClick: () => this.setState({ sel: on ? null : c.id }) }; });
    const isDraggingSlot = !!(st.drag && st.drag.type === 'slot');

    // viewer
    const vb = st.binders.find(b => b.id === st.vId); const vs = st.vSpread; const f = st.flip; const pm = p => this.pageModel(vb, p, false);
    let vLeft, vRight, leafFront = null, leafBack = null;
    if (!f) { vLeft = pm(2 * vs); vRight = pm(2 * vs + 1); }
    else if (f.dir > 0) { vLeft = pm(2 * vs); vRight = pm(2 * vs + 3); leafFront = pm(2 * vs + 1); leafBack = pm(2 * vs + 2); }
    else { vLeft = pm(2 * vs - 2); vRight = pm(2 * vs + 1); leafFront = pm(2 * vs); leafBack = pm(2 * vs - 1); }

    // scanner
    const sc = st.scan; const ms = sc.matches.map(m => CARDS[m.id]).filter(Boolean); const confs = sc.matches.map(m => m.conf); const selCard = ms[sc.sel];
    const matches = ms.map((c, i) => { const on = sc.sel === i; return { key: c.id, cv: this.cv(c, sc.lang), name: c.names[c.avail.includes(sc.lang) ? sc.lang : 'EN'], meta: `${c.setName} · ${c.set} ${c.numStr}`, conf: confs[i], bd: on ? 'var(--red)' : 'var(--line)', sh: on ? '3px 3px 0 var(--red)' : 'none', dot: on ? 'var(--red)' : 'transparent', select: () => this.setScan({ sel: i, lang: c.avail.includes(sc.lang) ? sc.lang : c.avail[0] }) }; });
    const langOpts = !selCard ? [] : LANGS.map(l => { const av = selCard.avail.includes(l); const on = sc.lang === l; return { key: l, code: l, bg: on ? 'var(--red)' : 'var(--surface)', fg: on ? '#FFF8EE' : 'var(--ink)', op: av ? 1 : 0.4, deco: av ? 'none' : 'line-through', select: () => av && this.setScan({ lang: l }) }; });
    const condOpts = CONDS.map(([k, l]) => { const on = sc.cond === k; return { key: k, code: k, label: l, bg: on ? 'var(--ink)' : 'var(--surface)', fg: on ? 'var(--bg)' : 'var(--ink)', select: () => this.setScan({ cond: k }) }; });

    return {
      ...this.extraVals(),
      ...this.valueVals(),
      ...this.decoVals(),
      ...this.recipeVals(),
      wide: st.wide, narrow: !st.wide, lcdPixels: this.lcdPixels,
      isHome: screen === 'home', isSearch: screen === 'search', isDetail: screen === 'detail', isColl: screen === 'collection', isBinders: screen === 'binders', isEditor: screen === 'editor', isScan: screen === 'scan', isViewer: screen === 'viewer',
      navAll, navL: navAll.slice(0, 2), navR: navAll.slice(2),
      setOpts: SETS.map(x => ({ key: x.code, code: x.code, name: x.name })),
      setGroups: this.setGroups(st.screen === 'search' ? st.fLangs : []),
      rarGroups: this.rarGroups(),
      goScan: () => this.go('scan'), goColl: () => this.go('collection'), goBinders: () => this.go('binders'),
      toggleDark: () => this.setState(s => ({ dark: !s.dark })), darkIcon: st.dark ? 'light_mode' : 'dark_mode',
      toast: st.toast, hasToast: !!st.toast,
      totalCards, uniqueCards: ownedCards.length, setsDone: setProgress.filter(s => s.done).length,
      langStats: LANGS.map((l, i) => ({ key: l, code: l, n: langN[i], pct: Math.round(langN[i] / maxL * 100) })),
      recent, setProgress,
      q: st.q, onQ: e => this.setState({ q: e.target.value }), fSet: st.fSet, onFSet: e => this.setState({ fSet: e.target.value }), fRar: st.fRar, onFRar: e => this.setState({ fRar: e.target.value }),
      langChips, typeChips, results, resultsShown: results.slice(0, st.searchLimit).map(toResult), hasMoreResults: results.length > st.searchLimit, moreResults: () => this.setState(s => ({ searchLimit: s.searchLimit + 60 })), resultCount: `${results.length} ${results.length === 1 ? 'resultaat' : 'resultaten'}`,
      hasFilters: !!(st.q || st.fLangs.length || st.fSet || st.fRar || st.fType), clearFilters: () => this.setState({ q: '', fLangs: [], fSet: '', fRar: '', fType: '' }),
      d, dTabs, dOwnRows, dBinders, noDBinders: !dBinders.length, back: () => this.go(st.prev || 'home'),
      collItems, collShown: collItems.slice(0, st.collLimit).map(toCollItem), hasMoreColl: collItems.length > st.collLimit, moreColl: () => this.setState(s => ({ collLimit: s.collLimit + 60 })), collCount: st.missingOnly ? `${collItems.length} ontbrekend` : `${collItems.length} uniek · ${totalCards} totaal`,
      isGrid: st.view === 'grid', isList: st.view === 'list', setGrid: () => this.setState({ view: 'grid' }), setList: () => this.setState({ view: 'list' }),
      gridBg: st.view === 'grid' ? 'var(--ink)' : 'var(--surface)', gridFg: st.view === 'grid' ? 'var(--bg)' : 'var(--ink)', listBg: st.view === 'list' ? 'var(--ink)' : 'var(--surface)', listFg: st.view === 'list' ? 'var(--bg)' : 'var(--ink)',
      sort: st.sort, onSort: e => this.setState({ sort: e.target.value }), collSet: st.collSet, onCollSet: e => this.setState({ collSet: e.target.value }),
      toggleMissing: () => this.setState(s => ({ missingOnly: !s.missingOnly })), missTrack: st.missingOnly ? '#9BBC0F' : 'var(--soft)', missKnob: st.missingOnly ? '22px' : '2px',
      binderCards, newBinder: () => this.go('recipe', { rcStep: 0 }),
      ed: { name: eb.name, cover: eb.cover, spreadLabel: `PAGINA ${2 * es + 1}–${2 * es + 2} / ${eb.pages}` },
      edLeft: this.pageModel(eb, 2 * es, true), edRight: this.pageModel(eb, 2 * es + 1, true),
      edPrev: () => es > 0 && this.setState({ edSpread: es - 1 }), edNext: () => es < lastSpread && this.setState({ edSpread: es + 1 }), edPrevOp: es > 0 ? 1 : 0.35, edNextOp: es < lastSpread ? 1 : 0.35,
      fmtOptions: [4, 9, 12, 16].map(n => { const on = eb.fmt === n; return { key: n, label: n + '-pocket', bg: on ? 'var(--red)' : 'var(--surface)', fg: on ? '#FFF8EE' : 'var(--ink)', select: () => this.setFmt(n) }; }),
      autoSet: st.autoSet, onAutoSet: e => this.setState({ autoSet: e.target.value }), autofill: () => this.autofill(),
      addPages: () => { this.updB(eb.id, nb => { nb.pages += 2; for (let k = 0; k < 2 * nb.fmt; k++) nb.slots.push(null); return nb; }); this.toast("2 pagina's toegevoegd"); },
      exportImg: () => this.toast(`Pagina ${2 * es + 1}–${2 * es + 2} geëxporteerd als PNG`),
      openViewer: () => this.go('viewer', { vId: eb.id, vSpread: es }),
      sideItems, sideCount: sideItems.length >= 60 ? 'eerste 60 · zoek om te filteren' : sideItems.length + ' kaarten', sideQ: st.sideQ, onSideQ: e => this.setState({ sideQ: e.target.value }), sideSet: st.sideSet, onSideSet: e => this.setState({ sideSet: e.target.value }),
      isDraggingSlot, sideZoneBg: st.sideOver ? 'rgba(227,53,13,.22)' : 'rgba(227,53,13,.10)',
      sideDragOver: e => { if (this.state.drag && this.state.drag.type === 'slot') { e.preventDefault(); if (!this.state.sideOver) this.setState({ sideOver: true }); } },
      sideDragLeave: () => this.state.sideOver && this.setState({ sideOver: false }),
      sideDrop: e => { const dr = this.state.drag; if (dr && dr.type === 'slot') { e.preventDefault(); this.updB(this.state.edId, nb => { nb.slots[dr.idx] = null; return nb; }); } this.setState({ drag: null, over: null, sideOver: false }); },
      hasSel: st.sel != null, selName: st.sel != null ? CARDS[st.sel].names.EN.toUpperCase() : '', clearSel: () => this.setState({ sel: null }),
      v: { name: vb.name, cover: vb.cover, fmt: vb.fmt + '-POCKET', link: `cardcase.app/b/${vb.id}-7kq2`, label: `PAGINA ${2 * vs + 1}–${2 * vs + 2} / ${vb.pages}` },
      vLeft, vRight, leafFront, leafBack, flipping: !!f, leafLeft: f && f.dir > 0 ? '50%' : '0%', leafOrigin: f && f.dir > 0 ? 'left center' : 'right center', leafAngle: f ? f.angle : 0,
      vPrev: () => this.flip(-1), vNext: () => this.flip(1), vPrevOp: vs > 0 ? 1 : 0.35, vNextOp: vs < vb.pages / 2 - 1 ? 1 : 0.35,
      copyLink: () => { try { navigator.clipboard && navigator.clipboard.writeText('https://' + `cardcase.app/b/${vb.id}-7kq2`); } catch (e) {} this.toast('Link gekopieerd'); },
      closeViewer: () => this.go('editor', { edId: vb.id, edSpread: vs }),
      scanSearching: sc.phase === 'search', scanLocked: sc.phase !== 'search', scanSheet: sc.phase === 'sheet',
      frameColor: sc.phase === 'search' ? 'rgba(155,188,15,.55)' : '#9BBC0F',
      statusText: sc.phase === 'search' ? 'ZOEKEN NAAR KAART…' : sc.phase === 'found' ? 'KAART GEVONDEN…' : ms.length === 1 ? '1 MATCH GEVONDEN' : ms.length + ' MATCHES GEVONDEN', matchCount: ms.length,
      statusDotColor: sc.phase === 'search' ? '#306230' : '#0F380F', statusDotBlink: sc.phase !== 'sheet',
      matches, langOpts, condOpts, scanQty: sc.qty,
      qtyInc: () => this.setScan({ qty: sc.qty + 1 }), qtyDec: () => this.setScan({ qty: Math.max(1, sc.qty - 1) }),
      addScan: () => this.addScan(), rescan: () => this.startScan(), closeScan: () => this.go('home'),
    };
  }
}
