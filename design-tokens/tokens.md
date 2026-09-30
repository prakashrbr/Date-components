# Design Tokens

Light values come from the Calendar Date Picker spec, and dark values from the "Dark mode" spec (both read from the vector PDFs). **One palette serves every skin**: Custom, Ant Design and MUI use exactly these colors in light and dark, and only shape, size, font and shadow depth differ between skins. Their CSS equivalents are in `assets/tokens.css`, using the variable names in the right-hand column. Most neutrals and accents align with the Tailwind v4 palette (gray/blue/red/amber/pink), which is a handy reference when a new shade is needed.

## Color

### Neutrals

| Token | Light | Dark | CSS variable | Use |
|---|---|---|---|---|
| text-primary | `#101828` | `#ffffff` | `--ds-text` | Body text, values, headings |
| text-secondary | `#364153` | `#d1d5dc` | `--ds-text-secondary` | Long-form copy in docs |
| text-muted | `#6a7282` | `#99a1af` | `--ds-text-muted` | Weekdays, helper text, hints |
| text-disabled | `#99a1af` | `#6a7282` | `--ds-text-disabled` | Placeholder, disabled, unavailable |
| icon | `#4a5565` | `#99a1af` | `--ds-icon` | Nav and keycap icons |
| field-icon | `#4a5565` | `#eaecf0` | `--ds-field-icon` | Icons inside fields (calendar, clock) |
| border | `#d1d5dc` | `#4a5565` | `--ds-border` | Input borders |
| border-hover | `#99a1af` | `#6a7282` | `--ds-border-hover` | Input hover |
| border-subtle | `#eaecf0` | `#364153` | `--ds-border-subtle` | Popover/card borders, keycaps |
| divider | `#f2f3f5` | `#1e2939` | `--ds-divider` | Section dividers inside popovers |
| hover | `#f2f3f5` | `#1e2939` | `--ds-hover` | Hover fill on cells and buttons |
| chip-active | `#eaecf0` | `#364153` | `--ds-chip-active` | Selected quick action / tab |
| switch-track | `#eaecf0` | `#1e2939` | `--ds-switch-track` | Track of AM/PM and 12h/24h switches |
| switch-knob | `#ffffff` | `#364153` | `--ds-switch-knob` | Selected option in a switch |
| surface | `#ffffff` | `#030712` | `--ds-surface` | Inputs, popovers |
| surface-subtle | `#f9fafb` | `#101828` | `--ds-surface-subtle` | Panels, wells, grouped rows |
| surface-muted | `#f2f3f5` | `#1e2939` | `--ds-surface-muted` | Disabled fields, group headers |
| page | `#ffffff` | `#101828` | `--ds-page` | Page background |
| page-side | `#f2f8ff` | `#0a1120` | `--ds-page-side` | Documentation sidebar |

### Brand and interaction

| Token | Light | Dark | CSS variable | Use |
|---|---|---|---|---|
| primary | `#155dfc` | `#2b7fff` | `--ds-primary` | Selected, primary action |
| on-primary | `#ffffff` | `#ffffff` | `--ds-on-primary` | Text/icons on primary |
| focus | `#2b7fff` | `#2b7fff` | `--ds-focus` | Focus/active border |
| primary-tint | `#e2eefe` | `rgba(43,127,255,.20)` | `--ds-primary-tint` | Selected tint (year pill) |
| focus-ring | `#e2eefe` | `rgba(43,127,255,.30)` | `--ds-focus-ring` | 3.5px focus ring |
| primary-strong | `#1447e6` | `#8ec5ff` | `--ds-primary-strong` | Text on primary-tint |
| today | `#155dfc` | `#2b7fff` | `--ds-today` | "Today" dot marker |
| link / doc heading | `#155dfc` | `#51a2ff` | `--ds-accent-text` | Section headings in docs, links |

### Semantic

| Token | Light | Dark | CSS variable | Use |
|---|---|---|---|---|
| error | `#fb2c36` | `#fb2c36` | `--ds-error` | Error border |
| error-text | `#c10007` | `#ff6467` | `--ds-error-text` | Error message and icon |
| error-ring | `#ffe2e2` | `rgba(251,44,54,.25)` | `--ds-error-ring` | Focus ring on an errored field |
| success | `#00c950` | `#05df72` | `--ds-success` | Confirmations |
| success-bg | `#dcfce7` | `rgba(0,201,80,.1)` | `--ds-success-bg` | Success callout background |
| success-on-inverse | `#31ef80` | `#05df72` | `--ds-success-inverse` | Checkmarks inside dark tooltips |
| event | `#bb4d00` | `#e17100` | `--ds-event` | Scheduled-event markers |
| recommend-border | `#fed4ea` | `#c2447f` | `--ds-recommend-border` | Recommended item outline |
| recommend-glow | `rgba(246,51,154,.22)` | `rgba(246,51,154,.35)` |
| recommend-fill | `#ffffff` | `#4a2d45` | `--ds-recommend-fill` | Recommended cell fill | `--ds-recommend-glow` | Inner glow `inset 0 0 8px 1px` |
| smart-gradient | `#c534ff → #f6339a` | same | `--ds-smart-from/to` | Sparkle icon marking AI or "smart" suggestions (icon only) |

### Range selection

These were added with the Date Range Picker.

| Token | Light | Dark | CSS variable | Use |
|---|---|---|---|---|
| range-band | `#e2eefe` | `rgba(43,127,255,.22)` | `--ds-range-band` | Days between start and end |
| range-preview | `#eef4ff` | `rgba(43,127,255,.10)` | `--ds-range-preview` | Hover or focus preview band |
| range-preview-edge | `#2b7fff` | `#51a2ff` | `--ds-range-preview-edge` | Outline on the candidate endpoint |
| range-recommend | `#fef3f9` | `rgba(246,51,154,.16)` | `--ds-range-recommend` | Recommended range band |
| radio-ring | `#bedbff` | `rgba(43,127,255,.35)` | `--ds-radio-ring` | Ring around a selected radio dot |
| primary-hover | `#1447e6` | `#51a2ff` | `--ds-primary-hover` | Primary button hover |

### Inverse (tooltips)

| Token | Light | Dark | CSS variable |
|---|---|---|---|
| inverse-surface | `#101828` | `#1e2939` (+1px `#364153` border) | `--ds-inverse` |
| inverse-text | `#ffffff` | `#ffffff` | `--ds-on-inverse` |

### Documentation-only annotation colors

These are the numbered callout colors used in anatomy diagrams. Never use them in the product UI.

| # | Color |
|---|---|
| 1 | `#0055ff` |
| 2 | `#c534ff` |
| 3 | `#d38900` |
| 4 | `#ff013c` |
| 5 | `#0cb000` |
| 6 | `#fb7a24` |
| 7 | `#00a6f4` |

## Typography

- **Family:** `'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`
- **Load from Google Fonts:** `family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600`
- **Weights:** 400 regular, 500 medium (labels, titles, emphasis), 600 semibold (tooltip and card headings only).

| Token | Size / line height | Weight | CSS variable |
|---|---|---|---|
| display | 32 / 40 | 500 | `--ds-font-display` |
| heading | 20 / 28 | 500 | `--ds-font-heading` |
| subheading | 16 / 24 | 500 | `--ds-font-subheading` |
| body | 14 / 20 | 400 | `--ds-font-body` |
| header-title | 14 / 20 | 500 | `--ds-font-header` |
| label | 12 / 16 | 500 | `--ds-font-label` |
| caption | 12 / 16 | 400 | `--ds-font-caption` |
| tooltip | 12 / 20 | 400 (heading 600) | `--ds-font-tooltip` |
| micro | 11 / 14 | 500 | `--ds-font-micro` |

Text is set with antialiasing (`-webkit-font-smoothing: antialiased`). Use tabular numbers (`font-variant-numeric: tabular-nums`) wherever digits line up in columns or tables.

## Spacing

The base unit is 4px, and 2, 6 and 10 are allowed for tight component internals.

| Token | px | Typical use |
|---|---|---|
| `--ds-space-0_5` | 2 | Marker gaps |
| `--ds-space-1` | 4 | Popover offset from its trigger, icon gaps |
| `--ds-space-1_5` | 6 | Label → input, input → error message |
| `--ds-space-2` | 8 | Chip gap, icon → text in fields |
| `--ds-space-2_5` | 10 | Chip horizontal padding, popover section padding |
| `--ds-space-3` | 12 | Popover padding, input horizontal padding (11 + 1 border) |
| `--ds-space-4` | 16 | Tooltip padding, card padding |
| `--ds-space-5` | 20 | Card padding |
| `--ds-space-6` | 24 | Gaps between panels |
| `--ds-space-8` | 32 | Between content groups |
| `--ds-space-10` | 40 | Grid row height |
| `--ds-space-12` | 48 | Between page sections |

## Size

| Token | px | Use |
|---|---|---|
| `--ds-control-h` | 32 | Inputs, selects, buttons (default) |
| `--ds-button-h` | 30 | Action buttons (Cancel / Done): 0/12 padding, 14px text, radius 8. A secondary button's 1px stroke sits outside the box |
| `--ds-header-h` | 48 | Calendar header row: 14/500 title in a 28px pill, 28px nav buttons |
| `--ds-chip-h` | 24 | Quick actions, tabs, small toggles |
| `--ds-cell` | 32 | Calendar or grid cell (in a 40px row) |
| `--ds-keycap` | 22 | Keyboard hint keys |
| `--ds-icon-md` | 16 | Icons inside fields |
| `--ds-icon-sm` | 14 | Navigation chevrons, inline icons |
| `--ds-popover-w` | 320 | Default popover / field width |
| `--ds-popover-wide-w` | 730 | Two-panel popover (range calendar with presets) |
| `--ds-sidebar-w` | 121 | Preset sidebar inside a popover |
| `--ds-tooltip-w` | 420 | Maximum rich tooltip width |

## Radius

| Token | px | Use |
|---|---|---|
| `--ds-radius-xs` | 4 | Tiny markers |
| `--ds-radius-sm` | 6 | Chips, nav buttons, year cells, group headers |
| `--ds-radius-md` | 8 | Inputs, cells, action buttons |
| `--ds-radius-lg` | 10 | Tooltips, nested popovers |
| `--ds-radius-xl` | 12 | Popovers, cards, panels |
| `--ds-radius-full` | 9999 | Dots, avatars |

## Border and focus

- Borders are always 1px.
- **Focus (keyboard):** `border-color: focus` + `box-shadow: 0 0 0 .5px focus, 0 0 0 3.5px focus-ring`.
- **Active (open/pressed):** `border-color: focus` + `box-shadow: 0 0 0 .5px focus`, with no ring.
- **Error:** `border-color: error` + `0 0 0 .5px error`. When focused, add a 3.5px `error-ring`.
- **Focus on buttons and cells:** `outline: 2px solid focus; outline-offset: 1px`.

## Elevation

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ds-shadow-popover` | `0 12px 24px -6px rgba(16,24,40,.10), 0 4px 8px -2px rgba(16,24,40,.05)` | `0 16px 32px -8px rgba(0,0,0,.65), 0 4px 10px -2px rgba(0,0,0,.4)` | Popovers, dropdowns |
| `--ds-shadow-nested` | `0 10px 24px -6px rgba(16,24,40,.14), 0 2px 6px rgba(16,24,40,.05)` | `0 12px 28px -6px rgba(0,0,0,.7)` | Popover on a popover |
| `--ds-shadow-tooltip` | `0 16px 32px -8px rgba(16,24,40,.30)` | `0 16px 32px -8px rgba(0,0,0,.7)` | Tooltips |

Cards and panels have no shadow: they use `surface-subtle` plus a `border-subtle` border.

## Motion

- Use `120ms–150ms ease` for background, color, border and box-shadow changes.
- Don't animate layout or position for ordinary state changes.
- Under `prefers-reduced-motion: reduce`, remove all transitions.

## Dark mode method

Dark mode follows the "Dark mode" spec:
- The page is `#101828`, and popovers and fields are `#030712`, a step darker so they read as inset surfaces.
- Borders are `#4a5565` on fields and `#364153` on popovers and chips. Dividers are `#1e2939`.
- Text is `#ffffff`, muted text `#99a1af`, and unavailable dates `#6a7282`. Field icons are `#eaecf0`.
- Selection uses the brighter `#2b7fff`. **Contrast note:** white on `#2b7fff` is 3.76:1, below WCAG AA (4.5:1) for 14px text. This is the spec's choice, so flag it if accessibility reviews require AA.
- Events are `#e17100`. Recommended cells are a `#4a2d45` fill, a `#c2447f` border and a pink inner glow.
- Tooltips are a raised `#1e2939` surface with a `#364153` border.
- Every skin uses these values. Ant and MUI don't have their own dark palettes.
