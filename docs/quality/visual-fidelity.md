# Visual fidelity

Status: **Step 1 (measurement) done 2026-11-24 from the static PNG by pixel scanning (PIL/numpy). Colors and extents are measured in image pixels; CSS-pixel values are inferred through a scale factor that is itself an inference (see below). Hover/focus/open states and anything not in the PNG remain unmeasured.** Official requirements: REQ-LOOK-01/02, REQ-REV-01..04.

## Reference artefacts

- `docs/references/reference-payments-screen.png` — 2048×1568 image pixels. Page 3 of the PDF.
- **Scale (inferred, not given):** an earlier draft assumed a 2× HiDPI capture of a 1024 px viewport. Measurement contradicts that: the "T" of the H1 is 27 px tall and body digits are 14 px tall, which would imply ~7 px body text at 2×. A **K = 2048/1440 ≈ 1.422** factor (a 1440 CSS-px-wide viewport scaled to 2048) gives sidebar ≈ 226 px, row pitch ≈ 35 px, button ≈ 28 px and H1 cap-height ≈ 19 px, all plausible for the Stripe Dashboard. K stays **unverified**: it relies on remembered Stripe proportions. Validate by overlaying our render at a 1440 px viewport scaled to 2048 px wide; if edges do not line up, adjust K. Values below are `image px → CSS px = ÷ 1.422`.
- `docs/references/walkthrough-frame.png` — 560×480, single frame of a walkthrough animation (browser window around the dashboard). Hover states, menus, filter popovers, the account menu and the details page are **not observed**.
- Both are gitignored (private reference material).
- Data in the screenshot (customer emails, account name) is real-looking and must not be reproduced.

## Full pixel audit (final, 2026-11-24)

Method: same as below (1440 px viewport, DPR 2048/1440), but now comparing **ink positions** (bounding boxes of dark pixels) of text and icons in the reference PNG and in our render, row by row and column by column, plus side-by-side crops reviewed by eye. Units: image pixels (÷ 1.4222 = CSS px). "Δ" = ours − reference.

| Region | Result |
|---|---|
| Sidebar text rows (16 rows, vertical) | all within ±2 (most 0–1); label x-start within ±1 |
| Sidebar icons | x-start ±2; glyph shapes differ (lucide vs Stripe icons) |
| Org row | chevron 0; avatar is a generic "A" tile (reference shows a logo) |
| H1 "Transactions" | x 379→607 vs 379→608 (Δ0, −1); y ±1 |
| Tabs (6 labels) | x identical (Δ0, one −1/+1); y −1 |
| Search box | 378,12 → 1153,62 vs 378,12 → 1152,61 |
| Top-bar text / icons | text start −5, link end −4; pill/help/bell/gear/plus icon centers −3 … 0 |
| Header buttons (Analyze) | icon and label Δ0/0 and +0/+0; **Create payment** 1657→1856 vs 1667→1859 (≈ 7 px wider on the left) |
| Banner | box 378,239 → 1993,289 (ref …288); sparkle Δ0, "New" +3, message start +1, "Get started" −4, × −2 |
| Status tiles (6) | box ±2; label x ±1 (last −3) |
| Filter chips (6) + Export / Edit columns | chip boxes ±2; chip label x +1…+3; Export icon +1, label +2; Edit columns label Δ0, icon −3 |
| Table header | top line y Δ0; header text y −1; "Amount" x −2; "Payment method" +2; "Description" −2 |
| Row 1 | pitch 50 = 50; amount right edge +1; "USD" x Δ0; badge left x Δ0, width ≈ 91 vs 91 CSS px; text glyph y −1 |
| Payment-method cell | brand tile x ±3 after reserving the wallet slot; dot pitch 9 vs 9; digits width 42 vs 42 |
| Body text size | "Subscription update": 125.4 CSS px (ours, 13.4 px) vs 124.5 (reference ink) |
| Pagination footer | button height 35 vs 34, gap above 27 vs 27; "Previous" ≈ 5 CSS px wider, "Next" ≈ 3 narrower |

**Defects the audit found and fixed:** body font was 13 px (reference ≈ 13.4 px, measured on identical text); H1 26 → 27 px; sidebar icons too small and section labels inset 4 px too far; top-bar spacing (icons 7–15 px too tight); Export/Edit buttons 5 px off, wrong font/gap; "New" label too large; banner message 3 % narrow; table header text 3 px high; "Payment method" column 8 px right; amount ↔ currency gap 9 px too small; badge font/weight/icon; payment-method dots (square characters → real circles); wallet slot (brand icons now align across rows, as in the reference); tile sizes (20 × 18 CSS px) and brand colors sampled from the PNG (Visa `#23569a`, Link `#61d37a`); pagination buttons 30 → 24 px and 19 px spacing above.

**Remaining known differences (not fixed, on purpose or out of reach):**
- Different font family in the reference for some glyphs (badge letters look taller at the same width); we match **widths**, so glyph heights differ by ≈ 1 px.
- Checkbox: ours has a darker 3:1 border and no grey fill (WCAG 1.4.11 decision). The reference shows a "Home" hover pill; ours shows it only on hover.
- Third-party marks: card/wallet tiles now use the real brand marks (see ADR-010; Link is an approximation); the four app icons in the top-bar pill are **hand-traced redrawings** from the zoomed PNG (the third-party apps could not be identified, so no brand claim is made; the last one is a generic "more apps" mark) and the organisation logo is a generic "A" tile.
- Our table has two more columns (Status header, Payment ID) so Customer/Date/… start ≈ 213 image px further right and the row "…" button is off-screen at 1440 px (the table scrolls horizontally, as in the reference).
- Create payment button ≈ 7 px wider; Edit-columns icon −3.
- Not compared pixel-wise: hover/focus/open states, tooltips, popover internals, loading skeleton, anything beyond what the PNG shows (it cuts off after row 20). The reference shows 20 rows, ours 25 (page-size requirement).

## Calibration result (Step 6, 2026-11-24)

Method: production build rendered at 1440 × 1103 CSS px with DPR 2048/1440 = 1.4222 (screenshot 2048 px wide, same scale as the reference), element rectangles read from the DOM and multiplied by K, compared with the reference measurements (image px; ours vs reference). K = 1.4222 turned out to fit the layout better than the text-width fit (1.45), so it is kept. Dynamic content differs (our rows are synthetic and we have extra columns), so only chrome is compared.

| Element | Ours | Reference | Δ |
|---|---|---|---|
| Sidebar divider x | 322 | 322 | 0 |
| Search box | 378,12 → 1153,62 | 378,12 → 1152,61 | ≤ 1 |
| Banner | 378,239 → 1993,289 | 378,239 → 1993,288 | ≤ 1 |
| Status tile 1 / 6 | 378,310 → 639,373 / 1732 → 1993 | 378,310 → 638,372 / 1734 → 1994 | ≤ 2 |
| Chip 1 / 2 | 378,398 → 538,430 / 547 → 656 | 378,397 → 537,429 / 545 → 654 | ≤ 2 |
| Table header top line y | 449 | 449 | 0 |
| First row top y | 499 | 500 | 1 |
| Row pitch | 50 | 50 | 0 |
| Checkbox | 385,513 → 407,534 | 385,514 → 406,536 | ≤ 2 |
| Amount ink right edge x | 525 | 524 | 1 |
| Badge left x / width | 599 / 107 (Pending) · 130.5 (Succeeded, measured 91.8 CSS px) | 598 / 129 | ≤ 2 |
| Create payment button | 1660 → 1855 (195 wide) | 1667 → 1859 (192 wide) | ≤ 7 |
| Analyze button | 1859 → 1993 | 1863 → 1995 | ≤ 4 |

Findings used to calibrate: badge text is ≈ 11 px (reference "S" cap-height ≈ 12 image px), the amount-to-currency-code gap is ≈ 13 CSS px, header buttons use ≈ 13.5 px text, sidebar section spacing needed ≈ +11 CSS px, and a 30 px-high toolbar row (Export / Edit columns) pushes the table down unless margins are re-tuned (caught by this measurement). **Not verified:** H1 / nav / tab glyph shapes (system font on a different OS than the capture), brand icons (original glyphs by design), hover/focus/open states, anything below the first rows. "Pixel-perfect" is not claimed.

## Scale calibration from text widths (2026-11-24)

Fitting the reference text ink widths (image px) against our rendered 13 px system-font text widths (CSS px): `Customers` 94 / 65.6 = 1.43, `Product catalog` 138 / 96.1 = 1.44, `Payments analytics` 168 / 116.3 = 1.44, H1 `Transactions` 230 / 156.9 = 1.47. Ink is a little narrower than advance width, so the fit says **K ≈ 1.45** if body text is 13 px and H1 is 26 px (earlier geometric estimate: 1.42). Interpretation: the reference was likely taken in a ≈ 1410 px viewport; 13 px body / 26 px H1 are inferred, not read from the source. Layout values in the shell were computed with K = 1.4222 and are therefore up to ≈ 2 % off (≈ 4 px at the sidebar divider). Step 6 re-fits K by overlay (render at ≈ 2048 / K px, scale to 2048, diff edges) and adjusts tokens.

Implemented-shell values (CSS px): sidebar 226 + 1 px `#eceef1` right border; content horizontal padding 40; search 545 × 35 at top 8.5; H1 26 px / 32 px bold; buttons 30 px (28 + ring); nav items 29 px high, `gap-3`, icons 16 px; tabs gap 24, active underline 2 px `#635BFF`; banner 35 px high, radius 6 px, `mt-6`. Radii: raw corner measurements underestimate real radii by ≈ 1.4× (compare live Stripe: measured 4.9 → real 6, measured 5.6 → real 8), so tokens are sm 4 / md 6 / lg 8 px. Pill chips are fully rounded.

Design decisions in the shell: the reference shows a grey pill on "Home" while "Transactions" is accent-colored; this is read as a transient hover/focus state of the screenshot and implemented as `hover` only. Account name "Acme Inc." replaces the reference's real organisation name. Third-party app icons in the top-bar pill are generic icons.

## Live Stripe observations (2026-11-24, user's own Stripe test-mode sandbox, read-only)

Source: `dashboard.stripe.com/.../test/payments`, viewport 1920×936 @ DPR 1, read via the browser (screenshots + computed styles). The sandbox contains one payment only; all customer data seen there is ignored.

**The live dashboard is a newer build than the reference PNG, so it is used for behavior and font only, never for geometry or colors.** Differences: palette (live text `#1a2c44`, accent text `#533afd`, vs reference `#363943` / `#4f3bf2`), row height 44 px vs ≈ 35 px, tabs (Payouts, Collected fees, Transfers, Standalone 3DS, All activity; no Top-ups), a single "Filter" menu button instead of ⊕ chips, icon-only export/analyze buttons, "Description" shows the payment id in monospace. The assessment explicitly compares against the **reference PNG**, so it wins every conflict.

Confirmed facts that apply to the reference too:

| Topic | Observation | Consequence |
|---|---|---|
| Font | Stripe uses the **system font stack**: `-apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif`. Monospace: `"Source Code Pro", Menlo, Monaco, monospace`. | No webfont needed: use the same stack → exact glyph metrics on the reviewer's OS, zero font-loading cost, no CLS from fonts. Resolves risk R6. |
| Base sizes | Body 14 px / 20 px line-height; H1 28 px / 36 px, weight 700; table header 12 px, weight 700; nav 14 px (active weight 600, accent color); tabs 14 px / 600. | Confirms the reference scale: reference H1 cap-height 27 image px ≈ 19.7 CSS px (28 px SF cap-height 0.705) → K ≈ 1.37–1.41, consistent with the earlier K ≈ 1.42. Body digits 14 image px vs ≈ 9.9 CSS px → K ≈ 1.41. **Scale now corroborated by two independent measures; still not read from the reference file itself.** |
| Buttons | 28 px high, radius 6 px, `padding 4px 8px`, 1 px ring via `box-shadow 0 0 0 1px #d4dee9` (live palette). | Likely same geometry in the reference (≈ 41 image px). |
| Tiles | Pill-like bordered links, 38 px high, radius 8 px, `padding 8px 12px`, 1 px border (live palette). Reference tiles are 44 px high, 6 equal columns → reference-specific. | Follow reference. |
| Sorting | Column headers are **not sortable** in Stripe (no hover affordance). | Sorting (REQ-SORT-*) is an assessment requirement with no Stripe precedent → we design it (sortable header button + chevron). |
| Date tooltip | Hovering the Date cell for ≈ 1 s showed only a row highlight, no tooltip. | REQ-COL-08 has no Stripe precedent either; we design it. |
| Row hover | Row gets a light blue-grey background on hover. | Implement; color from reference palette family (measure the equivalent in `#f5f6f8`-family; to be confirmed). |
| Filter menu | "Filter" button opens a popover listing: Date and time, Amount, Currency, Status, Payment method, Agentic transactions, Customer ID, Invoice, Decline reason, Email, Card brand, Last 4 digits, Dispute amount … (scrollable). | In the reference these appear as ⊕ chips + "More filters"; "More filters" popover can reuse this list (labels). |
| Status filter popover | Title row with a back button, scrollable checkbox list (Blocked, Canceled, Dispute lost, …), full-width accent **Apply** button. | Multi-select pattern: checkbox list + Apply. |
| Date filter popover | Back button + title, a select (`is in the last`), a number input + unit select (`days`), "Time zone" radio (UTC+1 / UTC+0), accent **Apply**. | Informs our presets UI (Today / 7 days / 30 days / Custom, REQ-FLT-01) and timezone note. |
| Layout | Sidebar 200 px wide, content starts at x = 280 (live, 1920 px viewport). | Not used (differs from reference). |

## Hierarchy (top to bottom, left to right) — REQ-REV-01

1. **Sidebar (≈ 226 CSS px wide, inferred)**: org switcher (avatar, name "…", chevron); primary nav: Home, Balances, **Transactions, Customers, Product catalog; section label "Shortcuts": Payments analytics, Reports, Sigma, Radar; section label "Products": Connect, Payments, Billing, Reporting, More (each with a chevron); "Developers" pinned at the bottom; thin vertical divider/resize handle between sidebar and content.
2. **Top bar**: search field (grey fill, search icon, placeholder "Search"), text "Test mode has moved." + underlined link "Show me", a pill of 4 app/integration icons, help, notifications (with blue dot), settings, accent circular "+" button.
3. **Page header**: H1 "Transactions" (bold, font size inferred ≈ 26–28 px); right: primary button "+ Create payment" (accent fill, white text) and secondary "Analyze" (white, border, chart icon).
4. **Tabs**: Payments (active: accent text + 2px underline), Payouts, Top-ups, Collected fees, Transfers, All activity; bottom border line across the content width.
5. **Banner** (light grey fill, rounded): sparkle icon + bold "New" + "Rule Attributes are now in Sigma and Data Pipeline for better fraud insights." ; right: accent link "Get started", vertical divider, dismiss ×.
6. **Status tiles** (6 equal columns, bordered, rounded): All (active: accent border + accent text), Succeeded, Refunded, Disputed, Failed, Uncaptured.
7. **Filter row**: chips with ⊕ icon (pill-shaped, light/dashed border): Date and time, Amount, Currency, Status, Payment method, More filters. Right-aligned: "Export" (icon + label) and "Edit columns" (gear icon) buttons.
8. **Table**: header row with select-all checkbox; columns Amount, Payment method, Description, Customer, Date, Refunded date, Decline reason (cut off — horizontal scroll with visible scrollbar), per-row "…" menu. Row pitch 50 image px (≈ 35 CSS); hairline row dividers.
9. **Footer**: "Viewing 1–20 of over 10,000 results" left; "Previous" (disabled) and "Next" buttons right.

## Cell anatomy

- **Amount cell:** right-aligned bold amount (`$9.88`, `£15.99`, `R$ 99.99`), then muted currency code (`USD`), then status badge.
- **Status badges** (small pill, 1px border, tinted background, text + trailing icon): Succeeded (green, ✓), Failed (red, ✕), Canceled (grey, ✕), Blocked (red, ⊖). Pending/Refunded styles are **not in the screenshot** — derive from Stripe conventions and flag as unverified.
- **Payment method cell:** optional wallet mark (Apple Pay black tile, Link green tile) + card network mark + `•••• 4149`. Marks replaced with original glyphs (ADR-010).
- **Description:** plain text. **Customer:** email. **Date:** `Aug 16, 5:03 PM` (month abbreviation, day, 12-hour time; no year in the screenshot — verify behavior for other years). **Empty values:** `—` muted.
- Row hover state, selected state, focus state: not observed.

## Inconsistencies with written requirements

Tracked in `docs/requirements.md` §2 (I-1…I-9). Key ones: no Payment ID column in the reference; "Date" vs "Created"; statuses Canceled/Blocked vs Pending/Refunded; no page-size selector.

## Typography (to measure)

Stripe uses a proprietary sans (not licensed for reuse). Candidate: Inter or system UI stack with matching weights/size. Measured glyph extents (image px): H1 "T" cap-height 27 (≈ 19 CSS → ~26–28 px font if cap-height ≈ 0.7 em); body digits 14 (≈ 10 CSS → ~14 px font); table header text height 12; sidebar section label 13. Font sizes are therefore **inferred** from cap-height ratios, not read from CSS. Tabular figures for amounts. Fidelity limit: glyph shapes differ; match sizes, weights, line-height and letter-spacing instead.

## Colors (measured by sampling the PNG; screenshot may carry a display color profile, so values can deviate slightly from the CSS source)

| Role | Measured | Where sampled |
|---|---|---|
| Accent fill (primary button, active tile border, tab underline) | `#655df6` | Create payment button, active "All" tile border, active tab underline |
| Accent text/links/active nav | `#4f3bf2` (text anti-aliasing darkest pixel) | "Transactions" nav, active tab, "Get started" |
| Primary text | `#363943` | table amount, headers, sidebar items |
| H1 | `#2f303c` (darkest pixel) | "Transactions" |
| Muted text | `#5a6170` | currency code, customer, em dash, section labels, inactive tab |
| Disabled text | `#9b9ba1` | "Previous" button |
| Page background | `#ffffff` | — |
| Subtle fill | `#f5f6f8` | banner, search field, active sidebar pill ("Home"), Canceled badge |
| Border strong | `#d9dee3` | tab bottom line, inactive tile border, Canceled badge border |
| Border table header top | `#dadfe4` | header top line |
| Border row divider | `#eceef1` | row lines |
| Succeeded badge | bg `#edfbe0`, border `#b8ef81`, text `#396e1f` | row 2 |
| Failed badge | bg `#fcf4f6`, border `#f5d4dc`, text `#b02b41` | row 1 |
| Canceled badge | bg `#f5f6f8`, border `#d9dee3`, text `#5a6170` | row 6 |
| Blocked badge | bg `#fcf4f6`, border `#f5d4dc`, text `#b02a40` | row 12 |
| Scrollbar thumb / track | `#c1c1c1` / `#fafafa` | native overlay scrollbar |

Brand reference: Stripe's blurple is commonly `#635BFF`; the measured `#655df6` is probably the same color shifted by the screenshot's color profile. **Decided by user 2026-11-24: accent = `#635BFF`.** Pending/Refunded badge colors are not in the PNG.

## Token table

Image px measured; CSS = ÷ 1.422 (K inferred). "—" = not yet measured.

| Token | Image px | CSS px (inferred) | Method |
|---|---|---|---|
| Sidebar width (divider at x) | 322 | ≈ 226 | vertical line scan |
| Content left/right padding | 378 − 322 = 56 / 2048 − 1993 = 55 | ≈ 39–40 | banner/search extents |
| Content width (banner x 378–1993) | 1616 | ≈ 1136 | row scan |
| Top bar search box (y 12–61, x 378–1152) | 50 × 775 | ≈ 35 × 545, top offset ≈ 8 | run scan, fill `#f5f6f8` |
| H1 "Transactions" | cap-height 27, text width 230 | cap ≈ 19 | bbox |
| Tabs bottom line (y 205–206) | 2 | ≈ 1 px, `#d9dee3` | line scan |
| Banner (y 239–288) | 50 high | ≈ 35, fill `#f5f6f8` | run scan; radius — |
| Status tile row (y 310–372) | 63 high | ≈ 44; first tile x 378→636 (≈ 181 wide); gap ≈ 12 px (≈ 8) | border scan; radius — |
| Active tile border | 2 | ≈ 1.4 → 1–2 | `#655df6` |
| Chips / Export / Edit columns | height ≈ 32 (visual bbox) | ≈ 22 | **rough**, re-measure |
| Table header top border (y 449–450) → header bottom (y 499–500) | 50 | ≈ 35 | line scan |
| Row pitch (dividers y 549/550, 599/600, … ≈ 50 apart) | ≈ 50 | ≈ 35 | line scan |
| Row divider | 1–2 | ≈ 1, `#eceef1` | line scan |
| Create payment button height | ≈ 41 (visual) | ≈ 28 | **rough**; radius — |
| Badge height | ≈ 25 (visual bbox) | ≈ 18; radius — | **rough** |
| Cell horizontal padding | — | — | not measured |
| Hover / selected row, focus ring | — | — | not in reference |

Contrast of measured colors (computed 2026-11-24, WCAG relative luminance): muted `#5a6170` on white 6.22:1; on `#f5f6f8` 5.75:1; primary text 11.52:1; accent text `#4f3bf2` 6.48:1; white on `#655df6` 4.72:1 (white on `#635bff` 4.70:1); badge text on badge fills 5.69 (Succeeded), 5.94 (Failed), 5.75 (Canceled); chip icon `#6d7686` 4.58:1 (graphic ≥ 3:1 OK). **All measured text colors pass 4.5:1.** Disabled "Previous" `#9b9ba1` is 2.76:1 (disabled controls are exempt). **Non-text boundaries fail 3:1:** row/tile/checkbox border `#d9dee3` on white is 1.35:1 and badge borders ≈ 1.2:1. Where the border is the only cue identifying a control (checkbox, filter chip), WCAG 1.4.11 may apply → decide in Step 8: slightly darker border for checkbox/inputs only, documented as a deviation.

## Comparison procedure

1. Render at a 1440 px-wide viewport and scale the capture to 2048 px wide (K ≈ 1.422) to match the reference; capture full-page PNG.
2. Overlay (difference blend) with the reference in an image tool or a script; because content (fonts, data) differs, evaluate **geometry** — positions of edges, heights, gaps, radii — not pixel diffs.
3. Record each discrepancy in a table: element, reference px, ours px, delta, fixed?
4. Repeat until all deltas ≤ 1 CSS px or an explained exception (font metrics, brand marks).
5. Never state "pixel-perfect"; state measured deltas.

## State checklist (REQ-REV-02, CLAUDE.md)

Legend: **impl** = implemented in code; **E2E/IT** = covered by an automated test; **seen** = looked at in a real browser; **ref** = comparable with the reference (almost all states are not visible in it). Status as of 2026-11-24 (Step 6). Cells marked "—" are not implemented or not applicable.

| Element | hover | focus-visible | active/pressed | disabled | empty/error |
|---|---|---|---|---|---|
| Buttons (primary/secondary) | impl | impl | impl | impl (Previous/Next, seen) | — |
| Sidebar item | impl | impl | — | — | — |
| Tabs / tiles | impl | impl | tiles `aria-pressed` (E2E) | — | — |
| Filter chip (closed/applied/open) | impl | impl (E2E: Esc returns focus) | open bg | — | — |
| Sortable header | icon on hover (seen) | impl | `aria-sort` (E2E) | — | — |
| Row / checkbox | row hover (seen), checkbox border | impl | selected row bg (E2E) | — | — |
| Copy button | appears on row hover/focus (seen) | impl (E2E) | check icon + live region (E2E) | — | failure message (IT) |
| Tooltip | hover + focus + Esc (E2E) | — | — | — | — |
| Pagination | — | impl | — | Previous on page 1 (E2E) | "No results" |
| Zero results | — | — | — | — | impl + Clear filters (E2E) |
| Route error / 404 | — | — | — | — | `error.tsx` implemented, **not exercised**; 404 (E2E) |
| Loading | — | — | — | — | skeleton implemented, seen only during navigation |

None of these states can be compared with the reference (it shows only the default state), so "matches Stripe" is not claimed for them.

## State checklist (original template, superseded)

| Element | default | hover | focus | active | disabled | empty/error |
|---|---|---|---|---|---|---|
| Sidebar item | | | | | | n/a |
| Primary / secondary button | | | | | | n/a |
| Tabs | | | | | | n/a |
| Status tile | | | | | | n/a |
| Filter chip (closed/open/applied) | | | | | | n/a |
| Table header (sortable) | | | | | | n/a |
| Row / checkbox / "…" menu | | | | | | |
| Copy button (idle/copied) | | | | | | |
| Tooltip | | | | | | n/a |
| Pagination | | | | | | |
| Zero-results | n/a | n/a | n/a | n/a | n/a | |

Hover/focus/open states are not visible in the static reference → derive from Stripe test mode if accessible (Q9); otherwise mark each as "designed, not reference-verified".

## Responsive behavior

Reference shows only a single desktop layout (≈ 1440 CSS px wide, inferred). Narrower layouts are our design (sidebar collapses; table scrolls horizontally like the reference's scroller). Not reference-verified.

## Results log

| Date | Review | Outcome |
|---|---|---|
| — | side-by-side review | Not yet executed |

### Known deviation: Payment method column (2026-11-24)

The Payment method column was widened from 125 to 133 css px and given `pl-2` so its header and cells have the same horizontal padding as the other columns (user request). Description and every column after it therefore sit about 8 css px further right than in the earlier pixel calibration. The calibration battery was not re-run after this change.

### Button metrics re-measured against the reference (2026-11-24)

Ink and border positions of the Create payment, Analyze, Export and Edit columns buttons were compared with the reference PNG at the same scale. Buttons are 28 css px tall with the border drawn inside the box (`ring-inset`), 8–9 px horizontal padding, a 1 px darker bottom edge on secondary buttons, and 12 px icons in the toolbar. The Export icon is a thin outline traced from the reference (the live Dashboard now serves a heavier variant). Remaining differences are up to about 1 css px in horizontal position. The Payment ID column that the written requirements add is not in the reference, so columns to its right sit further right than in the screenshot.
