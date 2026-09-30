/*!
 * Calendar Date Picker
 * Vanilla JS component with three skins (custom spec · Ant Design · MUI) and light/dark themes.
 *
 *   const picker = new DatePicker(el, {
 *     ds: 'custom' | 'ant' | 'mui',
 *     theme: 'light' | 'dark',
 *     label: 'Date',
 *     value: '2025-12-10',                    // Date | 'YYYY-MM-DD'
 *     today: '2025-12-02',                    // defaults to the real today
 *     quickActions: [{ label: 'Calendar', view: 'days' }, { label: 'Today', offset: 0 }],
 *     unavailable: { '2025-12-11': 'Provider on leave' },
 *     events: { '2025-12-07': { title: '2 Appointments scheduled', items: ['10:00 AM — Follow-up'] } },
 *     recommended: { '2025-12-24': { reason: '…', checks: ['Provider available'] } },
 *     recommendation: { summary: '…', candidates: ['2025-12-22', …] },  // enables the "Recommended" view
 *     min, max,                               // Date | 'YYYY-MM-DD'
 *     inline: false,                          // start with the calendar open, in the page flow
 *     closeOnSelect: true,                    // close the calendar once a date is picked (click the field to reopen)
 *     onChange: (date, picker) => {}
 *   });
 *   picker.setDS('ant'); picker.setTheme('dark');
 */
(function (global) {
  'use strict';

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WD_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const WD = {
    custom: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    ant: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    mui: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  };

  const pad = n => String(n).padStart(2, '0');
  const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toDate = v => {
    if (!v) return null;
    if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    const [y, m, d] = String(v).split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const monthOf = d => new Date(d.getFullYear(), d.getMonth(), 1);
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const addMonthsKeepDay = (d, n) => {
    const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
    return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), daysIn(t.getFullYear(), t.getMonth())));
  };
  const fmt = d => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
  const longDate = d => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const svg = (d, o = {}) =>
    `<svg viewBox="${o.vb || '0 0 24 24'}" fill="${o.fill || 'none'}" stroke="${o.fill ? 'none' : 'currentColor'}" stroke-width="${o.sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const I = {
    cal: svg('<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/><path d="M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 17.5h.01M12 17.5h.01M16.5 17.5h.01" stroke-width="2.4"/>', { sw: 1.8 }),
    calAnt: svg('<path d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zM184 392V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136H184z"/>', { vb: '64 64 896 896', fill: 'currentColor' }),
    calMui: svg('<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>', { fill: 'currentColor' }),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5H8.5"/>', { sw: 1.8 }),
    clockAnt: svg('<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"/>', { vb: '64 64 896 896', fill: 'currentColor' }),
    clockMui: svg('<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>', { fill: 'currentColor' }),
    clear: svg('<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"/>', { vb: '64 64 896 896', fill: 'currentColor' }),
    chevL: svg('<path d="m15 18-6-6 6-6"/>'),
    chevR: svg('<path d="m9 18 6-6-6-6"/>'),
    chevD: svg('<path d="m6 9 6 6 6-6"/>'),
    dblL: svg('<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>'),
    dblR: svg('<path d="m6 17 5-5-5-5M13 17l5-5-5-5"/>'),
    muiL: svg('<path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>', { fill: 'currentColor' }),
    muiR: svg('<path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>', { fill: 'currentColor' }),
    caret: svg('<path d="M7 10l5 5 5-5z"/>', { fill: 'currentColor' }),
    warn: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>', { sw: 2.2 }),
    ban: svg('<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>'),
    aR: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    aL: svg('<path d="M19 12H5M11 18l-6-6 6-6"/>'),
    aU: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    aD: svg('<path d="M12 5v14M18 13l-6 6-6-6"/>'),
    enter: svg('<path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>')
  };

  let gid = 0;
  const sparkle = () => {
    const id = 'dpg' + (++gid);
    return `<svg class="dp-spark" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c534ff"/><stop offset="1" stop-color="#f6339a"/></linearGradient></defs><path fill="url(#${id})" d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96l-6.13 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 2.5v4M22 4.5h-4" stroke="url(#${id})" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  };

  // Forgiving mm/dd/yyyy parser shared by the date and date range pickers.
  const parseText = text => {
    const t = String(text).trim();
    if (!t) return { empty: true };
    let m = t.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d+)$/);
    if (!m && /^\d{8}$/.test(t)) m = [t, t.slice(0, 2), t.slice(2, 4), t.slice(4)];
    if (!m) return { error: 'Please enter the date as mm/dd/yyyy' };
    const mo = +m[1], da = +m[2], y = +m[3];
    if (m[3].length !== 4) return { error: 'Please enter a four-digit year' };
    if (mo < 1 || mo > 12) return { error: 'Please enter appropriate month' };
    const dim = daysIn(y, mo - 1);
    if (da < 1 || da > dim) return { error: `${MONTHS[mo - 1]} ${y} has ${dim} days — please enter a valid day` };
    return { date: new Date(y, mo - 1, da) };
  };

  // Forgiving time parser shared by the time components: '9:42 AM', '9 : 42 pm', '942p', '21:42', '0942', '9'.
  // In 12-hour mode an hour from 1–12 needs AM or PM (typed, or passed in as `mer`); it is never guessed.
  const parseTime = (text, h12, mer) => {
    const t = String(text).toLowerCase().replace(/\s+/g, '');
    if (!t) return { empty: true };
    const m = t.match(/^(\d{1,2})(?:[:.h]?(\d{2}))?(a|am|p|pm)?$/);
    if (!m) return { error: 'Please enter the time as hh:mm' };
    let h = +m[1];
    const mi = m[2] != null ? +m[2] : 0;
    const typed = m[3] ? (m[3][0] === 'p' ? 'PM' : 'AM') : null;
    if (mi > 59) return { error: 'Please enter minutes from 00 to 59' };
    if (typed) {
      if (h < 1 || h > 12) return { error: 'Please enter an hour from 1 to 12' };
      h = (h % 12) + (typed === 'PM' ? 12 : 0);
    } else if (h > 23) {
      return { error: 'Please enter an hour from 0 to 23' };
    } else if (h12 && h >= 1 && h <= 12) {
      if (!mer) return { error: 'Please add AM or PM' };
      h = (h % 12) + (mer === 'PM' ? 12 : 0);
    }
    return { h, m: mi };
  };

  let uid = 0;

  class DatePicker {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({
        ds: 'custom', theme: 'light', label: 'Date',
        quickActions: null, events: {}, recommended: {}, unavailable: {}, recommendation: null,
        inline: false, closeOnSelect: true, static: false, disabled: false, state: null, error: null, text: null, demo: {}
      }, opts);
      this.id = 'dp' + (++uid);
      this.today = toDate(this.o.today) || toDate(new Date());
      this.value = toDate(this.o.value);
      this.min = toDate(this.o.min);
      this.max = toDate(this.o.max);
      this.error = this.o.error;
      this.view = this.o.demo.view || 'days';
      this.viewDate = monthOf(toDate(this.o.viewMonth) || this.value || this.today);
      this.focusDate = this.value || this.today;
      this.decade = Math.floor(this.viewDate.getFullYear() / 10) * 10;
      this.open = !!this.o.inline;
      this.pinned = this.o.demo.tooltip || null;
      this.collapsed = {};
      this.text = this.o.text != null ? this.o.text : (this.value ? fmt(this.value) : '');

      this._onDoc = e => {
        if (this.open && !this.o.inline && this.root && !this.root.contains(e.target)) this.close(false);
      };
      this._onResize = () => {
        if (this.tip && !this.tip.hidden) {
          const b = this.pop.querySelector(`.dp-day[data-date="${this.tip.dataset.for}"]`);
          if (b) this.placeTip(b);
        }
      };
      document.addEventListener('pointerdown', this._onDoc);
      window.addEventListener('resize', this._onResize);
      this.build();
    }

    /* ---------- public API ---------- */
    setDS(ds) {
      if (ds === this.o.ds) return;
      this.text = this.input.value;
      this.o.ds = ds;
      this.decade = Math.floor(this.viewDate.getFullYear() / 10) * 10;
      if (this.view === 'months' && ds !== 'ant') this.view = 'days';
      this.build();
    }
    setTheme(t) {
      this.o.theme = t;
      this.root.dataset.theme = t;
    }
    getValue() { return this.value; }
    destroy() {
      document.removeEventListener('pointerdown', this._onDoc);
      window.removeEventListener('resize', this._onResize);
      this.el.innerHTML = '';
    }

    /* ---------- structure ---------- */
    build() {
      const o = this.o;
      this.el.innerHTML =
        `<div class="dp" id="${this.id}" data-ds="${o.ds}" data-theme="${o.theme}">` +
        this.fieldHTML() +
        `<div class="dp-msg" id="${this.id}-msg" aria-live="polite" hidden></div>` +
        `<div class="dp-tip" id="${this.id}-tip" role="tooltip" hidden></div>` +
        `<div class="dp-sr" aria-live="polite"></div></div>`;
      this.root = this.el.firstElementChild;
      this.input = this.root.querySelector('.dp-input');
      this.pop = this.root.querySelector('.dp-pop');
      this.msg = this.root.querySelector('.dp-msg');
      this.tip = this.root.querySelector('.dp-tip');
      this.sr = this.root.querySelector('.dp-sr');
      this.input.value = this.text;
      this.committed = this.text;
      if (o.static) { this.input.readOnly = true; this.input.tabIndex = -1; }
      this.bind();
      this.sync();
      this.renderPop();
    }

    fieldHTML() {
      const { ds, label } = this.o, id = this.id;
      const input = `<input id="${id}-in" class="dp-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" ` +
        `placeholder="${ds === 'mui' ? 'MM/DD/YYYY' : 'mm/dd/yyyy'}" aria-haspopup="dialog" aria-expanded="false" ` +
        `aria-controls="${id}-pop" aria-describedby="${id}-msg">`;
      const pop = `<div class="dp-pop" id="${id}-pop" role="dialog" aria-label="Choose ${esc(label.toLowerCase())}" hidden></div>`;
      const lab = `<label class="dp-label" for="${id}-in">${esc(label)}</label>`;
      if (ds === 'mui') {
        return `<div class="dp-control"><div class="dp-box">${lab}${input}` +
          `<button type="button" class="dp-trigger" aria-label="Choose date">${I.calMui}</button>` +
          `<fieldset class="dp-outline" aria-hidden="true"><legend><span>${esc(label)}</span></legend></fieldset></div>${pop}</div>`;
      }
      if (ds === 'ant') {
        return `${lab}<div class="dp-control"><div class="dp-box">${input}<span class="dp-suffix">` +
          `<span class="dp-icon">${I.calAnt}</span>` +
          `<button type="button" class="dp-clear" tabindex="-1" aria-label="Clear date">${I.clear}</button></span></div>${pop}</div>`;
      }
      return `${lab}<div class="dp-control"><div class="dp-box"><span class="dp-icon">${I.cal}</span>${input}</div>${pop}</div>`;
    }

    isStatic() { return this.o.static || this.o.disabled || this.o.state === 'disabled'; }

    sync() {
      const r = this.root, st = this.o.state, disabled = this.o.disabled || st === 'disabled';
      const openLook = this.open && !this.o.inline;
      r.classList.toggle('is-inline', !!this.o.inline);
      r.classList.toggle('is-open', openLook);
      r.classList.toggle('is-active', st === 'active');
      r.classList.toggle('is-focused', !!this.focused || st === 'focused');
      r.classList.toggle('is-disabled', disabled);
      r.classList.toggle('is-error', !!this.error);
      r.classList.toggle('has-value', !!this.input.value);
      r.classList.toggle('is-float', !!this.input.value || !!this.focused || openLook || st === 'focused' || st === 'active');
      this.input.disabled = disabled;
      this.input.setAttribute('aria-expanded', String(this.open));
      this.input.setAttribute('aria-invalid', String(!!this.error));
      this.msg.hidden = !this.error;
      this.msg.innerHTML = this.error ? (this.o.ds === 'custom' ? I.warn : '') + `<span>${esc(this.error)}</span>` : '';
    }

    /* ---------- data helpers ---------- */
    actions() {
      if (this.o.quickActions) return this.o.quickActions;
      return this.o.recommendation
        ? [{ label: 'Calendar', view: 'days' }, { label: 'Recommended', view: 'recommended' }, { label: 'Today', offset: 0 }]
        : [{ label: 'Calendar', view: 'days' }, { label: 'Today', offset: 0 }, { label: 'Yesterday', offset: -1 }];
    }
    unavailReason(d) {
      const k = toKey(d);
      if (this.o.unavailable[k]) return this.o.unavailable[k];
      if (this.min && d < this.min) return this.o.minReason || `Dates before ${longDate(this.min)} can't be selected.`;
      if (this.max && d > this.max) return this.o.maxReason || `Dates after ${longDate(this.max)} can't be selected.`;
      if (typeof this.o.isUnavailable === 'function') return this.o.isUnavailable(d) || null;
      return null;
    }
    // Outside min/max (e.g. future dates): disabled, but shown without the strike line.
    isOut(d) {
      return !this.o.unavailable[toKey(d)] && ((this.min && d < this.min) || (this.max && d > this.max));
    }
    parse(text) {
      const r = parseText(text);
      if (!r.date) return r;
      const d = r.date;
      const why = this.unavailReason(d);
      if (why) return { error: `${fmt(d)} is not available — ${why.replace(/\.$/, '')}` };
      return { date: d };
    }

    /* ---------- popup rendering ---------- */
    renderPop() {
      const p = this.pop;
      if (!this.open) { p.hidden = true; p.innerHTML = ''; return; }
      p.hidden = false;
      p.dataset.view = this.view;
      p.innerHTML = this.quickHTML() + `<div class="dp-body">${this.bodyHTML()}</div>` + this.footHTML();

      if (this.view === 'years' && this.o.ds !== 'ant') {
        const list = p.querySelector('.dp-ylist'), sel = list && list.querySelector('.dp-year[tabindex="0"]');
        if (sel) list.scrollTop = sel.offsetTop - list.clientHeight / 2 + sel.offsetHeight / 2;
      }
      if (this._focus) {
        const t = p.querySelector(this._focus);
        this._focus = null;
        if (t) t.focus();
      }
      if (!this.tip.hidden) this.tip.hidden = true;
      if (this.pinned) requestAnimationFrame(() => this.hideTip());
    }

    quickHTML() {
      const qa = this.actions();
      if (!qa.length) return '';
      const cur = this.view === 'recommended' ? 'recommended' : 'days';
      return `<div class="dp-quick" role="group" aria-label="Quick actions"><div class="dp-quick-in">` +
        qa.map((a, i) => {
          const on = !!a.view && a.view === cur;
          return `<button type="button" class="dp-qa${on ? ' is-on' : ''}" data-act="qa" data-i="${i}"${a.view ? ` aria-pressed="${on}"` : ''}>${esc(a.label)}</button>`;
        }).join('') + `</div></div>`;
    }

    bodyHTML() {
      const v = this.view, ds = this.o.ds;
      if (v === 'recommended' && this.o.recommendation) return this.recHTML();
      if (v === 'years' && ds !== 'custom') return this.headHTML() + this.yearsHTML();
      if (v === 'months') return this.headHTML() + this.monthsHTML();
      return this.headHTML() + this.daysHTML() + (v === 'years' ? this.yearsHTML() : '');
    }

    headHTML() {
      const ds = this.o.ds, v = this.view, y = this.viewDate.getFullYear(), m = this.viewDate.getMonth();
      const nav = (act, label, icon) => `<button type="button" class="dp-nav" data-act="${act}" aria-label="${label}">${icon}</button>`;
      if (ds === 'ant') {
        if (v === 'years') {
          return `<div class="dp-head">${nav('prevDec', 'Previous decade', I.dblL)}<div class="dp-title-group"><span class="dp-title is-static">${this.decade}-${this.decade + 9}</span></div>${nav('nextDec', 'Next decade', I.dblR)}</div>`;
        }
        if (v === 'months') {
          return `<div class="dp-head">${nav('prevY', 'Previous year', I.dblL)}<div class="dp-title-group"><button type="button" class="dp-title" data-act="years" aria-label="Choose year, ${y}">${y}</button></div>${nav('nextY', 'Next year', I.dblR)}</div>`;
        }
        return `<div class="dp-head">${nav('prevY', 'Previous year', I.dblL)}${nav('prev', 'Previous month', I.chevL)}` +
          `<div class="dp-title-group"><button type="button" class="dp-title" data-act="months" aria-label="Choose month, ${MONTHS[m]}">${MONTHS_SHORT[m]}</button>` +
          `<button type="button" class="dp-title" data-act="years" aria-label="Choose year, ${y}">${y}</button></div>` +
          `${nav('next', 'Next month', I.chevR)}${nav('nextY', 'Next year', I.dblR)}</div>`;
      }
      if (ds === 'mui') {
        const open = v === 'years';
        return `<div class="dp-head"><button type="button" class="dp-title" data-act="title" aria-expanded="${open}" aria-label="${open ? 'Year view is open, switch to calendar view' : 'Calendar view is open, switch to year view'}">` +
          `<span>${MONTHS[m]} ${y}</span><span class="dp-caret">${I.caret}</span></button>` +
          `<span class="dp-navs">${open ? '' : nav('prev', 'Previous month', I.muiL) + nav('next', 'Next month', I.muiR)}</span></div>`;
      }
      const yv = v === 'years';
      return `<div class="dp-head">${nav('prev', yv ? 'Previous years' : 'Previous month', I.chevL)}` +
        `<button type="button" class="dp-title" data-act="title" aria-expanded="${yv}" aria-label="Choose year, ${MONTHS[m]} ${y}">${MONTHS[m]} ${y}</button>` +
        `${nav('next', yv ? 'Next years' : 'Next month', I.chevR)}</div>`;
    }

    tabKey() {
      const y = this.viewDate.getFullYear(), m = this.viewDate.getMonth();
      const inView = d => d && d.getFullYear() === y && d.getMonth() === m;
      if (inView(this.focusDate)) return toKey(this.focusDate);
      if (inView(this.value)) return toKey(this.value);
      if (inView(this.today)) return toKey(this.today);
      return toKey(this.viewDate);
    }

    daysHTML() {
      const ds = this.o.ds, y = this.viewDate.getFullYear(), m = this.viewDate.getMonth();
      const off = (new Date(y, m, 1).getDay() + 6) % 7, dim = daysIn(y, m), tk = this.tabKey();
      const cells = [];
      for (let i = 0; i < off; i++) cells.push('<div class="dp-cell is-empty" role="gridcell"></div>');
      for (let d = 1; d <= dim; d++) cells.push(this.dayHTML(new Date(y, m, d), tk));
      while (cells.length % 7) cells.push('<div class="dp-cell is-empty" role="gridcell"></div>');
      let rows = '';
      for (let i = 0; i < cells.length; i += 7) rows += `<div class="dp-row" role="row">${cells.slice(i, i + 7).join('')}</div>`;
      return `<div class="dp-days"><div class="dp-weekdays" role="row">` +
        WD[ds].map((w, i) => `<span role="columnheader" aria-label="${WD_LONG[i]}">${w}</span>`).join('') +
        `</div><div class="dp-grid" role="grid" aria-label="${MONTHS[m]} ${y}">${rows}</div></div>`;
    }

    dayHTML(d, tk) {
      const k = toKey(d), ev = this.o.events[k], rec = this.o.recommended[k], un = this.unavailReason(d);
      const sel = !!this.value && k === toKey(this.value), tod = k === toKey(this.today), hov = this.o.demo.hover === k;
      const cls = ['dp-day'];
      if (tod) cls.push('is-today');
      if (rec) cls.push('is-rec');
      if (sel) cls.push('is-selected');
      if (un) cls.push('is-unavail');
      if (un && this.isOut(d)) cls.push('is-out');
      if (ev) cls.push('has-ev');
      if (hov) cls.push('is-hover');
      const n = ev ? Math.min((ev.items && ev.items.length) || 1, 3) : 0;
      let label = `${WD_LONG[(d.getDay() + 6) % 7]}, ${longDate(d)}`;
      if (tod) label += ', today';
      if (sel) label += ', selected';
      if (rec) label += ', recommended';
      if (n) label += `, ${n} event${n > 1 ? 's' : ''}`;
      if (un) label += ', not available';
      const marks = (tod ? '<i class="dp-dot"></i>' : '') + (n ? `<span class="dp-ev">${'<i></i>'.repeat(n)}</span>` : '');
      return `<div class="dp-cell${un ? ' is-unavail' : ''}" role="gridcell" aria-selected="${sel}">` +
        `<button type="button" class="${cls.join(' ')}" data-act="day" data-date="${k}" tabindex="${k === tk ? 0 : -1}" aria-label="${label}"` +
        `${un ? ' aria-disabled="true"' : ''}${ev || rec || un ? ` aria-describedby="${this.id}-tip"` : ''}>` +
        `<span class="dp-num">${d.getDate()}</span>${marks ? `<span class="dp-marks">${marks}</span>` : ''}</button></div>`;
    }

    yearsHTML() {
      const ds = this.o.ds, vy = this.viewDate.getFullYear();
      let years = [];
      if (ds === 'ant') for (let i = -1; i < 11; i++) years.push(this.decade + i);
      else {
        // Custom + MUI: one continuous, scrollable list of years.
        const a = this.min ? this.min.getFullYear() : Math.min(1920, vy), b = this.max ? this.max.getFullYear() : Math.max(2080, vy);
        for (let y = a; y <= b; y++) years.push(y);
      }
      const tab = years.includes(vy) ? vy : years[ds === 'ant' ? 1 : 0];
      const list = `<div class="${ds === 'ant' ? 'dp-years' : 'dp-years dp-ylist'}" role="group" aria-label="Choose year">` + years.map(y => {
        const out = ds === 'ant' && (y < this.decade || y > this.decade + 9);
        return `<button type="button" class="dp-year${y === vy ? ' is-selected' : ''}${out ? ' is-out' : ''}" data-act="year" data-y="${y}" tabindex="${y === tab ? 0 : -1}" aria-pressed="${y === vy}">${y}</button>`;
      }).join('') + `</div>`;
      return ds === 'custom' ? `<div class="dp-years-pop">${list}</div>` : list;
    }

    monthsHTML() {
      const m = this.viewDate.getMonth();
      return `<div class="dp-years dp-months" role="group" aria-label="Choose month">` + MONTHS_SHORT.map((n, i) =>
        `<button type="button" class="dp-year dp-month${i === m ? ' is-selected' : ''}" data-act="month" data-m="${i}" tabindex="${i === m ? 0 : -1}" aria-label="${MONTHS[i]}" aria-pressed="${i === m}">${n}</button>`
      ).join('') + `</div>`;
    }

    recHTML() {
      const r = this.o.recommendation, cands = r.candidates.map(toDate), keys = cands.map(toKey);
      const groups = [];
      cands.forEach(d => {
        const gk = `${d.getFullYear()}-${d.getMonth()}`;
        let g = groups.find(x => x.k === gk);
        if (!g) groups.push(g = { k: gk, y: d.getFullYear(), m: d.getMonth(), days: [] });
        g.days.push(d);
      });
      let tk = this.focusDate && keys.includes(toKey(this.focusDate)) ? toKey(this.focusDate)
        : this.value && keys.includes(toKey(this.value)) ? toKey(this.value)
        : keys.find(k => this.o.recommended[k]) || keys[0];
      return `<div class="dp-rec"><p class="dp-rec-sum">${esc(r.summary)}</p>` + groups.map(g => {
        const open = !this.collapsed[g.k];
        return `<div class="dp-group"><button type="button" class="dp-group-h" data-act="group" data-k="${g.k}" aria-expanded="${open}">` +
          `<span>${MONTHS[g.m]} ${g.y}</span>${I.chevD}</button>` +
          (open ? `<div class="dp-rgrid" role="grid" aria-label="${MONTHS[g.m]} ${g.y}">${g.days.map(d => this.dayHTML(d, tk)).join('')}</div>` : '') +
          `</div>`;
      }).join('') + `</div>`;
    }

    footHTML() {
      const k = ic => `<kbd>${ic}</kbd>`;
      return `<div class="dp-foot" aria-hidden="true"><span class="dp-keys">${k(I.aR)}${k(I.aL)}${k(I.aU)}${k(I.aD)}<span>navigate</span></span>` +
        `<span class="dp-keys">${k(I.enter)}<span>select</span></span></div>`;
    }

    /* ---------- tooltip ---------- */
    tipHTML(k) {
      const ev = this.o.events[k], rec = this.o.recommended[k], un = this.unavailReason(toDate(k));
      let h = '';
      if (un) h += `<div class="dp-tip-sec"><div class="dp-tip-h">${I.ban}<span>Not available</span></div><p>${esc(un)}</p></div>`;
      if (rec) {
        h += `<div class="dp-tip-sec"><div class="dp-tip-h">${sparkle()}<span>${esc(rec.title || 'Why this date?')}</span></div><p>${esc(rec.reason)}</p>` +
          (rec.checks && rec.checks.length ? `<ul class="dp-tip-checks">${rec.checks.map(c => `<li>${I.check}<span>${esc(c)}</span></li>`).join('')}</ul>` : '') + `</div>`;
      }
      if (ev) {
        const n = (ev.items && ev.items.length) || 1;
        h += `<div class="dp-tip-sec"><div class="dp-tip-h"><span>${esc(ev.title || `${n} Appointment${n > 1 ? 's' : ''} scheduled`)}</span></div>` +
          `<ul class="dp-tip-ev">${(ev.items || []).map(i => `<li><i></i><span>${esc(i)}</span></li>`).join('')}</ul></div>`;
      }
      return h;
    }
    showTip(btn) {
      const k = btn.dataset.date, h = this.tipHTML(k);
      if (!h) return this.hideTip();
      this.tip.innerHTML = h;
      this.tip.dataset.for = k;
      this.tip.hidden = false;
      this.placeTip(btn);
    }
    placeTip(btn) {
      const rr = this.root.getBoundingClientRect(), br = btn.getBoundingClientRect();
      let left = br.left - rr.left;
      this.tip.style.top = (br.bottom - rr.top + 6) + 'px';
      this.tip.style.left = left + 'px';
      const vw = document.documentElement.clientWidth, tw = this.tip.offsetWidth;
      if (rr.left + left + tw > vw - 12) left = Math.max(12 - rr.left, vw - 12 - tw - rr.left);
      this.tip.style.left = left + 'px';
    }
    hideTip(force) {
      if (this.pinned && !force && this.open) {
        const b = this.pop.querySelector(`.dp-day[data-date="${this.pinned}"]`);
        if (b) return this.showTip(b);
      }
      this.tip.hidden = true;
    }

    /* ---------- behaviour ---------- */
    openPop(kbd) {
      if (this.open || this.isStatic()) return;
      this.open = true;
      this.view = 'days';
      const base = this.value || this.today;
      this.viewDate = monthOf(base);
      this.focusDate = base;
      if (kbd) this._focus = '.dp-day[tabindex="0"]';
      this.sync();
      this.renderPop();
      this.announce();
    }
    close(focusInput = true) {
      if (!this.open) return;
      this.open = false;
      this.view = 'days';
      this.hideTip(true);
      this.sync();
      this.renderPop();
      if (focusInput) this.input.focus();
    }
    select(d, { focus = true } = {}) {
      this.value = d;
      this.focusDate = d;
      this.viewDate = monthOf(d);
      this.error = null;
      this.input.value = this.committed = fmt(d);
      const closing = this.open && this.o.closeOnSelect;
      if (closing) { this.open = false; this.view = 'days'; this.hideTip(true); }
      this.sync();
      this.renderPop();
      if (closing && focus) this.input.focus();
      if (typeof this.o.onChange === 'function') this.o.onChange(d, this);
    }
    commit({ focus = true } = {}) {
      const p = this.parse(this.input.value);
      if (p.empty) {
        this.value = null; this.error = null; this.committed = '';
        this.sync(); this.renderPop();
        if (typeof this.o.onChange === 'function') this.o.onChange(null, this);
        return;
      }
      if (p.error) { this.error = p.error; this.committed = this.input.value; this.sync(); return; }
      this.select(p.date, { focus });
    }
    announce() {
      if (this.open) this.sr.textContent = `${MONTHS[this.viewDate.getMonth()]} ${this.viewDate.getFullYear()}`;
    }
    shiftMonth(n) {
      this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + n, 1);
      this.focusDate = addMonthsKeepDay(this.focusDate || this.viewDate, n);
      this.renderPop();
      this.announce();
    }

    bind() {
      this.bindField();
      this.bindPop();
    }

    // Field events (subclasses with different fields override this).
    bindField() {
      const inp = this.input, box = this.root.querySelector('.dp-box');

      inp.addEventListener('focus', () => { this.focused = true; this.sync(); });
      inp.addEventListener('blur', () => {
        this.focused = false;
        if (!this.o.static && inp.value !== this.committed) this.commit({ focus: false });
        this.sync();
      });
      inp.addEventListener('input', () => {
        this.error = null;
        this.sync();
        const p = this.parse(inp.value);
        if (p.date && this.open && this.view === 'days') {
          this.viewDate = monthOf(p.date);
          this.focusDate = p.date;
          this.renderPop();
        }
      });
      inp.addEventListener('keydown', e => {
        if (this.isStatic()) return;
        if (e.key === 'Enter') { e.preventDefault(); this.commit(); }
        else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.open) { this._focus = '.dp-day[tabindex="0"], .dp-year[tabindex="0"]'; this.renderPop(); }
          else this.openPop(true);
        } else if (e.key === 'Escape' && this.open) { e.preventDefault(); this.close(); }
      });

      box.addEventListener('click', e => {
        if (this.isStatic()) return;
        if (e.target.closest('.dp-clear')) {
          inp.value = '';
          this.commit({ focus: false });
          inp.focus();
          return;
        }
        const trig = e.target.closest('.dp-trigger');
        if (trig && this.open) return this.close();
        if (!this.open) this.openPop(trig ? e.detail === 0 : false);
        if (!trig) inp.focus();
      });
    }

    // Popover events, shared by every calendar component.
    bindPop() {
      const r = this.root;
      // Keep focus where it is when clicking inside the popup with a pointer.
      this.pop.addEventListener('mousedown', e => { if (!e.target.closest('.dp-ylist') || e.target.closest('button')) e.preventDefault(); });
      this.pop.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (b) this.act(b.dataset.act, b, e.detail === 0);
      });
      this.pop.addEventListener('keydown', e => this.onKey(e));
      this.pop.addEventListener('mouseover', e => { const b = e.target.closest('.dp-day'); if (b) this.showTip(b); });
      this.pop.addEventListener('mouseout', e => {
        const b = e.target.closest('.dp-day');
        if (b && !b.contains(e.relatedTarget)) this.hideTip();
      });
      this.pop.addEventListener('focusin', e => { const b = e.target.closest('.dp-day'); if (b) this.showTip(b); });
      this.pop.addEventListener('focusout', e => { if (e.target.closest('.dp-day')) this.hideTip(); });
      r.addEventListener('focusout', e => {
        if (this.open && !this.o.inline && e.relatedTarget && !r.contains(e.relatedTarget)) this.close(false);
      });
    }

    act(a, b, kbd) {
      const ds = this.o.ds, y = this.viewDate.getFullYear(), m = this.viewDate.getMonth();
      switch (a) {
        case 'qa': {
          const q = this.actions()[+b.dataset.i];
          if (q.view) {
            this.view = q.view === 'recommended' ? 'recommended' : 'days';
            if (kbd) this._focus = `[data-act="qa"][data-i="${b.dataset.i}"]`;
            this.renderPop();
          } else {
            const d = addDays(this.today, q.offset || 0);
            const why = this.unavailReason(d);
            if (why) { this.error = `${fmt(d)} is not available — ${why.replace(/\.$/, '')}`; this.sync(); return; }
            this.view = 'days';
            this.select(d);
          }
          return;
        }
        case 'prev': case 'next': {
          const dir = a === 'prev' ? -1 : 1;
          const list = this.view === 'years' && this.pop.querySelector('.dp-ylist');
          if (list) { list.scrollBy({ top: dir * list.clientHeight, behavior: 'smooth' }); return; }  // page the year list
          if (kbd) this._focus = `[data-act="${a}"]`;
          this.shiftMonth(dir);
          return;
        }
        case 'prevY': case 'nextY':
          if (kbd) this._focus = `[data-act="${a}"]`;
          this.shiftMonth(a === 'prevY' ? -12 : 12);
          return;
        case 'prevDec': case 'nextDec':
          this.decade += a === 'prevDec' ? -10 : 10;
          if (kbd) this._focus = `[data-act="${a}"]`;
          this.renderPop();
          return;
        case 'title':
          if (this.view === 'years') { this.view = 'days'; if (kbd) this._focus = '[data-act="title"]'; }
          else { this.view = 'years'; if (kbd) this._focus = '.dp-year[tabindex="0"]'; }
          this.renderPop();
          return;
        case 'months':
          this.view = 'months';
          if (kbd) this._focus = '.dp-month[tabindex="0"]';
          this.renderPop();
          return;
        case 'years':
          this.view = 'years';
          this.decade = Math.floor(y / 10) * 10;
          if (kbd) this._focus = '.dp-year[tabindex="0"]';
          this.renderPop();
          return;
        case 'year': {
          const ny = +b.dataset.y;
          this.viewDate = new Date(ny, m, 1);
          this.focusDate = new Date(ny, m, Math.min((this.focusDate || this.viewDate).getDate(), daysIn(ny, m)));
          this.view = 'days';
          if (kbd) this._focus = '.dp-day[tabindex="0"]';
          this.renderPop();
          this.announce();
          return;
        }
        case 'month': {
          const nm = +b.dataset.m;
          this.viewDate = new Date(y, nm, 1);
          this.focusDate = new Date(y, nm, Math.min((this.focusDate || this.viewDate).getDate(), daysIn(y, nm)));
          this.view = 'days';
          if (kbd) this._focus = '.dp-day[tabindex="0"]';
          this.renderPop();
          this.announce();
          return;
        }
        case 'day': {
          const d = toDate(b.dataset.date);
          this.focusDate = d;
          if (this.unavailReason(d)) { this.showTip(b); return; }
          this.select(d);
          return;
        }
        case 'group':
          this.collapsed[b.dataset.k] = !this.collapsed[b.dataset.k];
          this._focus = `[data-act="group"][data-k="${b.dataset.k}"]`;
          this.renderPop();
          return;
      }
    }

    onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.view === 'years' || this.view === 'months') {
          this.view = 'days';
          this._focus = '.dp-day[tabindex="0"]';
          this.renderPop();
        } else this.close();
        return;
      }
      const day = e.target.closest('.dp-day');
      const item = e.target.closest('.dp-year');

      // Linear lists: recommended candidates, year and month grids.
      if ((day && this.view === 'recommended') || item) {
        const sel = day ? '.dp-day' : '.dp-year';
        const cols = day ? 6 : 3;
        const list = [...this.pop.querySelectorAll(sel)];
        const i = list.indexOf(e.target.closest(sel));
        const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
        let j = null;
        if (e.key in map) j = i + map[e.key];
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = list.length - 1;
        if (j === null) return;
        e.preventDefault();
        const t = list[Math.max(0, Math.min(list.length - 1, j))];
        list.forEach(x => (x.tabIndex = -1));
        t.tabIndex = 0;
        t.focus();
        if (day) this.focusDate = toDate(t.dataset.date);
        return;
      }
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
      if (target) {
        this.pop.querySelectorAll('.dp-day').forEach(x => (x.tabIndex = -1));
        target.tabIndex = 0;
        target.focus();
      } else {
        this.viewDate = monthOf(nd);
        this._focus = `.dp-day[data-date="${k}"]`;
        this.renderPop();
        this.announce();
      }
    }
  }

  DatePicker.utils = { toKey, toDate, addDays, fmt, MONTHS };
  // Shared core for sibling components (Date Range Picker).
  DatePicker.shared = {
    MONTHS, MONTHS_SHORT, WD, WD_LONG, I, pad, toKey, toDate, addDays, monthOf, daysIn,
    addMonthsKeepDay, fmt, longDate, esc, sparkle, parseText, parseTime
  };
  global.DatePicker = DatePicker;
})(window);
