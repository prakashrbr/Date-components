# Time Picker with Presets

A time field with a 12h/24h switch and a row of preset times. It's built from the "Time Picker with Presets" design spec as plain JavaScript and CSS with no build step, and comes in the same three skins as the other date components (`custom`, `ant`, `mui`), each in light and dark.

## It uses the shared core

The component reuses the date components' tokens, skins, field states, error message, tooltip and time parser, so load the core first:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Roboto:wght@400;500&display=swap">
<link rel="stylesheet" href="datepicker.css">   <!-- from ../calendar-date-picker -->
<link rel="stylesheet" href="timepicker.css">

<div id="med-time"></div>

<script src="datepicker.js"></script>           <!-- from ../calendar-date-picker -->
<script src="timepicker.js"></script>
<script>
  const picker = new TimePicker(document.getElementById('med-time'), {
    label: 'Medication time',
    presets: [{ now: true, label: 'Now' }, { offset: 15, label: '+15 min' }, { time: '08:00' }, { time: '12:00' }],
    onChange: time => console.log(time)   // 'HH:mm' (24-hour) or null
  });
</script>
```

To preview the demo page, serve the parent `Build` folder (`python -m http.server 5174`) and open `/time-picker/`.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `ds`, `theme`, `label` | | `'custom'`, `'light'`, `'Time'` | |
| `value` | `'HH:mm'` | none | 24-hour string. |
| `hourCycle` | `12 \| 24` | `12` | Starting format. Follow the site's locale. |
| `formatSwitch` | boolean | `true` | Shows the 12h/24h switch in the field. Switching changes only the display. |
| `presets` | array | Now · 8:00 · 8:15 · 8:30 · 8:45 | `{ time: 'HH:mm' }` is a fixed time, `{ now: true }` is the current time, and `{ offset: minutes }` is relative to now. Any preset can have `label`, `unavailable: 'reason'` or `recommended: { reason, checks }`. Keep the list short. |
| `step` | minutes | `15` | ↑/↓ in the field moves to the next or previous multiple (5, 10, 15, 30, 60…). Typed times are never rounded. |
| `min`, `max` | `'HH:mm'` | none | Allowed range. Presets outside it are disabled and explain why. `minMessage` / `maxMessage` override the error. |
| `unavailable` | `{ 'HH:mm': reason }` | `{}` | Blocked times. Matching presets are struck out with the reason in a tooltip. Typed entries are rejected with the reason. |
| `isUnavailable` | `(time) => reason \| null` | none | Rule-based blocking. |
| `recommended` | `{ 'HH:mm': { reason, checks } }` | `{}` | Marks presets as recommended, with a "Why this time?" tooltip. |
| `validate` | `(time) => string \| null` | none | Conflicts and clinical or workflow restrictions. Return a message to block. |
| `required` | boolean | `false` | Shows "Please enter time" when focus leaves an empty field. |
| `now` | `'HH:mm'` | real clock | Fix the clock for tests and demos. |
| `disabled` | boolean | `false` | |
| `onChange` | `(time, picker) => void` | none | Fires with `'HH:mm'` or `null`. |

`picker.getValue()` returns `'HH:mm'` or `null`. `setTheme`, `setDS` and `destroy` are also available.

## Behaviour

- **Presets fill the field immediately.** The time stays editable, and the chip that set it stays highlighted until the time changes. A typed time that matches a fixed preset highlights that preset.
- **Relative presets** (Now, +15 min…) are calculated at the moment they're used. Hovering or focusing one shows the time it will set, and screen readers hear it ("+15 min, 12:23 PM").
- **Exact entry.** `7:47 am`, `7:47a`, `0747` (24h) and `19:47` all work, and `7:47` is kept as 7:47, never rounded. In 12-hour mode an hour from 1 to 12 without AM or PM is flagged rather than guessed.
- **Validation messages:**
  - Invalid hour: "Please enter an hour from 0 to 23" (or 1 to 12 with AM/PM).
  - Invalid minute: "Please enter minutes from 00 to 59".
  - Missing time: "Please enter time", when `required`.
  - Outside the range: "Enter a time between 7:00 AM and 8:00 PM".
  - Unavailable: "12:00 PM isn't available — reason".
  - A conflict from `validate`.
- **Esc** restores the last valid time. The user's value is never changed silently.

## Keyboard

| Key | Action |
|---|---|
| ↑ / ↓ in the field | Step by `step` minutes |
| Enter | Save the typed time |
| Esc | Undo unsaved typing |
| Tab | Field → format switch → presets |
| ← / → on the switch | 12h / 24h |
| ← / → / Home / End on presets | Move between presets |
| Enter / Space on a preset | Use it |

## Accessibility

- The format switch is a `radiogroup` ("Time format").
- Presets are buttons with `aria-pressed` for the selected one.
- Every preset's accessible name includes the resulting time. Unavailable presets are `aria-disabled`, stay focusable, and explain why.
- Preset chips are 22px tall visually, with a 32px touch target.
- Errors are announced through a live region.

## Before production

- **Presets:** choose them per workflow and keep them few.
- **Relative presets** use the device clock. For server-authoritative times, pass `now` from your server.
- **Dark mode contrast:** the Dark mode spec's selection blue `#2b7fff` with white text is 3.76:1 (selected day, Done button). That's below WCAG AA (4.5:1) for 14px text, though it passes for large text. Every other text pair meets AA. If an accessibility review requires AA, a darker selection blue such as `#155dfc` (5.25:1) would pass.
- **Testing:** tested in desktop Chrome and at 375px width. Not yet tested in Safari, Firefox, on touch devices, or with screen readers.
