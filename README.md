# Date Components

Four date and time components built from our design specs, in plain JavaScript and CSS with no dependencies or build step. Each comes in three visual skins (the custom spec design, Ant Design and MUI) that all share one color palette, in light and dark.

| # | Component | What it's for | Demo |
|---|---|---|---|
| 1 | [Calendar Date Picker](calendar-date-picker/) | One date, with recommended dates, events and unavailable dates | [`calendar-date-picker/index.html`](calendar-date-picker/index.html) |
| 2 | [Date Range Picker](date-range-picker/) | A start and end date, with preset and recommended ranges | [`date-range-picker/index.html`](date-range-picker/index.html) |
| 4 | [Actual Date & Time](actual-date-time/) | The exact date and time a clinical event happened | [`actual-date-time/index.html`](actual-date-time/index.html) |
| 5 | [Time Picker with Presets](time-picker/) | A time, typed or picked from fixed and relative presets | [`time-picker/index.html`](time-picker/index.html) |

Each folder has its own `README.md` with every option, behaviour, keyboard shortcut and known gap.

## Repository layout

```
calendar-date-picker/   datepicker.js / .css: date picker and the shared core (tokens, skins, parsing, buttons)
date-range-picker/      daterangepicker.js / .css: built on the core
actual-date-time/       datetimepicker.js / .css: subclass of DatePicker
time-picker/            timepicker.js / .css: uses the core's tokens, tooltip and time parser
design-tokens/          tokens.css (--ds-* variables, light and dark) and tokens.md (what each token is for)
index.html              Landing page linking the four demos
```

## Using the components

All components share one core, so always load the date picker files first, then only the components you use:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Roboto:wght@400;500&display=swap">
<link rel="stylesheet" href="calendar-date-picker/datepicker.css">
<link rel="stylesheet" href="date-range-picker/daterangepicker.css">   <!-- ranges -->
<link rel="stylesheet" href="actual-date-time/datetimepicker.css">     <!-- date & time -->
<link rel="stylesheet" href="time-picker/timepicker.css">              <!-- time picker -->

<script src="calendar-date-picker/datepicker.js"></script>
<script src="date-range-picker/daterangepicker.js"></script>
<script src="actual-date-time/datetimepicker.js"></script>
<script src="time-picker/timepicker.js"></script>
```

```js
new DatePicker(el, { label: 'Follow-up date', onChange: date => {} });
new DateRangePicker(el, { label: 'Treatment period', onChange: ({ start, end }) => {} });
new DateTimePicker(el, { label: 'Discharge date & time', nowButton: true });
new TimePicker(el, { label: 'Medication time', presets: [{ now: true, label: 'Now' }, { time: '08:00' }] });
```

Every component accepts `ds: 'custom' | 'ant' | 'mui'` and `theme: 'light' | 'dark'`, and has `setDS()`, `setTheme()` and `destroy()`.

## Running the demos locally

Serve this folder over HTTP (opening the pages with `file://` blocks the scripts), then open http://localhost:5174:

```bash
python -m http.server 5174
```

Each demo page has switches for the design system and the theme, plus a playground that uses the real date and time.

## Design system

- **One palette for every skin.** Custom, Ant Design and MUI use exactly the same colors. Light values come from the component specs and dark values from the Dark mode spec (page `#101828`, surfaces `#030712`, primary `#2b7fff`). Only shape, size, font and shadow depth follow each library.
- **Tokens.** `design-tokens/tokens.css` is the product-wide set (`--ds-*`). The components use matching `--dp-*` variables, so map them in one place when the site adopts `--ds-*`, for example `.dp { --dp-primary: var(--ds-primary); }`.
- **Using Ant Design or MUI components directly.** Theme them with the same palette (Ant `ConfigProvider` tokens or MUI `createTheme` palette, for both light and dark). Don't use the libraries' default brand colors or built-in dark themes.

## Status

| | Date Picker | Range Picker | Date & Time | Time Picker |
|---|---|---|---|---|
| Spec coverage | All states and functionalities | Same | Same | Same |
| Skins | Custom, Ant Design, MUI · light and dark | Same | Same | Same |
| Tested in | Desktop Chrome, 375px width | Same | Same | Same |
| Not yet tested | Safari, Firefox, touch devices, screen readers | Same | Same | Same |

## Decisions for the team before launch

- **Localisation:** the date format is US `mm/dd/yyyy`, weeks start on Monday, and labels are English.
- **Data:** recommended dates, events, unavailable dates and presets are passed in as plain objects. Fetch them from your API.
- **Clinical rules:** conflicts and impossible sequences plug into each component's `validate` option and `min` / `max`.
- **Time format:** the Time Picker shows zero-padded hours (`07 : 45 AM`, per its spec), and Actual Date & Time shows `9 : 42 AM`. Align them if you want one format.
- **Time zones:** Actual Date & Time returns a local `Date`. Decide how to store it (for example UTC plus the zone), and pass `timeZone` to show the zone in the field.
- **Dark mode contrast:** white text on the dark selection blue `#2b7fff` is 3.76:1, below WCAG AA (4.5:1) for 14px text. `#155dfc` (5.25:1) passes if an accessibility review requires AA.
- **Framework wrappers:** for React or Vue, create the component in an effect and call `destroy()` on unmount. The date picker README has a React example.
- **Demo content:** all dates, appointments and reasons on the demo pages are placeholders.
