/*!
 * Date Range Picker
 * Builds on the Calendar Date Picker: load datepicker.css + datepicker.js first. It reuses their
 * tokens, the three skins (custom spec · Ant Design · MUI), tooltips, parsing and keyboard hints.
 *
 *   const picker = new DateRangePicker(el, {
 *     ds: 'custom' | 'ant' | 'mui', theme: 'light' | 'dark',
 *     label: 'Treatment period',
 *     value: { start: '2025-12-15', end: '2025-12-21' },
 *     recommendedRanges: [{ start, end, title?, reason, checks: [] }],
 *     recommendationSummary: 'The treatment plan recommends …',
 *     unavailable: { 'YYYY-MM-DD': reason }, events: { 'YYYY-MM-DD': { title, items } },
 *     min, max, minDays, maxDays, allowSingleDay: true,
 *     confirm: true,                       // Cancel / Done; false commits as soon as the range is complete
 *     validate: (start, end) => null,      // extra clinical rules; return a message to block
 *     onChange: ({ start, end }, picker) => {}
 *   });
 */
(function (global) {
  'use strict';

  const DP = global.DatePicker;
  if (!DP || !DP.shared) throw new Error('daterangepicker.js needs datepicker.js loaded first.');
  const {
    MONTHS, MONTHS_SHORT, WD, WD_LONG, I, toKey, toDate, addDays, monthOf, daysIn,
    addMonthsKeepDay, fmt, longDate, esc, sparkle, parseText
  } = DP.shared;

  const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  const mIndex = d => d.getFullYear() * 12 + d.getMonth();
  const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7));
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const same = (a, b) => !!a && !!b && toKey(a) === toKey(b);
  const dayLong = d => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const shortD = d => `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
  const lowerFirst = s => s.charAt(0).toLowerCase() + s.slice(1);
  const trimDot = s => String(s).replace(/\.$/, '');

  const PRESETS = [
    { label: 'Custom', view: 'days' },
    { label: 'Recommended', view: 'recommended' },
    { label: 'Today', range: t => [t, t] },
    { label: 'Yesterday', range: t => [addDays(t, -1), addDays(t, -1)] },
    { label: 'This week', range: t => { const s = startOfWeek(t); return [s, addDays(s, 6)]; } },
    { label: 'Last week', range: t => { const s = addDays(startOfWeek(t), -7); return [s, addDays(s, 6)]; } },
    { label: 'This month', range: t => [new Date(t.getFullYear(), t.getMonth(), 1), new Date(t.getFullYear(), t.getMonth() + 1, 0)] },
    { label: 'Last month', range: t => [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)] },
    { label: 'Last 12 months', range: t => [addDays(addMonthsKeepDay(t, -12), 1), t] }
  ];

  let uid = 0;

  class DateRangePicker {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({
        ds: 'custom', theme: 'light', label: 'Date', startLabel: 'Start date', endLabel: 'End date',
        presets: null, recommendedRanges: [], recommendationSummary: '',
        events: {}, unavailable: {}, confirm: true, allowSingleDay: true, minDays: null, maxDays: null,
        inline: false, static: false, disabled: false, state: null, error: null, text: null, demo: {}
      }, opts);
      const o = this.o, demo = o.demo;
      this.id = 'dpr' + (++uid);
      this.today = toDate(o.today) || toDate(new Date());
      this.min = toDate(o.min);
      this.max = toDate(o.max);
      const v = Array.isArray(o.value) ? { start: o.value[0], end: o.value[1] } : (o.value || {});
      this.value = { start: toDate(v.start), end: toDate(v.end) };
      this.recs = (o.recommendedRanges || []).map(r => Object.assign({}, r, { start: toDate(r.start), end: toDate(r.end) }));
      this.draft = demo.draft ? { start: toDate(demo.draft.start), end: toDate(demo.draft.end) } : Object.assign({}, this.value);
      this.active = this.draft.start && !this.draft.end ? 'end' : 'start';
      this.error = o.error || null;
      this.errorPart = o.errorPart || null;
      this.note = demo.note || null;
      this.view = demo.view || 'days';
      this.hover = demo.preview || null;
      this.pinned = demo.tooltip || null;
      this.yearsFor = null;
      const base = toDate(o.viewMonth) || this.draft.start || this.today;
      this.months = [monthOf(base), addMonths(monthOf(base), 1)];
      this.focusDate = this.draft.start || this.today;
      this.open = !!o.inline;
      const t = o.text || {};
      this.text = {
        start: t.start != null ? t.start : (this.draft.start ? fmt(this.draft.start) : ''),
        end: t.end != null ? t.end : (this.draft.end ? fmt(this.draft.end) : '')
      };

      this._onDoc = e => {
        if (this.open && !this.o.inline && this.root && !this.root.contains(e.target)) this.cancel(false);
      };
      this._onResize = () => {
        if (this.tip && !this.tip.hidden) {
          const b = this.pop.querySelector(`.dp-day[data-date="${this.tip.dataset.for}"]`);
          if (b) this.placeTip(b);
        }
        this.sync();
      };
      document.addEventListener('pointerdown', this._onDoc);
      window.addEventListener('resize', this._onResize);
      this.build();
    }

    /* ---------- public API ---------- */
    getValue() { return Object.assign({}, this.value); }
    setDS(ds) {
      if (ds === this.o.ds) return;
      // Keep committed text as committed; an open draft is re-shown after the rebuild.
      this.text = this.open ? Object.assign({}, this.committed) : { start: this.inputs.start.value, end: this.inputs.end.value };
      this.o.ds = ds;
      this.yearsFor = null;
      this.build();
      if (this.open && (this.draft.start || this.draft.end)) { this.showDraft(); this.sync(); }
    }
    setTheme(t) { this.o.theme = t; this.root.dataset.theme = t; }
    destroy() {
      document.removeEventListener('pointerdown', this._onDoc);
      window.removeEventListener('resize', this._onResize);
      this.el.innerHTML = '';
    }

    /* ---------- structure ---------- */
    build() {
      const o = this.o;
      this.el.innerHTML =
        `<div class="dp dpr" id="${this.id}" data-ds="${o.ds}" data-theme="${o.theme}">` + this.fieldHTML() +
        `<div class="dp-msg" id="${this.id}-msg" aria-live="polite" hidden></div>` +
        `<div class="dp-tip" id="${this.id}-tip" role="tooltip" hidden></div>` +
        `<div class="dp-sr" aria-live="polite"></div></div>`;
      const r = this.root = this.el.firstElementChild;
      this.inputs = { start: r.querySelector('[data-part="start"]'), end: r.querySelector('[data-part="end"]') };
      this.pop = r.querySelector('.dpr-pop');
      this.msg = r.querySelector('.dp-msg');
      this.tip = r.querySelector('.dp-tip');
      this.sr = r.querySelector('.dp-sr');
      this.bar = r.querySelector('.dpr-bar');
      this.inputs.start.value = this.text.start;
      this.inputs.end.value = this.text.end;
      this.committed = Object.assign({}, this.text);
      if (o.static) for (const p in this.inputs) { this.inputs[p].readOnly = true; this.inputs[p].tabIndex = -1; }
      this.bind();
      this.sync();
      this.render();
    }

    fieldHTML() {
      const { ds, label, startLabel, endLabel } = this.o, id = this.id;
      const ph = ds === 'mui' ? 'MM/DD/YYYY' : 'mm/dd/yyyy';
      const inp = (part, l) => `<input id="${id}-${part}" class="dp-input dpr-in" data-part="${part}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" ` +
        `placeholder="${ph}" aria-label="${esc(l)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="${id}-pop" aria-describedby="${id}-msg">`;
      const sep = `<span class="dpr-sep" aria-hidden="true">${ds === 'mui' ? '–' : I.aR}</span>`;
      const pop = `<div class="dp-pop dpr-pop" id="${id}-pop" role="dialog" aria-label="Choose ${esc(label.toLowerCase())}" hidden></div>`;
      const lab = `<label class="dp-label" id="${id}-lab" for="${id}-start">${esc(label)}</label>`;
      const group = `role="group" aria-labelledby="${id}-lab"`;
      const fields = inp('start', startLabel) + sep + inp('end', endLabel);
      if (ds === 'mui') {
        return `<div class="dp-control"><div class="dp-box dpr-box" ${group}>${lab}${fields}` +
          `<button type="button" class="dp-trigger" aria-label="Choose dates">${I.calMui}</button>` +
          `<fieldset class="dp-outline" aria-hidden="true"><legend><span>${esc(label)}</span></legend></fieldset></div>${pop}</div>`;
      }
      if (ds === 'ant') {
        return `${lab}<div class="dp-control"><div class="dp-box dpr-box" ${group}>${fields}` +
          `<span class="dp-suffix"><span class="dp-icon">${I.calAnt}</span>` +
          `<button type="button" class="dp-clear" tabindex="-1" aria-label="Clear dates">${I.clear}</button></span>` +
          `<span class="dpr-bar" aria-hidden="true"></span></div>${pop}</div>`;
      }
      return `${lab}<div class="dp-control"><div class="dp-box dpr-box" ${group}><span class="dp-icon">${I.cal}</span>${fields}</div>${pop}</div>`;
    }

    isStatic() { return this.o.static || this.o.disabled || this.o.state === 'disabled'; }

    sync() {
      const r = this.root, st = this.o.state, dis = this.o.disabled || st === 'disabled';
      const openLook = this.open && !this.o.inline;
      const hasVal = !!(this.inputs.start.value || this.inputs.end.value);
      r.classList.toggle('is-inline', !!this.o.inline);
      r.classList.toggle('is-open', openLook);
      r.classList.toggle('is-active', st === 'active');
      r.classList.toggle('is-focused', !!this.focused || st === 'focused');
      r.classList.toggle('is-disabled', dis);
      r.classList.toggle('is-error', !!this.error);
      r.classList.toggle('has-value', hasVal);
      r.classList.toggle('is-float', hasVal || !!this.focused || openLook || st === 'focused' || st === 'active');
      for (const p of ['start', 'end']) {
        const inp = this.inputs[p];
        inp.disabled = dis;
        inp.setAttribute('aria-expanded', String(this.open));
        inp.setAttribute('aria-invalid', String(!!this.error && (!this.errorPart || this.errorPart === p)));
      }
      this.msg.hidden = !this.error;
      this.msg.innerHTML = this.error ? (this.o.ds === 'custom' ? I.warn : '') + `<span>${esc(this.error)}</span>` : '';
      if (this.bar) {
        const a = this.inputs[this.active];
        this.bar.style.left = a.offsetLeft + 'px';
        this.bar.style.width = a.offsetWidth + 'px';
      }
    }

    /* ---------- data helpers ---------- */
    unavailReason(d) { return DP.prototype.unavailReason.call(this, d); }
    presets() {
      return (this.o.presets || PRESETS).filter(p => p.view !== 'recommended' || this.recs.length);
    }
    activePreset(list) {
      if (this.view === 'recommended') return list.findIndex(p => p.view === 'recommended');
      const { start, end } = this.draft;
      if (start && end) {
        const i = list.findIndex(p => {
          if (!p.range) return false;
          const [a, b] = p.range(this.today);
          return same(a, start) && same(b, end);
        });
        if (i >= 0) return i;
      }
      return list.findIndex(p => p.view === 'days');
    }
    monthsFor(s, e) {
      if (!s) return this.months;
      if (e && mIndex(e) - mIndex(s) > 1) return [addMonths(monthOf(e), -1), monthOf(e)];
      const visible = this.months.some(m => mIndex(m) === mIndex(s)) && (!e || this.months.some(m => mIndex(m) === mIndex(e)));
      return visible ? this.months : [monthOf(s), addMonths(monthOf(s), 1)];
    }
    rangeError(s, e) {
      if (e < s) return 'End date is before start date';
      if (same(s, e) && !this.o.allowSingleDay) return 'Start and end dates must be different';
      const n = daysBetween(s, e) + 1;
      if (this.o.minDays && n < this.o.minDays) return `Choose at least ${this.o.minDays} days`;
      if (this.o.maxDays && n > this.o.maxDays) return `Choose ${this.o.maxDays} days or fewer`;
      let first = null, last = null;
      if (n <= 3700) for (let d = s; d <= e; d = addDays(d, 1)) if (this.unavailReason(d)) { first = first || d; last = d; }
      if (first) return `The range includes unavailable dates (${shortD(first)}${same(first, last) ? '' : '–' + shortD(last)}). Choose dates around them.`;
      if (typeof this.o.validate === 'function') return this.o.validate(s, e) || null;
      return null;
    }
    duration() {
      const info = this.bandInfo();
      const s = info.type === 'pre' ? info.a : this.draft.start, e = info.type === 'pre' ? info.b : this.draft.end;
      if (s && e && e >= s) { const n = daysBetween(s, e) + 1; return `${n} day${n > 1 ? 's' : ''}`; }
      if (s && e) return '';
      return this.draft.start ? 'Select an end date' : '';
    }

    /* ---------- range band ---------- */
    bandInfo() {
      const { start, end } = this.draft;
      let a = null, b = null, type = null;
      if (start && end) { a = start; b = end; type = 'sel'; }
      const h = this.open && this.hover ? toDate(this.hover) : null;
      if (h && !this.unavailReason(h)) {
        // Preview only while choosing an end, or while explicitly editing one side of a complete range.
        if (this.active === 'end' && start && (!end || this.editPart === 'end') && h >= start) { a = start; b = h; type = 'pre'; }
        else if (this.active === 'start' && end && this.editPart === 'start' && h <= end) { a = h; b = end; type = 'pre'; }
      }
      return { a, b, type };
    }
    cellCls(d, info) {
      const cls = [];
      if (this.unavailReason(d)) cls.push('is-unavail');
      const add = (a, b, t) => {
        if (!a || !b || d < a || d > b) return false;
        cls.push('band', 'band-' + t);
        if (same(d, a)) cls.push('band-s');
        if (same(d, b)) cls.push('band-e');
        const dow = (d.getDay() + 6) % 7;
        if (dow === 0 || d.getDate() === 1) cls.push('band-rs');
        if (dow === 6 || d.getDate() === daysIn(d.getFullYear(), d.getMonth())) cls.push('band-re');
        return true;
      };
      if (!add(info.a, info.b, info.type)) {
        const r = this.recs.find(x => d >= x.start && d <= x.end);
        if (r) add(r.start, r.end, 'rec');
      }
      return cls.join(' ');
    }
    paint() {
      if (!this.open) return;
      const info = this.bandInfo();
      this.pop.querySelectorAll('.dp-cell[data-date]').forEach(c => {
        c.className = 'dp-cell ' + this.cellCls(toDate(c.dataset.date), info);
      });
      const dur = this.pop.querySelector('.dpr-dur');
      if (dur) dur.textContent = this.duration();
      this.sync();
    }

    /* ---------- rendering ---------- */
    render() {
      const p = this.pop;
      if (!this.open) { p.hidden = true; p.innerHTML = ''; this.tip.hidden = true; return; }
      p.hidden = false;
      p.dataset.view = this.view;
      const body = this.view === 'recommended' && this.recs.length ? this.recHTML() : this.monthsHTML();
      p.innerHTML = `<div class="dpr-main">${this.sideHTML()}<div class="dpr-content">${body}</div></div>` +
        `<div class="dp-note" role="alert"${this.note ? '' : ' hidden'}>${this.note ? I.warn + `<span>${esc(this.note)}</span>` : ''}</div>` +
        this.footHTML();
      const list = p.querySelector('.dp-ylist'), sel = list && list.querySelector('.dp-year[tabindex="0"]');
      if (sel) list.scrollTop = sel.offsetTop - list.clientHeight / 2 + sel.offsetHeight / 2;
      if (this._focus) {
        const t = p.querySelector(this._focus);
        this._focus = null;
        if (t) t.focus();
      }
      if (!this.tip.hidden) this.tip.hidden = true;
      if (this.pinned) requestAnimationFrame(() => this.hideTip());
      this.sync();
    }

    sideHTML() {
      const list = this.presets(), on = this.activePreset(list);
      return `<div class="dpr-side" role="group" aria-label="Quick ranges">` + list.map((p, i) =>
        `<button type="button" class="dpr-preset${i === on ? ' is-on' : ''}" data-act="preset" data-i="${i}" aria-pressed="${i === on}">${esc(p.label)}</button>`
      ).join('') + `</div>`;
    }

    tabKey() {
      const vis = d => d && this.months.some(m => mIndex(m) === mIndex(d));
      for (const d of [this.focusDate, this.draft.start, this.today]) if (vis(d)) return toKey(d);
      return toKey(this.months[0]);
    }

    monthsHTML() {
      const info = this.bandInfo(), tk = this.tabKey();
      return `<div class="dpr-months">${[0, 1].map(i => this.monthHTML(i, info, tk)).join('')}</div>`;
    }

    monthHTML(i, info, tk) {
      const ds = this.o.ds, m = this.months[i], y = m.getFullYear(), mo = m.getMonth();
      const nav = (act, label, icon) => `<button type="button" class="dp-nav" data-act="${act}" data-panel="${i}" aria-label="${label}">${icon}</button>`;
      const L = ds === 'mui' ? I.muiL : I.chevL, R = ds === 'mui' ? I.muiR : I.chevR;
      const text = ds === 'ant' ? `${MONTHS_SHORT[mo]} ${y}` : ds === 'custom' ? `${MONTHS[mo]}, ${y}` : `${MONTHS[mo]} ${y}`;
      const title = ds === 'mui'
        ? `<span class="dp-title is-static">${text}</span>`
        : `<button type="button" class="dp-title" data-act="years" data-panel="${i}" aria-expanded="${this.yearsFor === i}" aria-label="Choose year, ${MONTHS[mo]} ${y}">${text}</button>`;
      const head = ds === 'ant'
        ? nav('prevY', 'Previous year', I.dblL) + nav('prev', 'Previous month', L) + title + nav('next', 'Next month', R) + nav('nextY', 'Next year', I.dblR)
        : nav('prev', 'Previous month', L) + title + nav('next', 'Next month', R);

      const off = (new Date(y, mo, 1).getDay() + 6) % 7, dim = daysIn(y, mo);
      const cells = [];
      for (let k = 0; k < off; k++) cells.push('<div class="dp-cell is-empty" role="gridcell"></div>');
      for (let d = 1; d <= dim; d++) cells.push(this.cellHTML(new Date(y, mo, d), info, tk));
      while (cells.length % 7) cells.push('<div class="dp-cell is-empty" role="gridcell"></div>');
      let rows = '';
      for (let k = 0; k < cells.length; k += 7) rows += `<div class="dp-row" role="row">${cells.slice(k, k + 7).join('')}</div>`;

      return `<div class="dpr-month" data-panel="${i}"><div class="dp-head">${head}</div><div class="dp-days">` +
        `<div class="dp-weekdays" role="row">${WD[ds].map((w, j) => `<span role="columnheader" aria-label="${WD_LONG[j]}">${w}</span>`).join('')}</div>` +
        `<div class="dp-grid" role="grid" aria-label="${MONTHS[mo]} ${y}">${rows}</div></div>` +
        (this.yearsFor === i ? this.yearsHTML(i) : '') + `</div>`;
    }

    cellHTML(d, info, tk) {
      const k = toKey(d), ev = this.o.events[k], un = this.unavailReason(d);
      const { start, end } = this.draft;
      const isS = same(d, start), isE = same(d, end), tod = same(d, this.today);
      const inSel = start && end && d > start && d < end;
      const rec = this.recs.find(r => d >= r.start && d <= r.end);
      const recEdge = this.recs.some(r => same(r.start, d) || same(r.end, d));
      const cls = ['dp-day'];
      if (tod) cls.push('is-today');
      if (recEdge) cls.push('is-rec');
      if (isS || isE) cls.push('is-selected');
      if (un) cls.push('is-unavail');
      if (un && DP.prototype.isOut.call(this, d)) cls.push('is-out');
      if (ev) cls.push('has-ev');
      if (this.o.demo.hover === k) cls.push('is-hover');
      const n = ev ? Math.min((ev.items && ev.items.length) || 1, 3) : 0;
      let label = `${WD_LONG[(d.getDay() + 6) % 7]}, ${longDate(d)}`;
      label += isS && isE ? ', start and end date' : isS ? ', start date' : isE ? ', end date' : inSel ? ', in selected range' : '';
      if (tod) label += ', today';
      if (rec) label += ', in recommended range';
      if (n) label += `, ${n} event${n > 1 ? 's' : ''}`;
      if (un) label += ', not available';
      const marks = (tod ? '<i class="dp-dot"></i>' : '') + (n ? `<span class="dp-ev">${'<i></i>'.repeat(n)}</span>` : '');
      return `<div class="dp-cell ${this.cellCls(d, info)}" data-date="${k}" role="gridcell" aria-selected="${!!(isS || isE || inSel)}">` +
        `<button type="button" class="${cls.join(' ')}" data-act="day" data-date="${k}" tabindex="${k === tk ? 0 : -1}" aria-label="${label}"` +
        `${un ? ' aria-disabled="true"' : ''}${ev || rec || un ? ` aria-describedby="${this.id}-tip"` : ''}>` +
        `<span class="dp-num">${d.getDate()}</span>${marks ? `<span class="dp-marks">${marks}</span>` : ''}</button></div>`;
    }

    yearsHTML(i) {
      const vy = this.months[i].getFullYear();
      const a = this.min ? this.min.getFullYear() : Math.min(1920, vy), b = this.max ? this.max.getFullYear() : Math.max(2080, vy);
      let html = '';
      for (let y = a; y <= b; y++) {
        html += `<button type="button" class="dp-year${y === vy ? ' is-selected' : ''}" data-act="year" data-panel="${i}" data-y="${y}" tabindex="${y === vy ? 0 : -1}" aria-pressed="${y === vy}">${y}</button>`;
      }
      return `<div class="dp-years-pop dpr-years"><div class="dp-years dp-ylist" role="group" aria-label="Choose year">${html}</div></div>`;
    }

    recHTML() {
      const sel = this.recs.findIndex(r => same(r.start, this.draft.start) && same(r.end, this.draft.end));
      const tab = sel >= 0 ? sel : 0;
      const sum = this.o.recommendationSummary;
      return `<div class="dpr-rec">${sum ? `<p class="dpr-rec-sum">${esc(sum)}</p>` : ''}` +
        `<div class="dpr-cards" role="radiogroup" aria-label="Recommended ranges">` + this.recs.map((r, i) =>
          `<button type="button" class="dpr-card${i === sel ? ' is-on' : ''}" role="radio" aria-checked="${i === sel}" data-act="rec" data-i="${i}" tabindex="${i === tab ? 0 : -1}">` +
          `<span class="dpr-radio" aria-hidden="true"></span><span class="dpr-card-body">` +
          `<span class="dpr-card-title">${esc(dayLong(r.start))} – ${esc(dayLong(r.end))}</span>` +
          (r.reason ? `<span class="dpr-card-desc">${esc(r.reason)}</span>` : '') +
          (r.checks && r.checks.length ? `<span class="dpr-card-checks">${r.checks.map(c => `<span>${I.check}${esc(c)}</span>`).join('<i class="dpr-dot" aria-hidden="true"></i>')}</span>` : '') +
          `</span></button>`
        ).join('') + `</div></div>`;
    }

    footHTML() {
      const k = ic => `<kbd>${ic}</kbd>`;
      return `<div class="dp-foot dpr-foot">` +
        `<span class="dp-keys" aria-hidden="true">${k(I.aR)}${k(I.aL)}${k(I.aU)}${k(I.aD)}<span>navigate</span></span>` +
        `<span class="dp-keys dpr-keys2" aria-hidden="true">${k(I.enter)}<span>select</span></span>` +
        `<span class="dpr-actions"><span class="dpr-dur" aria-live="polite">${esc(this.duration())}</span>` +
        (this.o.confirm ? `<button type="button" class="dp-btn" data-act="cancel">Cancel</button><button type="button" class="dp-btn is-primary" data-act="done">Done</button>` : '') +
        `</span></div>`;
    }

    /* ---------- tooltip (shares placement with the date picker) ---------- */
    tipHTML(k) {
      const d = toDate(k), ev = this.o.events[k], un = this.unavailReason(d);
      const rec = this.recs.find(r => d >= r.start && d <= r.end);
      let h = '';
      if (un) h += `<div class="dp-tip-sec"><div class="dp-tip-h">${I.ban}<span>Not available</span></div><p>${esc(un)}</p></div>`;
      if (rec) {
        h += `<div class="dp-tip-sec"><div class="dp-tip-h">${sparkle()}<span>${esc(rec.title || 'Why this date range?')}</span></div>` +
          (rec.reason ? `<p>${esc(rec.reason)}</p>` : '') +
          (rec.checks && rec.checks.length ? `<ul class="dp-tip-checks">${rec.checks.map(c => `<li>${I.check}<span>${esc(c)}</span></li>`).join('')}</ul>` : '') + `</div>`;
      }
      if (ev) {
        const n = (ev.items && ev.items.length) || 1;
        h += `<div class="dp-tip-sec"><div class="dp-tip-h"><span>${esc(ev.title || `${n} Appointment${n > 1 ? 's' : ''} scheduled`)}</span></div>` +
          `<ul class="dp-tip-ev">${(ev.items || []).map(x => `<li><i></i><span>${esc(x)}</span></li>`).join('')}</ul></div>`;
      }
      return h;
    }
    showTip(b) { return DP.prototype.showTip.call(this, b); }
    placeTip(b) { return DP.prototype.placeTip.call(this, b); }
    hideTip(force) { return DP.prototype.hideTip.call(this, force); }

    /* ---------- behaviour ---------- */
    announce() {
      if (!this.open) return;
      const [a, b] = this.months;
      this.sr.textContent = `${MONTHS[a.getMonth()]} ${a.getFullYear()} and ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
    }
    showDraft() {
      // Mirror the calendar draft in the fields; remembered so blur doesn't treat it as typed input.
      this.drafted = {
        start: this.inputs.start.value = this.draft.start ? fmt(this.draft.start) : '',
        end: this.inputs.end.value = this.draft.end ? fmt(this.draft.end) : ''
      };
    }
    showValue() {
      this.inputs.start.value = this.committed.start = this.value.start ? fmt(this.value.start) : this.committed.start;
      this.inputs.end.value = this.committed.end = this.value.end ? fmt(this.value.end) : this.committed.end;
    }
    emit() {
      if (typeof this.o.onChange === 'function') this.o.onChange(this.getValue(), this);
    }

    openPop(kbd, part) {
      if (this.open || this.isStatic()) return;
      this.open = true;
      this.view = 'days';
      this.note = null;
      this.hover = null;
      this.draft = Object.assign({}, this.value);
      this.active = part || (this.value.start && !this.value.end ? 'end' : 'start');
      this.editPart = part && this.value.start && this.value.end ? part : null;
      const anchor = this.draft[this.active] || this.draft.start || this.today;
      this.months = [monthOf(anchor), addMonths(monthOf(anchor), 1)];
      if (this.active === 'end' && this.draft.end && this.draft.start) this.months = this.monthsFor(this.draft.start, this.draft.end);
      this.focusDate = anchor;
      if (kbd) this._focus = '.dp-day[tabindex="0"]';
      this.render();
      this.announce();
    }
    close(focusInput = true) {
      if (!this.open) return;
      this.open = false;
      this.view = 'days';
      this.yearsFor = null;
      this.hover = null;
      this.note = null;
      this.hideTip(true);
      this.render();
      if (focusInput) this.inputs[this.active === 'end' && !this.value.end ? 'end' : 'start'].focus();
    }
    cancel(focusInput = true) {
      if (!this.open) return;
      this.draft = Object.assign({}, this.value);
      this.inputs.start.value = this.committed.start;
      this.inputs.end.value = this.committed.end;
      this.close(focusInput);
    }
    commitDraft() {
      const { start, end } = this.draft;
      const msg = !start ? 'Select a start date' : !end ? 'Select an end date' : this.rangeError(start, end);
      if (msg) { this.note = msg; this.render(); return; }
      this.value = { start, end };
      this.error = null;
      this.errorPart = null;
      this.showValue();
      this.active = 'start';
      this.close(true);
      this.emit();
    }
    commitPart(part) {
      const inp = this.inputs[part], label = part === 'start' ? this.o.startLabel : this.o.endLabel;
      const fail = msg => { this.error = msg; this.errorPart = part; this.committed[part] = inp.value; this.sync(); };
      const r = parseText(inp.value);
      if (r.error) return fail(`${label}: ${lowerFirst(r.error)}`);
      const d = r.date || null;
      if (d) {
        const why = this.unavailReason(d);
        if (why) return fail(`${fmt(d)} is not available — ${trimDot(why)}`);
      }
      this.value[part] = d;
      this.draft[part] = d;
      inp.value = this.committed[part] = d ? fmt(d) : '';
      const { start, end } = this.value;
      if (start && end) {
        const msg = this.rangeError(start, end);
        if (msg) return fail(msg);
      }
      this.error = null;
      this.errorPart = null;
      if (this.open) { this.months = this.monthsFor(this.draft.start || d, this.draft.end); this.render(); }
      this.sync();
      if ((start && end) || (!start && !end)) this.emit();
    }
    checkPartial() {
      if (this.o.static || this.error) return;
      const { start, end } = this.value;
      if (!!start !== !!end) {
        this.error = start ? 'Please enter end date' : 'Please enter start date';
        this.errorPart = start ? 'end' : 'start';
        this.sync();
      }
    }

    pick(d, kbd) {
      if (this.unavailReason(d)) return;
      const { start, end } = this.draft;
      if (this.active === 'end' && start) {
        if (d < start) this.draft = { start: d, end: null };              // earlier than start → becomes the new start
        else if (same(d, start) && !this.o.allowSingleDay) return;
        else { this.draft = { start, end: d }; this.active = 'start'; }
      } else if (this.editPart === 'start' && end && d <= end) {
        this.draft = { start: d, end };                                   // editing only the start of a complete range
      } else {
        this.draft = { start: d, end: null };                             // a new range begins
        this.active = 'end';
      }
      this.editPart = null;
      this.hover = null;
      this.note = null;
      this.focusDate = d;
      const s = this.draft.start, e = this.draft.end;
      if (s && e) {
        const msg = this.rangeError(s, e);
        if (msg) { this.note = msg; this.draft.end = null; this.active = 'end'; }
      }
      this.showDraft();
      if (s && e && !this.note && !this.o.confirm) return this.commitDraft();
      if (kbd) this._focus = `.dp-day[data-date="${toKey(d)}"]`;
      this.render();
    }

    shift(i, n, kbd, act) {
      if (this.o.ds !== 'custom') this.months = this.months.map(m => addMonths(m, n));
      else {
        const m = this.months.slice();
        m[i] = addMonths(m[i], n);
        if (mIndex(m[0]) >= mIndex(m[1])) { if (i === 0) m[1] = addMonths(m[0], 1); else m[0] = addMonths(m[1], -1); }
        this.months = m;
      }
      this.yearsFor = null;
      if (kbd) this._focus = `[data-act="${act}"][data-panel="${i}"]`;
      this.render();
      this.announce();
    }

    bind() {
      const r = this.root, box = r.querySelector('.dp-box');
      for (const part of ['start', 'end']) {
        const inp = this.inputs[part];
        inp.addEventListener('focus', () => {
          this.focused = true;
          if (this.open) { this.active = part; this.editPart = part; this.paint(); }
          this.sync();
        });
        inp.addEventListener('blur', () => {
          this.focused = false;
          const typed = inp.value !== this.committed[part] && !(this.open && this.drafted && inp.value === this.drafted[part]);
          if (!this.o.static && typed) this.commitPart(part);
          this.sync();
        });
        inp.addEventListener('input', () => {
          if (!this.errorPart || this.errorPart === part) { this.error = null; this.errorPart = null; }
          this.sync();
        });
        inp.addEventListener('keydown', e => {
          if (this.isStatic()) return;
          if (e.key === 'Enter') { e.preventDefault(); this.commitPart(part); }
          else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.active = part;
            if (this.open) { this._focus = '.dp-day[tabindex="0"], .dpr-card[tabindex="0"]'; this.render(); }
            else this.openPop(true, part);
          } else if (e.key === 'Escape' && this.open) { e.preventDefault(); this.cancel(); }
        });
      }

      box.addEventListener('click', e => {
        if (this.isStatic()) return;
        if (e.target.closest('.dp-clear')) {
          this.value = { start: null, end: null };
          this.draft = { start: null, end: null };
          this.inputs.start.value = this.inputs.end.value = this.committed.start = this.committed.end = '';
          this.error = null; this.errorPart = null;
          this.active = 'start';
          this.open ? this.render() : this.sync();
          this.emit();
          this.inputs.start.focus();
          return;
        }
        const trig = e.target.closest('.dp-trigger');
        if (trig && this.open) return this.cancel();
        const part = (e.target.closest('.dpr-in') || {}).dataset?.part;
        if (!this.open) this.openPop(trig ? e.detail === 0 : false, part);
        else if (part) { this.active = part; this.editPart = part; this.paint(); }
        if (!trig && !part) this.inputs[this.active].focus();
      });

      this.pop.addEventListener('mousedown', e => {
        if (!e.target.closest('.dp-ylist') || e.target.closest('button')) e.preventDefault();
      });
      this.pop.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (b) this.act(b.dataset.act, b, e.detail === 0);
      });
      this.pop.addEventListener('keydown', e => this.onKey(e));
      const preview = b => {
        const k = b.dataset.date;
        if (k !== this.hover) { this.hover = k; this.paint(); }
      };
      this.pop.addEventListener('mouseover', e => {
        const b = e.target.closest('.dp-day');
        if (!b) return;
        this.showTip(b);
        preview(b);
      });
      this.pop.addEventListener('mouseout', e => {
        const b = e.target.closest('.dp-day');
        if (b && !b.contains(e.relatedTarget)) this.hideTip();
        if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.dp-grid')) {
          if (this.hover && e.target.closest('.dp-grid')) { this.hover = null; this.paint(); }
        }
      });
      this.pop.addEventListener('focusin', e => {
        const b = e.target.closest('.dp-day');
        if (b) { this.showTip(b); preview(b); }
      });
      this.pop.addEventListener('focusout', e => { if (e.target.closest('.dp-day')) this.hideTip(); });
      r.addEventListener('focusout', () => setTimeout(() => {
        if (!this.root || this.root.contains(document.activeElement)) return;
        if (this.open && !this.o.inline) this.cancel(false);
        this.checkPartial();
      }, 0));
    }

    act(a, b, kbd) {
      const i = +b.dataset.panel;
      switch (a) {
        case 'preset': {
          const list = this.presets(), p = list[+b.dataset.i];
          this.note = null;
          if (p.view) {
            this.view = p.view === 'recommended' ? 'recommended' : 'days';
            if (this.view === 'days') this.months = this.monthsFor(this.draft.start, this.draft.end);
          } else {
            const [s, e] = p.range(this.today);
            this.draft = { start: s, end: e };
            this.active = 'start';
            this.view = 'days';
            this.months = this.monthsFor(s, e);
            this.focusDate = s;
            this.note = this.rangeError(s, e);
            this.showDraft();
            if (!this.note && !this.o.confirm) return this.commitDraft();
          }
          if (kbd) this._focus = `[data-act="preset"][data-i="${b.dataset.i}"]`;
          this.render();
          return;
        }
        case 'prev': return this.shift(i, -1, kbd, a);
        case 'next': return this.shift(i, 1, kbd, a);
        case 'prevY': return this.shift(i, -12, kbd, a);
        case 'nextY': return this.shift(i, 12, kbd, a);
        case 'years':
          this.yearsFor = this.yearsFor === i ? null : i;
          if (kbd) this._focus = this.yearsFor === i ? '.dp-year[tabindex="0"]' : `[data-act="years"][data-panel="${i}"]`;
          this.render();
          return;
        case 'year': {
          const m = this.months.slice();
          m[i] = new Date(+b.dataset.y, m[i].getMonth(), 1);
          if (mIndex(m[0]) >= mIndex(m[1])) { if (i === 0) m[1] = addMonths(m[0], 1); else m[0] = addMonths(m[1], -1); }
          this.months = m;
          this.yearsFor = null;
          if (kbd) this._focus = `[data-act="years"][data-panel="${i}"]`;
          this.render();
          this.announce();
          return;
        }
        case 'day': return this.pick(toDate(b.dataset.date), kbd);
        case 'rec': {
          const r = this.recs[+b.dataset.i];
          this.draft = { start: r.start, end: r.end };
          this.active = 'start';
          this.note = this.rangeError(r.start, r.end);
          this.showDraft();
          if (!this.note && !this.o.confirm) return this.commitDraft();
          this._focus = `.dpr-card[data-i="${b.dataset.i}"]`;
          this.render();
          return;
        }
        case 'cancel': return this.cancel();
        case 'done': return this.commitDraft();
      }
    }

    onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.yearsFor !== null) {
          const i = this.yearsFor;
          this.yearsFor = null;
          this._focus = `[data-act="years"][data-panel="${i}"]`;
          this.render();
        } else this.cancel();
        return;
      }
      const t = e.target;
      const lists = [['.dp-year', 3], ['.dpr-card', 1], ['.dpr-preset', 1]];
      for (const [sel, cols] of lists) {
        const item = t.closest(sel);
        if (!item) continue;
        const all = [...this.pop.querySelectorAll(sel)], idx = all.indexOf(item);
        const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
        let j = null;
        if (e.key in map) j = idx + map[e.key];
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = all.length - 1;
        if (j === null) return;
        e.preventDefault();
        const next = all[Math.max(0, Math.min(all.length - 1, j))];
        if (sel === '.dpr-card') return this.act('rec', next, true);   // radio: moving selects
        all.forEach(x => (x.tabIndex = -1));
        next.tabIndex = 0;
        next.focus();
        return;
      }
      const day = t.closest('.dp-day');
      if (!day) return;
      const d = toDate(day.dataset.date), dow = (d.getDay() + 6) % 7;
      let nd = null;
      switch (e.key) {
        case 'ArrowLeft': nd = addDays(d, -1); break;
        case 'ArrowRight': nd = addDays(d, 1); break;
        case 'ArrowUp': nd = addDays(d, -7); break;
        case 'ArrowDown': nd = addDays(d, 7); break;
        case 'Home': nd = addDays(d, -dow); break;
        case 'End': nd = addDays(d, 6 - dow); break;
        case 'PageUp': nd = addMonthsKeepDay(d, e.shiftKey ? -12 : -1); break;
        case 'PageDown': nd = addMonthsKeepDay(d, e.shiftKey ? 12 : 1); break;
      }
      if (!nd) return;
      e.preventDefault();
      this.focusDate = nd;
      const k = toKey(nd);
      const target = this.pop.querySelector(`.dp-day[data-date="${k}"]`);
      if (target && target.offsetParent) {
        this.pop.querySelectorAll('.dp-day').forEach(x => (x.tabIndex = -1));
        target.tabIndex = 0;
        target.focus();
        return;
      }
      const right = this.pop.querySelector('.dpr-month[data-panel="1"]');
      const single = !right || !right.offsetParent;
      this.months = single || nd < this.months[0]
        ? [monthOf(nd), addMonths(monthOf(nd), 1)]
        : [addMonths(monthOf(nd), -1), monthOf(nd)];
      this._focus = `.dp-day[data-date="${k}"]`;
      this.render();
      this.announce();
    }
  }

  DateRangePicker.presets = PRESETS;
  global.DateRangePicker = DateRangePicker;
})(window);
