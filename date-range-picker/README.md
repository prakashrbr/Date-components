# Date Range Picker

A start and end date input with a two-month calendar, built from the "Date Range Picker" design spec. It's plain JavaScript and CSS with no build step, and comes in the same three skins as the Calendar Date Picker (`custom`, `ant`, `mui`), each in light and dark.

## It builds on the Calendar Date Picker

The range picker reuses the date picker's design tokens, skins, tooltip, keyboard hints and date parsing. It needs both of these files loaded first:

| File | From |
|---|---|
| `datepicker.css`, `datepicker.js` | `../calendar-date-picker/` (shared core) |
| `daterangepicker.css`, `daterangepicker.js` | this folder |

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Roboto:wght@400;500&display=swap">
<link rel="stylesheet" href="datepicker.css">
<link rel="stylesheet" href="daterangepicker.css">

<div id="treatment-period"></div>

<script src="datepicker.js"></script>
<script src="daterangepicker.js"></script>
<script>
  const picker = new DateRangePicker(document.getElementById('treatment-period'), {
    label: 'Treatment period',
    onChange: ({ start, end }) => console.log(start, end)   // Date objects, or null
  });
</script>
```

To preview the demo page, serve the **parent** `Build` folder over HTTP (the page loads the shared files from the sibling folder), then open `/date-range-picker/`:

```bash
python -m http.server 5174
```

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `ds` | `'custom' \| 'ant' \| 'mui'` | `'custom'` | Visual skin. |
| `theme` | `'light' \| 'dark'` | `'light'` | Can be changed later with `setTheme()`. |
| `label` | string | `'Date'` | Field label. |
| `startLabel`, `endLabel` | string | `'Start date'`, `'End date'` | Accessible names for the two inputs, also used in error messages. |
| `value` | `{ start, end }` or `[start, end]` | empty | Each is a `Date` or `'YYYY-MM-DD'`. |
| `today` | `Date \| 'YYYY-MM-DD'` | real today | Override for testing and demos. |
| `min`, `max` | `Date \| 'YYYY-MM-DD'` | none | Dates outside the range are unavailable. |
| `minDays`, `maxDays` | number | none | Allowed range length (counting both ends). |
| `allowSingleDay` | boolean | `true` | Allows the same date as start and end. |
| `unavailable` | `{ 'YYYY-MM-DD': reason }` | `{}` | Blocked dates. A range may not cover them, and the reason is shown. |
| `isUnavailable` | `(date) => string \| null` | none | Rule-based blocking. |
| `events` | `{ 'YYYY-MM-DD': { title, items } }` | `{}` | Event markers and tooltips, as in the date picker. |
| `recommendedRanges` | `Array<{ start, end, title?, reason, checks? }>` | `[]` | Shown as a pink band in the calendar and as cards in the **Recommended** view. Each needs a reason. With none, the Recommended option is hidden. |
| `recommendationSummary` | string | `''` | One-line rule shown above the recommended cards. |
| `presets` | `Array<{ label, view } \| { label, range: today => [start, end] }>` | see below | The quick ranges sidebar. |
| `confirm` | boolean | `true` | Shows Cancel and Done. With `false`, a complete range commits and closes right away. |
| `validate` | `(start, end) => string \| null` | none | Extra clinical rules (conflicting dates, invalid sequence). Return a message to block the range. |
| `inline` | boolean | `false` | Starts open, in the page flow. |
| `disabled` | boolean | `false` | |
| `onChange` | `({ start, end }, picker) => void` | none | Fires when a range is committed or cleared. |

The default presets are Custom, Recommended, Today, Yesterday, This week, Last week, This month, Last month and Last 12 months. Weeks start on Monday. Access the defaults as `DateRangePicker.presets` to build your own list, e.g. `{ label: 'Next 14 days', range: t => [t, new Date(t.getFullYear(), t.getMonth(), t.getDate() + 13)] }`.

## Methods

```js
picker.getValue();       // { start: Date | null, end: Date | null }
picker.setTheme('dark');
picker.setDS('mui');     // rebuilds the markup and keeps the value
picker.destroy();
```

## Behaviour

- **Selecting.** The first click sets the start and the second sets the end. Hovering or focusing a date previews the range. Picking a date before the start makes it the new start. Clicking the start again makes a single-day range.
- **Editing one side.** Focus or click the Start or End field while the calendar is open to change only that date.
- **Confirming.** Selections are a draft until **Done**. **Cancel**, Esc, or clicking outside discards the draft. The footer shows the range length ("7 days").
- **Typing.** Both fields accept the same forgiving formats as the date picker and commit on Enter or blur.
- **Validation messages:**
  - "Please enter start date" / "Please enter end date" when focus leaves with only one date.
  - "End date is before start date".
  - Invalid month or day.
  - Unavailable dates, with the reason.
  - "The range includes unavailable dates (Dec 11–14). Choose dates around them."
  - `minDays` / `maxDays`, and your own `validate`.
- **Months.** In the custom skin each month navigates on its own, and the left month always stays before the right. Ant and MUI move both together, as those libraries do. The title opens a scrollable year list (custom and Ant).
- **Small screens.** Under 640px wide, the presets become a scrolling row and one month shows.

## Keyboard

| Key | Action |
|---|---|
| ↓ in a date field | Open the calendar |
| Arrows | Move by day / week, previewing the range |
| PageUp / PageDown | Previous / next month |
| Shift + PageUp / PageDown | Previous / next year |
| Home / End | Start / end of the week |
| Enter | Set the start, then the end |
| ↑ ↓ on recommended cards | Choose a card |
| Esc | Cancel and close, or close the year list |

## Accessibility

- The two fields are a labelled group with "Start date" and "End date" names.
- Day names include "start date", "end date", "in selected range" and "in recommended range", so the range isn't conveyed by color alone.
- Recommended cards are a `radiogroup`.
- The validation note inside the calendar uses `role="alert"`.

## Before production

- **Shared core.** Ship `datepicker.js` and `datepicker.css` alongside these files. They're the shared base, not a separate component.
- **Localisation.** As with the date picker, the format is US `mm/dd/yyyy`, weeks start on Monday, and labels are English.
- **Data.** Recommended ranges, events and unavailable dates are passed in, so fetch them from your API before creating the picker.
- **Demo content.** Dates and reasons in `index.html` are placeholders. The spec's monitoring example ("20 October – 3 November", "14-day") actually spans 15 days, so the demo uses 20 October – 2 November.
- **Testing.** Tested in desktop Chrome and at 375px width. Not yet tested in Safari, Firefox, on touch devices, or with screen readers.
