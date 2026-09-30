/*!
 * Actual Date & Time
 * Records the exact date and time a clinical event happened. Extends the Calendar Date Picker
 * (load datepicker.css + datepicker.js first), so the calendar, year list, keyboard navigation,
 * tooltips and the three skins (custom spec · Ant Design · MUI) are shared.
 *
 *   const picker = new DateTimePicker(el, {
 *     label: 'Discharge date & time',
 *     value: '2026-08-30T09:42',          // Date | 'YYYY-MM-DDTHH:mm'
 *     hourCycle: 12,                      // 12 (AM/PM) or 24
 *     allowFuture: false,                 // future dates and times are blocked by default
 *     min, max,                           // Date | 'YYYY-MM-DDTHH:mm'; minMessage / maxMessage override the error
 *     validate: dt => null,               // timeline rules against related events; return a message to block
 *     nowButton: false,                   // standalone Now button beside the field
 *     timeZone: '',                       // e.g. 'EST', shown in the field when relevant
 *     hint: '',                           // helper text, e.g. when the event was documented
 *     onChange: (date, picker) => {}      // Date with time, or null
 *   });
 */
(function (global) {
  'use strict';

  const DP = global.DatePicker;
  if (!DP || !DP.shared) throw new Error('datetimepicker.js needs datepicker.js loaded first.');
  const { MONTHS_SHORT, I, toKey, monthOf, fmt, esc, parseText, parseTime } = DP.shared;

  const pad = n => String(n).padStart(2, '0');
  const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const combine = (d, t) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.h, t.m);
  const sameDay = (a, b) => toKey(a) === toKey(b);

  // 'YYYY-MM-DDTHH:mm' | 'YYYY-MM-DD HH:mm' | 'YYYY-MM-DD' | Date → Date (local)
  function toDateTime(v) {
    if (!v) return null;
    if (v instanceof Date) return new Date(v.getTime());
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null;
  }

  class DateTimePicker extends DP {
    constructor(el, opts = {}) {
      const o = Object.assign({
        label: 'Date & time', hourCycle: 12, allowFuture: false, nowButton: false,
        timeZone: '', hint: '', timeText: null
      }, opts);
      const now = toDateTime(o.now) || new Date();
      const v = toDateTime(o.value), minDT = toDateTime(o.min), maxDT = toDateTime(o.max);
      super(el, Object.assign(o, {
        _dt: { v, minDT, maxDT },
        value: v ? dateOnly(v) : null,
        today: o.today || dateOnly(now),
        min: minDT ? dateOnly(minDT) : null,
        max: maxDT ? dateOnly(maxDT) : (o.allowFuture ? null : dateOnly(now)),
        maxReason: o.maxReason || (!o.max && !o.allowFuture
          ? "Future dates can't be recorded. Enter when the event actually happened." : undefined),
        closeOnSelect: false
      }));
    }

    initDT() {
      this._dtInit = true;
      const { v, minDT, maxDT } = this.o._dt;
      this.h12 = this.o.hourCycle !== 24;
      this.minDT = minDT;
      this.maxDT = maxDT;
      this.fixedNow = toDateTime(this.o.now);
      this.cDate = v ? dateOnly(v) : null;
      this.cTime = v ? { h: v.getHours(), m: v.getMinutes() } : null;
      this.dTime = this.cTime;
      this.mer = this.cTime && this.cTime.h >= 12 ? 'PM' : 'AM';
      this.timeText = this.cTime ? this.popTime(this.cTime) : '';
      this.fieldTimeText = this.o.timeText != null ? this.o.timeText : (this.cTime ? this.fmtTime(this.cTime) : '');
      this.errorPart = this.o.errorPart || null;
      this.note = null;
      this.nowStamp = this.o.nowUsed && v ? this.stamp(this.cDate, this.cTime) : null;
      this.lastEmit = this.stamp(this.cDate, this.cTime);
      // Suggest today in the calendar when nothing is recorded yet (not committed until Done).
      if (this.o.inline && !this.cDate) this.value = this.today;
    }

    build() {
      if (!this._dtInit) this.initDT();
      super.build();
    }

    /* ---------- public API ---------- */
    getValue() { return this.cDate && this.cTime ? combine(this.cDate, this.cTime) : null; }
    setDS(ds) {
      if (this.tInput) this.fieldTimeText = this.tInput.value;
      super.setDS(ds);
    }

    /* ---------- helpers ---------- */
    now() {
      const n = this.fixedNow ? new Date(this.fixedNow) : new Date();
      n.setSeconds(0, 0);
      return n;
    }
    stamp(d, t) { return d && t ? `${toKey(d)} ${pad(t.h)}:${pad(t.m)}` : ''; }
    fmtTime(t) {
      return this.h12 ? `${t.h % 12 || 12} : ${pad(t.m)} ${t.h < 12 ? 'AM' : 'PM'}` : `${pad(t.h)} : ${pad(t.m)}`;
    }
    popTime(t) { return this.h12 ? `${t.h % 12 || 12} : ${pad(t.m)}` : `${pad(t.h)} : ${pad(t.m)}`; }
    fmtDT(dt) {
      return `${MONTHS_SHORT[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}, ${this.fmtTime({ h: dt.getHours(), m: dt.getMinutes() }).replace(' : ', ':')}`;
    }
    validateDT(dt) {
      const now = this.now();
      if (!this.o.allowFuture && dt > now) return sameDay(dt, now) ? "You've entered a future time" : "You've entered a future date";
      if (this.maxDT && dt > this.maxDT) return this.o.maxMessage || `Enter a time on or before ${this.fmtDT(this.maxDT)}`;
      if (this.minDT && dt < this.minDT) return this.o.minMessage || `Enter a time on or after ${this.fmtDT(this.minDT)}`;
      if (typeof this.o.validate === 'function') return this.o.validate(dt) || null;
      return null;
    }
    actions() {
      return this.o.quickActions || [
        { label: 'Now', now: true }, { label: 'Calendar', view: 'days' },
        { label: 'Today', offset: 0 }, { label: 'Yesterday', offset: -1 }
      ];
    }
    emit() {
      const k = this.stamp(this.cDate, this.cTime);
      const complete = !!k, empty = !this.cDate && !this.cTime;
      if ((complete || empty) && k !== this.lastEmit) {
        this.lastEmit = k;
        if (typeof this.o.onChange === 'function') this.o.onChange(this.getValue(), this);
      }
    }
    showDraft() {
      this.drafted = {
        date: this.input.value = this.value ? fmt(this.value) : '',
        time: this.tInput.value = this.dTime ? this.fmtTime(this.dTime) : ''
      };
    }
    refocusSel() {
      const a = document.activeElement;
      if (!a || !this.pop.contains(a)) return null;
      if (a.dataset.date) return `.dp-day[data-date="${a.dataset.date}"]`;
      if (a.dataset.act && a.dataset.i != null) return `[data-act="${a.dataset.act}"][data-i="${a.dataset.i}"]`;
      if (a.dataset.act === 'mer') return `[data-act="mer"][data-v="${a.dataset.v}"]`;
      return null;
    }

    /* ---------- field ---------- */
    fieldHTML() {
      const { ds, label, timeZone } = this.o, id = this.id;
      const dph = ds === 'mui' ? 'MM/DD/YYYY' : 'mm/dd/yyyy';
      const tph = ds === 'mui' ? (this.h12 ? 'hh:mm aa' : 'hh:mm') : (this.h12 ? '__ : __ __' : '__ : __');
      const desc = `aria-describedby="${id}-msg ${id}-hint"`;
      const dSeg = `<span class="dpt-seg" data-part="date"><input id="${id}-in" class="dp-input dpt-date" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" ` +
        `placeholder="${dph}" aria-label="Date" aria-haspopup="dialog" aria-expanded="false" aria-controls="${id}-pop" ${desc}></span>`;
      const tSeg = `<span class="dpt-seg" data-part="time"><input id="${id}-time" class="dp-input dpt-time-field" type="text" autocomplete="off" spellcheck="false" ` +
        `placeholder="${tph}" aria-label="Time${timeZone ? ` (${esc(timeZone)})` : ''}" ${desc}></span>`;
      const clock = `<span class="dp-icon dpt-clock" aria-hidden="true">${ds === 'ant' ? I.clockAnt : I.clock}</span>`;
      const tz = timeZone ? `<span class="dpt-tz" aria-hidden="true">${esc(timeZone)}</span>` : '';
      const now = this.o.nowButton ? `<button type="button" class="dp-btn dpt-now">Now</button>` : '';
      const pop = `<div class="dp-pop" id="${id}-pop" role="dialog" aria-label="Choose ${esc(label.toLowerCase())}" hidden></div>`;
      const lab = `<label class="dp-label" id="${id}-lab" for="${id}-in">${esc(label)}</label>`;
      const group = `role="group" aria-labelledby="${id}-lab"`;
      const hint = `<div class="dpt-hint" id="${id}-hint"${this.o.hint ? '' : ' hidden'}>${esc(this.o.hint || '')}</div>`;
      let box;
      if (ds === 'mui') {
        box = `<div class="dp-box dpt-box" ${group}>${lab}${dSeg}${tSeg}${tz}<button type="button" class="dp-trigger" aria-label="Choose date and time">${I.calMui}</button>` +
          `<fieldset class="dp-outline" aria-hidden="true"><legend><span>${esc(label)}</span></legend></fieldset></div>`;
        return `<div class="dp-control"><div class="dpt-row">${box}${now}</div>${pop}</div>${hint}`;
      }
      if (ds === 'ant') {
        box = `<div class="dp-box dpt-box" ${group}>${dSeg}${clock}${tSeg}${tz}<span class="dp-suffix"><span class="dp-icon">${I.calAnt}</span>` +
          `<button type="button" class="dp-clear" tabindex="-1" aria-label="Clear date and time">${I.clear}</button></span></div>`;
      } else {
        box = `<div class="dp-box dpt-box" ${group}><span class="dp-icon">${I.cal}</span>${dSeg}${clock}${tSeg}${tz}</div>`;
      }
      return `${lab}<div class="dp-control"><div class="dpt-row">${box}${now}</div>${pop}</div>${hint}`;
    }

    sync() {
      const r = this.root, st = this.o.state, dis = this.o.disabled || st === 'disabled';
      const openLook = this.open && !this.o.inline, dIn = this.input, tIn = this.tInput;
      if (!tIn) return;
      const hasVal = !!(dIn.value || tIn.value);
      r.classList.add('dpt');
      r.classList.toggle('is-inline', !!this.o.inline);
      r.classList.toggle('is-open', openLook);
      r.classList.toggle('is-active', st === 'active');
      r.classList.toggle('is-focused', !!this.focused || st === 'focused');
      r.classList.toggle('is-disabled', dis);
      r.classList.toggle('is-error', !!this.error);
      r.classList.toggle('has-value', hasVal);
      r.classList.toggle('is-float', hasVal || !!this.focused || openLook || st === 'focused' || st === 'active');
      r.querySelector('.dpt-seg[data-part="date"]').classList.toggle('is-focus', st === 'focused');
      for (const [inp, part] of [[dIn, 'date'], [tIn, 'time']]) {
        inp.disabled = dis;
        inp.setAttribute('aria-invalid', String(!!this.error && (!this.errorPart || this.errorPart === part)));
      }
      dIn.setAttribute('aria-expanded', String(this.open));
      this.msg.hidden = !this.error;
      this.msg.innerHTML = this.error ? (this.o.ds === 'custom' ? I.warn : '') + `<span>${esc(this.error)}</span>` : '';
      this.hintEl.hidden = !this.o.hint || !!this.error;
      if (this.nowBtn) {
        const used = !!this.nowStamp && this.nowStamp === this.stamp(this.cDate, this.cTime) && !this.open;
        this.nowBtn.disabled = dis || used;
        this.nowBtn.setAttribute('aria-label', used ? 'Now (current time already entered)' : 'Set to current date and time');
      }
    }

    bindField() {
      const r = this.root, box = r.querySelector('.dp-box');
      this.tInput = r.querySelector('.dpt-time-field');
      this.nowBtn = r.querySelector('.dpt-now');
      this.hintEl = r.querySelector('.dpt-hint');
      this.tInput.value = this.fieldTimeText;
      this.tCommitted = this.fieldTimeText;
      if (this.o.static) { this.tInput.readOnly = true; this.tInput.tabIndex = -1; }

      for (const [inp, part] of [[this.input, 'date'], [this.tInput, 'time']]) {
        inp.addEventListener('focus', () => { this.focused = true; this.sync(); });
        inp.addEventListener('blur', () => {
          this.focused = false;
          const committed = part === 'date' ? this.committed : this.tCommitted;
          const typed = inp.value !== committed && !(this.open && this.drafted && inp.value === this.drafted[part]);
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
            if (!this.open) this.openPop(true, part);
            else if (part === 'time') this.pop.querySelector('.dpt-time-in').focus();
            else { this._focus = '.dp-day[tabindex="0"]'; this.renderPop(); }
          } else if (e.key === 'Escape' && this.open) { e.preventDefault(); this.close(); }
        });
      }

      box.addEventListener('click', e => {
        if (this.isStatic()) return;
        if (e.target.closest('.dp-clear')) {
          this.cDate = null; this.cTime = null; this.value = null; this.dTime = null;
          this.input.value = this.tInput.value = this.committed = this.tCommitted = '';
          this.error = null; this.errorPart = null;
          this.open ? this.renderPop() : this.sync();
          this.emit();
          this.input.focus();
          return;
        }
        const trig = e.target.closest('.dp-trigger');
        if (trig && this.open) return this.close();
        const seg = e.target.closest('.dpt-seg');
        if (!this.open) this.openPop(trig ? e.detail === 0 : false, seg ? seg.dataset.part : undefined);
        if (!trig && !seg) this.input.focus();
      });

      if (this.nowBtn) this.nowBtn.addEventListener('click', () => this.fillNow(true));

      // Popover time entry
      this.pop.addEventListener('input', e => {
        if (e.target.matches('.dpt-time-in')) { this.timeText = e.target.value; this.setNote(null); }
      });
      this.pop.addEventListener('focusout', e => {
        if (e.target.matches('.dpt-time-in')) this.commitPopTime();
      });
      // Select the whole time on focus, so typing replaces it and arrows still adjust it.
      this.pop.addEventListener('focusin', e => {
        if (e.target.matches('.dpt-time-in')) e.target.select();
      });
      this.pop.addEventListener('keydown', e => {
        const t = e.target;
        if (t.matches('.dpt-time-in')) {
          if (e.key === 'Enter') { e.preventDefault(); this.done(); }
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (!this.commitPopTime() && this.dTime) return;
            const base = this.dTime || { h: this.now().getHours(), m: this.now().getMinutes() };
            const step = (e.shiftKey ? 15 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
            const total = ((base.h * 60 + base.m + step) % 1440 + 1440) % 1440;
            this.setDraftTime({ h: Math.floor(total / 60), m: total % 60 });
            t.value = this.timeText;
          }
        } else if (t.matches('.dpt-mer') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          this.setMer(this.mer === 'AM' ? 'PM' : 'AM', true);
        }
      });

      // Leaving the field with only one part filled
      r.addEventListener('focusout', () => setTimeout(() => {
        if (!this.root || this.root.contains(document.activeElement) || this.open || this.o.static || this.error) return;
        if (!!this.cDate !== !!this.cTime) {
          this.error = this.cDate ? 'Please enter a time' : 'Please enter a date';
          this.errorPart = this.cDate ? 'time' : 'date';
          this.sync();
        }
      }, 0));
    }

    commitPart(part) {
      const inp = part === 'date' ? this.input : this.tInput;
      const fail = msg => {
        this.error = msg; this.errorPart = part;
        if (part === 'date') this.committed = inp.value; else this.tCommitted = inp.value;
        this.sync();
      };
      if (part === 'date') {
        const r = parseText(inp.value);
        if (r.error) return fail(r.error);
        if (r.date) {
          const why = this.unavailReason(r.date);
          if (why) return fail(!this.o.allowFuture && r.date > this.today ? "You've entered a future date" : `${fmt(r.date)} is not available — ${why.replace(/\.$/, '')}`);
        }
        this.cDate = r.date || null;
        inp.value = this.committed = this.cDate ? fmt(this.cDate) : '';
      } else {
        const r = parseTime(inp.value, this.h12, null);
        if (r.error) return fail(r.error);
        this.cTime = r.empty ? null : { h: r.h, m: r.m };
        inp.value = this.tCommitted = this.cTime ? this.fmtTime(this.cTime) : '';
      }
      if (this.cDate && this.cTime) {
        const msg = this.validateDT(combine(this.cDate, this.cTime));
        if (msg) return fail(msg);
      }
      this.error = null; this.errorPart = null;
      if (this.open) {
        this.value = this.cDate; this.dTime = this.cTime;
        if (this.cTime) { this.mer = this.cTime.h >= 12 ? 'PM' : 'AM'; this.timeText = this.popTime(this.cTime); }
        if (this.cDate) this.viewDate = monthOf(this.cDate);
        this.renderPop();
      }
      this.sync();
      this.emit();
    }

    /* ---------- popover ---------- */
    openPop(kbd, part) {
      if (this.open || this.isStatic()) return;
      this.value = this.cDate || this.today;     // suggested, not recorded until Done
      this.dTime = this.cTime;
      if (this.cTime) { this.mer = this.cTime.h >= 12 ? 'PM' : 'AM'; this.timeText = this.popTime(this.cTime); }
      else this.timeText = '';
      this.note = null;
      this.drafted = { date: this.input.value, time: this.tInput.value };
      super.openPop(kbd && part !== 'time');
      if (kbd && part === 'time') this.pop.querySelector('.dpt-time-in').focus();
    }
    close(focusInput = true) {
      if (!this.open) return;
      this.value = this.cDate;
      this.dTime = this.cTime;
      this.note = null;
      this.input.value = this.committed;
      this.tInput.value = this.tCommitted;
      super.close(focusInput);
    }
    select(d) {
      const again = this.refocusSel();
      this.value = d;
      this.focusDate = d;
      this.viewDate = monthOf(d);
      this.note = null;
      this.showDraft();
      if (again) this._focus = again;
      this.renderPop();
      this.sync();
    }
    setNote(msg) {
      this.note = msg;
      const n = this.pop.querySelector('.dp-note');
      if (!n) return;
      n.hidden = !msg;
      n.innerHTML = msg ? I.warn + `<span>${esc(msg)}</span>` : '';
    }
    setDraftTime(t) {
      this.dTime = t;
      this.mer = t.h >= 12 ? 'PM' : 'AM';
      this.timeText = this.popTime(t);
      this.pop.querySelectorAll('.dpt-mer').forEach(b => {
        const on = b.dataset.v === this.mer;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      this.showDraft();
    }
    setMer(v, focus) {
      this.commitPopTime();
      this.mer = v;
      if (this.dTime) this.setDraftTime({ h: (this.dTime.h % 12) + (v === 'PM' ? 12 : 0), m: this.dTime.m });
      else this.pop.querySelectorAll('.dpt-mer').forEach(b => {
        const on = b.dataset.v === v;
        b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
      });
      if (focus) { const b = this.pop.querySelector(`.dpt-mer[data-v="${v}"]`); if (b) b.focus(); }
    }
    // Returns true when the popover time is valid (or empty).
    commitPopTime() {
      const inp = this.pop.querySelector('.dpt-time-in');
      if (!inp) return true;
      const r = parseTime(inp.value, this.h12, this.mer);
      if (r.empty) { this.dTime = null; this.timeText = ''; this.showDraft(); return true; }
      if (r.error) { this.setNote(r.error); return false; }
      this.setDraftTime({ h: r.h, m: r.m });
      inp.value = this.timeText;
      return true;
    }
    fillNow(commit) {
      const n = this.now(), d = dateOnly(n), t = { h: n.getHours(), m: n.getMinutes() };
      if (commit) {
        this.cDate = d; this.cTime = t; this.value = d;
        this.input.value = this.committed = fmt(d);
        this.tInput.value = this.tCommitted = this.fmtTime(t);
        this.error = null; this.errorPart = null;
        this.nowStamp = this.stamp(d, t);
        this.sync();
        this.emit();
        return;
      }
      const again = this.refocusSel();
      this.value = d; this.focusDate = d; this.viewDate = monthOf(d); this.view = 'days';
      this.dTime = t; this.mer = t.h >= 12 ? 'PM' : 'AM'; this.timeText = this.popTime(t);
      this.note = null;
      this._nowDraft = this.stamp(d, t);
      this.showDraft();
      if (again) this._focus = again;
      this.renderPop();
    }
    done() {
      if (!this.commitPopTime()) return;
      const d = this.value, t = this.dTime;
      const msg = !d ? 'Select a date' : !t ? 'Enter a time' : this.validateDT(combine(d, t));
      if (msg) { this.setNote(msg); return; }
      this.cDate = d; this.cTime = t;
      this.committed = fmt(d);
      this.tCommitted = this.fmtTime(t);
      if (this._nowDraft === this.stamp(d, t)) this.nowStamp = this._nowDraft;
      this.error = null; this.errorPart = null;
      this.close(true);
      this.emit();
    }
    act(a, b, kbd) {
      if (a === 'qa') {
        const q = this.actions()[+b.dataset.i];
        if (q && q.now) return this.fillNow(false);
      }
      if (a === 'mer') return this.setMer(b.dataset.v, kbd);
      if (a === 'cancel') return this.close();
      if (a === 'done') return this.done();
      return super.act(a, b, kbd);
    }

    quickHTML() {
      const qa = this.actions(), cur = this.view === 'recommended' ? 'recommended' : 'days';
      const btn = (a, i) => {
        if (a.now) return '';
        const on = !!a.view && a.view === cur;
        return `<button type="button" class="dp-qa${on ? ' is-on' : ''}" data-act="qa" data-i="${i}"${a.view ? ` aria-pressed="${on}"` : ''}>${esc(a.label)}</button>`;
      };
      const ni = qa.findIndex(a => a.now);
      const now = ni >= 0 ? `<button type="button" class="dp-qa dpt-now-link" data-act="qa" data-i="${ni}" aria-label="Set to current date and time">${esc(qa[ni].label)}</button><span class="dpt-qsep" aria-hidden="true"></span>` : '';
      return `<div class="dp-quick dpt-quick" role="group" aria-label="Quick actions">${now}<div class="dp-quick-in">${qa.map(btn).join('')}</div></div>`;
    }

    footHTML() {
      const id = this.id, ds = this.o.ds;
      const mer = this.h12 ? `<div class="dpt-ampm" role="radiogroup" aria-label="AM or PM">` + ['AM', 'PM'].map(v =>
        `<button type="button" class="dpt-mer${this.mer === v ? ' is-on' : ''}" role="radio" aria-checked="${this.mer === v}" tabindex="${this.mer === v ? 0 : -1}" data-act="mer" data-v="${v}">${v}</button>`
      ).join('') + `</div>` : '';
      return `<div class="dpt-time"><label class="dpt-time-label" for="${id}-ptime">${ds === 'mui' ? I.clockMui : ds === 'ant' ? I.clockAnt : I.clock}<span>Enter time</span></label>` +
        `<div class="dpt-time-row"><input id="${id}-ptime" class="dpt-time-in" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" ` +
        `placeholder="hh : mm" value="${esc(this.timeText)}" aria-describedby="${id}-note">${mer}</div></div>` +
        `<div class="dp-note" id="${id}-note" role="alert"${this.note ? '' : ' hidden'}>${this.note ? I.warn + `<span>${esc(this.note)}</span>` : ''}</div>` +
        `<div class="dpt-foot"><button type="button" class="dp-btn" data-act="cancel">Cancel</button><button type="button" class="dp-btn is-primary" data-act="done">Done</button></div>`;
    }
  }

  DateTimePicker.parseTime = parseTime;
  global.DateTimePicker = DateTimePicker;
})(window);
