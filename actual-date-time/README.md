# Actual Date & Time

Records the exact date and time a clinical event happened, such as a discharge, an admission, a medication given, or a specimen collected. It's built from the "Actual Date & Time" design spec as plain JavaScript and CSS with no build step, and comes in the same three skins as the other date components (`custom`, `ant`, `mui`), each in light and dark.

## It extends the Calendar Date Picker

`DateTimePicker` is a subclass of `DatePicker`. The calendar, year list, keyboard navigation, tooltips, buttons and skins all come from the shared core, so load that first:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Roboto:wght@400;500&display=swap">
<link rel="stylesheet" href="datepicker.css">        <!-- from ../calendar-date-picker -->
<link rel="stylesheet" href="datetimepicker.css">

<div id="discharge"></div>

<script src="datepicker.js"></script>                <!-- from ../calendar-date-picker -->
<script src="datetimepicker.js"></script>
<script>
  const picker = new DateTimePicker(document.getElementById('discharge'), {
    label: 'Discharge date & time',
    nowButton: true,
    min: admissionTime,
    minMessage: "Discharge can't be before admission (Sep 27, 2026, 2:20 PM)",
    onChange: when => console.log(when)   // a Date with the time, or null
  });
</script>
```

To preview the demo page, serve the parent `Build` folder (`python -m http.server 5174`) and open `/actual-date-time/`.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `ds`, `theme`, `label` | | `'custom'`, `'light'`, `'Date & time'` | As in the date picker. |
| `value` | `Date \| 'YYYY-MM-DDTHH:mm'` | none | The recorded event time. |
| `hourCycle` | `12 \| 24` | `12` | 12-hour shows an AM/PM switch; 24-hour hides it. |
| `allowFuture` | boolean | `false` | Future dates and times are blocked by default: the calendar greys out future days and the field rejects future times. |
| `min`, `max` | `Date \| 'YYYY-MM-DDTHH:mm'` | none | Boundaries to the minute, such as "after admission". |
| `minMessage`, `maxMessage` | string | generic | The error shown when a boundary is crossed. Name the related event. |
| `validate` | `(date) => string \| null` | none | Timeline rules against other clinical events. Return a message to block. |
| `nowButton` | boolean | `false` | Standalone **Now** button beside the field. |
| `timeZone` | string | `''` | Shown in the field when relevant, e.g. `'EST'`. |
| `hint` | string | `''` | Helper text under the field, e.g. "Documented today at 10:02 AM. Enter when the discharge actually happened." |
| `quickActions` | array | Now · Calendar · Today · Yesterday | `{ label, now: true }` fills the current date and time, `{ label, view: 'days' }` shows the calendar, and `{ label, offset }` sets a relative date. |
| `today`, `now` | `Date \| string` | real clock | Fix the clock for tests and demos. |
| `inline`, `disabled`, `unavailable`, `events` | | | As in the date picker. Events can mark related clinical events on the calendar. |
| `onChange` | `(date, picker) => void` | none | Fires when both parts are recorded, or when the value is cleared. |

`picker.getValue()` returns the recorded `Date` (with time) or `null`. `setTheme`, `setDS` and `destroy` work as in the date picker.

## Behaviour

- **Two parts, edited independently.** Date and time are separate inputs in one field. Keyboard focus outlines only the part being edited; the open popover outlines the whole field.
- **Forgiving time entry:** `9:42 PM`, `9 : 42 pm`, `942p`, `21:42` and `0942` all work. In 12-hour mode, an hour from 1 to 12 without AM or PM is flagged ("Please add AM or PM") rather than guessed, because a 12-hour slip in a clinical timestamp matters.
- **Popover.** Pick a date, type the time, choose AM or PM, then press **Done**. Cancel, Esc or clicking outside discards the changes. Today is shown as the suggested date when nothing is recorded, but it's only saved with Done.
- **Now:**
  - In the popover, it fills the draft with the current date and time.
  - The standalone button records them straight into the field.
  - Once the current timestamp is recorded, the button is disabled. Changing the date or time makes it available again.
- **Validation messages:**
  - "You've entered a future date" / "You've entered a future time".
  - Before or after the `min` / `max` boundary, using your message.
  - Your `validate` rule.
  - Invalid dates or times.
  - "Please enter a time" / "Please enter a date" when focus leaves with one part filled.
- **Documentation time.** The component never fills the event time automatically. Use `hint` to show when the record was documented.

## Keyboard

| Key | Action |
|---|---|
| ↓ in the date part | Open the calendar and focus today's date or the selected date |
| ↓ in the time part | Open the popover at the time entry |
| Arrows / PageUp / PageDown | Move around the calendar |
| ↑ ↓ in the popover time | ±1 minute (Shift: ±15) |
| ← → on AM/PM | Switch AM / PM |
| Enter | In the field: record that part. In the popover time: Done |
| Esc | Cancel and close |

## Accessibility

- The date and time inputs are a labelled group, named "Date" and "Time" (with the time zone when set).
- The popover time has its own label, "Enter time", and AM/PM is a `radiogroup`.
- Future days are `aria-disabled` and explain why on hover or focus.
- Errors are linked to the inputs with `aria-describedby` and announced through a live region.

## Before production

- **Locale.** US `mm/dd/yyyy` is used. Pass `hourCycle: 24` where the site prefers 24-hour time.
- **Time zones.** The value is a local `Date`. Decide how you'll store it (UTC plus the zone), and pass `timeZone` when users may be in different zones.
- **Related events.** Admission, surgery or medication times come from your API; plug them into `min`, `max` and `validate`.
- **Testing.** Tested in desktop Chrome and at 375px width. Not yet tested in Safari, Firefox, on touch devices, or with screen readers.
