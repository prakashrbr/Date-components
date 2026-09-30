# Calendar Date Picker

A date input with a calendar popup, built from the "Calendar Date Picker" design spec. It's plain JavaScript and CSS with no dependencies or build step.

It comes with three visual skins, each in light and dark:

| Skin | Use when |
|---|---|
| `custom` | Default. Matches the design spec (DM Sans, spec colors and spacing). |
| `ant` | The site is built with Ant Design v5. |
| `mui` | The site is built with MUI v5/v6. |

> **If the site already uses Ant Design or MUI:** consider using that library's own date picker (antd `DatePicker` or MUI X `DatePicker`) and porting the behaviour listed under [Features](#features). This package reproduces their look, but the real components match the rest of the site in theming, forms and validation. The `ant` and `mui` skins here show how the spec's features look inside each system. All three skins use the same colors in light and dark; theme the library with the same palette (see `design-tokens/` in the handoff).

## Files

| File | What it is |
|---|---|
| `datepicker.js` | The component. It defines `window.DatePicker`. |
| `datepicker.css` | Design tokens and the three skins. |
| `index.html` | Documentation and demo page covering every state and feature. Not needed in production. |

`datepicker.js` also exposes `DatePicker.shared` (date helpers, icons, parser), and `datepicker.css` holds the shared action buttons (`.dp-btn`) and popover note (`.dp-note`). The Date Range Picker (`../date-range-picker/`) and Actual Date & Time (`../actual-date-time/`) are built on this core, so ship these two files with them.

Dates outside `min` / `max` are disabled and shown without the strike line. Pass `minReason` / `maxReason` to explain them in the tooltip. Dates listed in `unavailable` keep the strike line.

## Quick start

```html
<!-- Fonts: DM Sans for the custom skin, Roboto for the MUI skin -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Roboto:wght@400;500&display=swap">
<link rel="stylesheet" href="datepicker.css">

<div id="followup-date"></div>

<script src="datepicker.js"></script>
<script>
  const picker = new DatePicker(document.getElementById('followup-date'), {
    label: 'Follow-up date',
    onChange: date => console.log(date)   // a Date object, or null when cleared
  });
</script>
```

To preview the demo page, serve the folder over HTTP. Opening it with `file://` can block the scripts.

```bash
python -m http.server 5173
```

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `ds` | `'custom' \| 'ant' \| 'mui'` | `'custom'` | Visual skin. |
| `theme` | `'light' \| 'dark'` | `'light'` | Can be changed later with `setTheme()`. |
| `label` | string | `'Date'` | Field label. |
| `value` | `Date \| 'YYYY-MM-DD'` | `null` | Initial value. |
| `today` | `Date \| 'YYYY-MM-DD'` | real today | Override for testing and demos. |
| `min`, `max` | `Date \| 'YYYY-MM-DD'` | none | Dates outside the range are unavailable, and the tooltip explains why. |
| `unavailable` | `{ 'YYYY-MM-DD': reason }` | `{}` | Specific blocked dates. The reason text appears in the tooltip and in typed-entry errors. |
| `isUnavailable` | `(date) => string \| null` | none | Rule-based blocking, e.g. weekends. Return a reason string to block the date. |
| `events` | `{ 'YYYY-MM-DD': { title, items: string[] } }` | `{}` | Shows event markers (up to 3) and a tooltip listing the events. |
| `recommended` | `{ 'YYYY-MM-DD': { title?, reason, checks?: string[] } }` | `{}` | Pink highlight plus a "Why this date?" tooltip. **A reason is required** (see the spec's Recommendation Rules). |
| `recommendation` | `{ summary, candidates: string[] }` | `null` | Turns on the **Recommended** view: summary text plus candidate dates grouped by month. |
| `quickActions` | `Array<{ label, view } \| { label, offset }>` | see below | `view: 'days' \| 'recommended'` switches views. `offset: n` selects today + n days. |
| `inline` | boolean | `false` | Starts with the calendar open, in the page flow instead of as a popup. Outside clicks don't close it. |
| `closeOnSelect` | boolean | `true` | Closes the calendar once a date is picked, by click, Enter, a quick action or typed entry. Clicking the field reopens it. Set to `false` to keep it open. |
| `disabled` | boolean | `false` | |
| `onChange` | `(date: Date \| null, picker) => void` | none | Fires on selection, valid typed entry, or clear. |

The quick actions default to **Calendar · Recommended · Today** when `recommendation` is set, and **Calendar · Today · Yesterday** otherwise. The spec suggests actions per workflow, e.g. `{ label: '+7 days', offset: 7 }`.

## Methods

```js
picker.getValue();       // Date | null
picker.setTheme('dark');
picker.setDS('ant');     // rebuilds the markup and keeps the value
picker.destroy();        // removes the markup and document listeners
```

## Features

- **Typed entry.** Accepts `mm/dd/yyyy`, `8/3/2027` (leading zeros are optional) and `08032027`. Entry is committed on Enter or blur and normalised to `08/03/2027`. Error messages cover an invalid month ("Please enter appropriate month", from the spec), an invalid day, two-digit years, a wrong format, and unavailable or out-of-range dates (with the reason).
- **Closing.** Picking a date closes the calendar and returns focus to the field. Esc and clicking outside the field also close it (outside clicks don't close `inline` calendars).
- **Calendar views.** Month navigation, plus a year picker: a scrolling list in the custom and MUI skins, a decade panel in the Ant skin. The Ant skin also has a month panel.
- **Smart context.** Today marker, recommended dates with a reason, event markers with details, and unavailable dates with an explanation. Tooltips show on hover and on keyboard focus.
- **Keyboard.**

  | Key | Action |
  |---|---|
  | ↓ in the input | Open the calendar and focus the grid |
  | ← → ↑ ↓ | Move by day or week |
  | PageUp / PageDown | Previous / next month |
  | Shift + PageUp / PageDown | Previous / next year |
  | Home / End | Start / end of the week |
  | Enter | Select the focused date |
  | Esc | Close, or go back from the year view |

- **Accessibility.** The popup is `role="dialog"` and the days use `role="grid"`. Days get full `aria-label`s (e.g. "Wednesday, December 10, 2025, selected, recommended"). The grid uses roving `tabindex`, errors are linked with `aria-describedby`, month changes are announced through a live region, and `prefers-reduced-motion` is respected.

## Theming

Every color and size is a CSS custom property on `.dp`, scoped by skin and theme:

```css
.dp                                        { /* custom · light */ }
.dp[data-ds="custom"][data-theme="dark"]   { … }
.dp[data-ds="ant"]                         { … }
.dp[data-ds="ant"][data-theme="dark"]      { … }
.dp[data-ds="mui"]                         { … }
.dp[data-ds="mui"][data-theme="dark"]      { … }
```

Main tokens: `--dp-primary`, `--dp-focus`, `--dp-ring`, `--dp-text`, `--dp-muted`, `--dp-border`, `--dp-error`, `--dp-event`, `--dp-rec-border`, `--dp-tip-bg`, `--dp-font`. To match your brand, override them on a wrapper:

```css
.my-form .dp { --dp-primary: #0a66c2; --dp-focus: #0a66c2; }
```

The site's own dark mode has to call `setTheme()` when the theme changes, because the component doesn't watch `prefers-color-scheme` itself.

## Before production

These are known gaps for the developer to decide on:

- **Localisation.** The format is fixed to US `mm/dd/yyyy`, weeks start on Monday, and month and day names are English. The spec asks for "locale-appropriate ordering", so wire this to the site's locale if needed.
- **Data comes from the page.** `events`, `recommended`, `unavailable` and `recommendation` are plain objects passed in. Fetch them from your API before creating the picker. There is no setter to update them yet: call `destroy()` and create a new instance, or add a `setData()` method.
- **Form integration.** The value lives in the component. To submit with a regular `<form>`, write the ISO date into a hidden input in `onChange`. Nothing sets a `name` attribute.
- **Framework wrappers.** For React, Vue and similar, mount it in an effect and call `destroy()` on unmount. A React sketch:

  ```jsx
  function DateField(props) {
    const ref = useRef(null);
    useEffect(() => {
      const p = new DatePicker(ref.current, props);
      return () => p.destroy();
    }, []);
    return <div ref={ref} />;
  }
  ```

- **Testing.** Tested in desktop Chrome, and at 375px width for layout. Not yet tested in Safari, Firefox, on touch devices, or with screen readers.
- **Demo content.** Sample dates, appointments and recommendation reasons in `index.html` are placeholders.
