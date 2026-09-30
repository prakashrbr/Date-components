/*!
 * Time Picker with Presets
 * A time field with a 12h/24h switch and a row of preset times (fixed times and times relative to now).
 * Built on the shared date-component core: load datepicker.css + datepicker.js first for the tokens,
 * the three skins (custom spec · Ant Design · MUI), the tooltip and the time parser.
 *
 *   const picker = new TimePicker(el, {
 *     label: 'Time',
 *     value: '07:45',                        // 'HH:mm' (24-hour)
 *     hourCycle: 12,                          // 12 or 24; the in-field switch lets users change it
 *     presets: [{ now: true, label: 'Now' }, { time: '08:00' }, { offset: 15, label: '+15 min' }],
 *     step: 15,                               // ↑/↓ in the field steps by this many minutes
 *     min: '08:00', max: '18:00',             // allowed range; minMessage / maxMessage override the error
 *     unavailable: { '08:30': 'Theatre is booked' },
 *     recommended: { '09:00': { reason: '…' } },
 *     validate: time => null,                 // conflicts and workflow rules; return a message to block
 *     required: false,
 *     onChange: (time, picker) => {}          // 'HH:mm' or null
 *   });
 */
(function (global) {
  'use strict';

  const DP = global.DatePicker;
  if (!DP || !DP.shared) throw new Error('timepicker.js needs datepicker.js loaded first.');
  const { I, esc, sparkle, parseTime } = DP.shared;

  const pad = n => String(n).padStart(2, '0');
  const toMin = t => t.h * 60 + t.m;
  const fromMin = n => { const x = ((n % 1440) + 1440) % 1440; return { h: Math.floor(x / 60), m: x % 60 }; };
  const key = t => `${pad(t.h)}:${pad(t.m)}`;
  const parseKey = v => {
    if (!v) return null;
    if (v instanceof Date) return { h: v.getHours(), m: v.getMinutes() };
    const m = String(v).match(/(\d{1,2}):(\d{2})/);
    return m ? { h: +m[1], m: +m[2] } : null;
  };

  const DEFAULT_PRESETS = [
    { now: true, label: 'Now' }, { time: '08:00' }, { time: '08:15' }, { time: '08:30' }, { time: '08:45' }
  ];

  let uid = 0;

  class TimePicker {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({
        ds: 'custom', theme: 'light', label: 'Time', hourCycle: 12, formatSwitch: true, presets: null,
        step: 15, unavailable: {}, recommended: {}, required: false,
        static: false, disabled: false, state: null, error: null, text: null, demo: {}
      }, opts);
      this.id = 'tpk' + (++uid);
      this.h12 = this.o.hourCycle !== 24;
      this.value = parseKey(this.o.value);
      this.min = parseKey(this.o.min);
      this.max = parseKey(this.o.max);
      this.error = this.o.error || null;
      this.fromPreset = this.o.demo.selected != null ? this.o.demo.selected : null;
      this.lastEmit = this.value ? key(this.value) : '';
      this._onResize = () => { if (this.tip && !this.tip.hidden && this._tipFor) this.placeTip(this._tipFor); };
      window.addEventListener('resize', this._onResize);
      this.build();
    }

    /* ---------- public API ---------- */
    getValue() { return this.value ? key(this.value) : null; }
    setDS(ds) { if (ds !== this.o.ds) { this.o.ds = ds; this.text = this.input.value; this.build(); } }
    setTheme(t) { this.o.theme = t; this.root.dataset.theme = t; }
    destroy() { window.removeEventListener('resize', this._onResize); this.el.innerHTML = ''; }

    /* ---------- helpers ---------- */
    now() {
      const n = this.o.now ? parseKey(this.o.now) : null;
      if (n) return n;
      const d = new Date();
      return { h: d.getHours(), m: d.getMinutes() };
    }
    fmtField(t) {
      return this.h12 ? `${pad(t.h % 12 || 12)} : ${pad(t.m)} ${t.h < 12 ? 'AM' : 'PM'}` : `${pad(t.h)} : ${pad(t.m)}`;
    }
    fmtShort(t) {
      return this.h12 ? `${t.h % 12 || 12}:${pad(t.m)} ${t.h < 12 ? 'AM' : 'PM'}` : `${pad(t.h)}:${pad(t.m)}`;
    }
    presets() { return this.o.presets || DEFAULT_PRESETS; }
    presetTime(p) {
      if (p.now) return this.now();
      if (p.offset != null) return fromMin(toMin(this.now()) + p.offset);
      return parseKey(p.time);
    }
    presetLabel(p) { return p.label || this.fmtShort(parseKey(p.time)); }
    crossesMidnight(p) { return p.offset != null && toMin(this.now()) + p.offset >= 1440; }
    rangeText() { return `${this.fmtShort(this.min || { h: 0, m: 0 })} and ${this.fmtShort(this.max || { h: 23, m: 59 })}`; }
    // Why a time can't be used (null when it can).
    unavailReason(t, p) {
      if (p && p.unavailable) return p.unavailable;
      const k = key(t);
      if (this.o.unavailable[k]) return this.o.unavailable[k];
      if (typeof this.o.isUnavailable === 'function') { const r = this.o.isUnavailable(k); if (r) return r; }
      if ((this.min && toMin(t) < toMin(this.min)) || (this.max && toMin(t) > toMin(this.max))) {
        return `Outside the allowed hours (${this.rangeText().replace(' and ', '–')}).`;
      }
      return null;
    }
    recOf(t, p) { return (p && p.recommended) || this.o.recommended[key(t)] || null; }
    validate(t) {
      const k = key(t);
      if (this.min && toMin(t) < toMin(this.min)) return this.o.minMessage || `Enter a time between ${this.rangeText()}`;
      if (this.max && toMin(t) > toMin(this.max)) return this.o.maxMessage || `Enter a time between ${this.rangeText()}`;
      const why = this.o.unavailable[k] || (typeof this.o.isUnavailable === 'function' && this.o.isUnavailable(k));
      if (why) return `${this.fmtShort(t)} isn't available — ${String(why).replace(/\.$/, '')}`;
      if (typeof this.o.validate === 'function') return this.o.validate(k) || null;
      return null;
    }
    selectedIndex() {
      if (!this.value) return -1;
      if (this.fromPreset != null) return this.fromPreset;
      // A typed time that matches a fixed preset highlights that preset.
      return this.presets().findIndex(p => p.time && key(parseKey(p.time)) === key(this.value));
    }
    emit() {
      const k = this.value ? key(this.value) : '';
      if (k === this.lastEmit) return;
      this.lastEmit = k;
      if (typeof this.o.onChange === 'function') this.o.onChange(k || null, this);
    }

    /* ---------- structure ---------- */
    build() {
      const o = this.o, id = this.id, ds = o.ds;
      const ph = ds === 'mui' ? (this.h12 ? 'hh:mm aa' : 'hh:mm') : (this.h12 ? '__ : __ __' : '__ : __');
      const input = `<input id="${id}-in" class="dp-input tpk-in" type="text" autocomplete="off" spellcheck="false" placeholder="${ph}" ` +
        `aria-describedby="${id}-msg" ${o.required ? 'aria-required="true"' : ''}>`;
      const lab = `<label class="dp-label" id="${id}-lab" for="${id}-in">${esc(o.label)}</label>`;
      const clock = `<span class="dp-icon tpk-clock" aria-hidden="true">${ds === 'ant' ? I.clockAnt : ds === 'mui' ? I.clockMui : I.clock}</span>`;
      const fmt = o.formatSwitch ? `<div class="tpk-fmt" role="radiogroup" aria-label="Time format">` +
        [['12', '12h', '12-hour'], ['24', '24h', '24-hour']].map(([v, t, l]) => {
          const on = (v === '12') === this.h12;
          return `<button type="button" class="tpk-fmt-opt${on ? ' is-on' : ''}" role="radio" aria-checked="${on}" aria-label="${l}" tabindex="${on ? 0 : -1}" data-f="${v}">${t}</button>`;
        }).join('') + `</div>` : '';
      let box;
      if (ds === 'mui') {
        box = `<div class="dp-box tpk-box">${lab}${clock}${input}${fmt}<fieldset class="dp-outline" aria-hidden="true"><legend><span>${esc(o.label)}</span></legend></fieldset></div>`;
      } else if (ds === 'ant') {
        box = `<div class="dp-box tpk-box">${input}${fmt}<span class="dp-suffix">${clock}</span></div>`;
      } else {
        box = `<div class="dp-box tpk-box">${clock}${input}${fmt}</div>`;
      }
      this.el.innerHTML = `<div class="dp tpk" id="${id}" data-ds="${ds}" data-theme="${o.theme}">` +
        (ds === 'mui' ? '' : lab) + `<div class="dp-control">${box}</div>` +
        `<div class="tpk-presets" role="group" aria-label="Preset times"></div>` +
        `<div class="dp-msg" id="${id}-msg" aria-live="polite" hidden></div>` +
        `<div class="dp-tip" id="${id}-tip" role="tooltip" hidden></div></div>`;
      const r = this.root = this.el.firstElementChild;
      this.input = r.querySelector('.tpk-in');
      this.row = r.querySelector('.tpk-presets');
      this.msg = r.querySelector('.dp-msg');
      this.tip = r.querySelector('.dp-tip');
      const text = this.text != null ? this.text : (o.text != null ? o.text : (this.value ? this.fmtField(this.value) : ''));
      this.text = null;
      this.input.value = this.committed = text;
      if (o.static) { this.input.readOnly = true; this.input.tabIndex = -1; }
      this.bind();
      this.renderPresets();
      this.sync();
    }

    // Chips are created once and then updated in place, so focus and in-progress clicks are never lost.
    renderPresets() {
      const list = this.presets(), sel = this.selectedIndex(), dis = this.isDisabled();
      if (this.row.children.length !== list.length) {
        this.row.innerHTML = list.map((p, i) => `<button type="button" class="tpk-chip" data-i="${i}"${this.o.static ? ' tabindex="-1"' : ''}></button>`).join('');
      }
      list.forEach((p, i) => {
        const b = this.row.children[i];
        const t = this.presetTime(p), why = this.unavailReason(t, p), rec = this.recOf(t, p);
        const label = this.presetLabel(p);
        let aria = p.now ? `Now, ${this.fmtShort(t)}` : p.offset != null ? `${label}, ${this.fmtShort(t)}` : this.fmtShort(t);
        if (rec) aria += ', recommended';
        if (why) aria += ', not available';
        b.className = 'tpk-chip' + (i === sel ? ' is-on' : '') + (why ? ' is-unavail' : '') + (rec ? ' is-rec' : '') + (this.o.demo.focus === i ? ' is-focus' : '');
        b.textContent = label;
        b.setAttribute('aria-pressed', String(i === sel));
        b.setAttribute('aria-label', aria);
        if (why) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
        if (why || rec || p.now || p.offset != null) b.setAttribute('aria-describedby', `${this.id}-tip`); else b.removeAttribute('aria-describedby');
        b.disabled = dis;
      });
    }

    isDisabled() { return this.o.disabled || this.o.state === 'disabled'; }

    sync() {
      const r = this.root, st = this.o.state, dis = this.isDisabled();
      const hasVal = !!this.input.value;
      r.classList.toggle('is-active', st === 'active');
      r.classList.toggle('is-focused', !!this.focused || st === 'focused');
      r.classList.toggle('is-disabled', dis);
      r.classList.toggle('is-error', !!this.error);
      r.classList.toggle('has-value', hasVal);
      r.classList.toggle('is-float', hasVal || !!this.focused || st === 'focused' || st === 'active');
      this.input.disabled = dis;
      this.input.setAttribute('aria-invalid', String(!!this.error));
      r.querySelectorAll('.tpk-fmt-opt').forEach(b => { b.disabled = dis; });
      this.msg.hidden = !this.error;
      this.msg.innerHTML = this.error ? (this.o.ds === 'custom' ? I.warn : '') + `<span>${esc(this.error)}</span>` : '';
    }

    /* ---------- tooltip ---------- */
    tipHTML(i) {
      const p = this.presets()[i], t = this.presetTime(p), why = this.unavailReason(t, p), rec = this.recOf(t, p);
      if (why) return `<div class="dp-tip-sec"><div class="dp-tip-h">${I.ban}<span>Not available</span></div><p>${esc(why)}</p></div>`;
      let h = '';
      if (rec) {
        h += `<div class="dp-tip-sec"><div class="dp-tip-h">${sparkle()}<span>${esc(rec.title || 'Why this time?')}</span></div>` +
          (rec.reason ? `<p>${esc(rec.reason)}</p>` : '') +
          (rec.checks && rec.checks.length ? `<ul class="dp-tip-checks">${rec.checks.map(c => `<li>${I.check}<span>${esc(c)}</span></li>`).join('')}</ul>` : '') + `</div>`;
      }
      if (p.now || p.offset != null) {
        h += `<div class="dp-tip-sec"><div class="dp-tip-h"><span>Sets ${this.fmtShort(t)}${this.crossesMidnight(p) ? ' tomorrow' : ''}</span></div></div>`;
      }
      return h;
    }
    showTip(btn) {
      const h = this.tipHTML(+btn.dataset.i);
      if (!h) return this.hideTip();
      this.tip.innerHTML = h;
      this.tip.hidden = false;
      this._tipFor = btn;
      this.placeTip(btn);
    }
    placeTip(btn) { return DP.prototype.placeTip.call(this, btn); }
    hideTip() { this.tip.hidden = true; this._tipFor = null; }

    /* ---------- behaviour ---------- */
    setValue(t, { fromPreset = null } = {}) {
      this.value = t;
      this.fromPreset = fromPreset;
      this.error = null;
      this.input.value = this.committed = t ? this.fmtField(t) : '';
      this.renderPresets();
      this.sync();
      this.emit();
    }
    commit() {
      const r = parseTime(this.input.value, this.h12, null);
      // `committed` keeps the last valid text, so Esc can undo an invalid entry.
      if (r.empty) {
        this.committed = '';
        this.value = null; this.fromPreset = null;
        this.error = this.o.required ? 'Please enter time' : null;
        this.renderPresets(); this.sync(); this.emit();
        return;
      }
      if (r.error) { this.error = r.error; this.sync(); return; }
      const t = { h: r.h, m: r.m }, msg = this.validate(t);
      if (msg) { this.error = msg; this.sync(); return; }
      // Exact times are kept as typed; nothing is rounded.
      this.setValue(t);
    }
    pickPreset(i) {
      const p = this.presets()[i], t = this.presetTime(p);
      if (this.unavailReason(t, p)) return this.showTip(this.row.querySelector(`[data-i="${i}"]`));
      const msg = typeof this.o.validate === 'function' ? this.o.validate(key(t)) : null;
      if (msg) { this.error = msg; this.sync(); return; }
      this.setValue(t, { fromPreset: i });
    }
    stepBy(dir) {
      const s = Math.max(1, this.o.step || 1);
      const base = this.value ? toMin(this.value) : toMin(this.now());
      // Step to the next interval boundary; the typed value itself is never rounded.
      const next = dir > 0 ? Math.floor(base / s) * s + s : Math.ceil(base / s) * s - s;
      const t = fromMin(next), msg = this.validate(t);
      if (msg) { this.error = msg; this.sync(); return; }
      this.setValue(t);
    }
    setFormat(h12, focus) {
      if (h12 === this.h12) return;
      const typed = this.input.value !== this.committed;
      this.h12 = h12;
      this.root.querySelectorAll('.tpk-fmt-opt').forEach(b => {
        const on = (b.dataset.f === '12') === h12;
        b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      this.input.placeholder = this.o.ds === 'mui' ? (h12 ? 'hh:mm aa' : 'hh:mm') : (h12 ? '__ : __ __' : '__ : __');
      if (this.value && !typed) this.input.value = this.committed = this.fmtField(this.value);
      this.renderPresets();
    }

    bind() {
      const r = this.root, inp = this.input;
      inp.addEventListener('focus', () => { this.focused = true; this.sync(); });
      inp.addEventListener('blur', () => {
        this.focused = false;
        if (!this.o.static && (inp.value !== this.committed || (this.o.required && !inp.value && !this.error))) this.commit();
        this.sync();
      });
      inp.addEventListener('input', () => { this.error = null; this.sync(); });
      inp.addEventListener('keydown', e => {
        if (this.o.static || this.isDisabled()) return;
        if (e.key === 'Enter') { e.preventDefault(); this.commit(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); this.stepBy(e.key === 'ArrowUp' ? 1 : -1); }
        else if (e.key === 'Escape' && inp.value !== this.committed) { e.preventDefault(); inp.value = this.committed; this.error = null; this.sync(); }
      });
      r.querySelector('.dp-box').addEventListener('click', e => {
        if (!e.target.closest('.tpk-fmt') && !this.o.static) inp.focus();
      });

      const fmt = r.querySelector('.tpk-fmt');
      if (fmt) {
        fmt.addEventListener('click', e => {
          const b = e.target.closest('.tpk-fmt-opt');
          if (b && !this.o.static) this.setFormat(b.dataset.f === '12', false);
        });
        fmt.addEventListener('keydown', e => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || this.o.static) return;
          e.preventDefault();
          this.setFormat(!this.h12, true);
        });
      }

      this.row.addEventListener('click', e => {
        const b = e.target.closest('.tpk-chip');
        if (b && !this.o.static && !this.isDisabled()) this.pickPreset(+b.dataset.i);
      });
      this.row.addEventListener('keydown', e => {
        const b = e.target.closest('.tpk-chip');
        if (!b || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        const all = [...this.row.querySelectorAll('.tpk-chip')], i = all.indexOf(b);
        const j = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : i + (e.key === 'ArrowRight' ? 1 : -1);
        if (all[j]) { e.preventDefault(); all[j].focus(); }
      });
      this.row.addEventListener('mouseover', e => { const b = e.target.closest('.tpk-chip'); if (b) this.showTip(b); });
      this.row.addEventListener('mouseout', e => { const b = e.target.closest('.tpk-chip'); if (b && !b.contains(e.relatedTarget)) this.hideTip(); });
      this.row.addEventListener('focusin', e => { const b = e.target.closest('.tpk-chip'); if (b) { this.refreshRelative(); this.showTip(b); } });
      this.row.addEventListener('focusout', () => this.hideTip());
    }
    // Relative presets depend on the clock. On focus, refresh only their accessible names (never the
    // element itself or its classes, so a click in progress isn't interrupted).
    refreshRelative() {
      this.presets().forEach((p, i) => {
        if (!p.now && p.offset == null) return;
        const b = this.row.children[i], t = this.presetTime(p);
        if (!b) return;
        let aria = p.now ? `Now, ${this.fmtShort(t)}` : `${this.presetLabel(p)}, ${this.fmtShort(t)}`;
        if (this.recOf(t, p)) aria += ', recommended';
        if (this.unavailReason(t, p)) aria += ', not available';
        if (b.getAttribute('aria-label') !== aria) b.setAttribute('aria-label', aria);
      });
    }
  }

  TimePicker.defaultPresets = DEFAULT_PRESETS;
  global.TimePicker = TimePicker;
})(window);
