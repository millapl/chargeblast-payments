# Accessibility

Status: **requirements and test plan only; nothing implemented or verified.** Target WCAG 2.2 AA (CLAUDE.md, `REC-A11Y-01`). Not an official assessment requirement, but part of our quality bar. Where fidelity conflicts with accessibility, the deviation is documented here rather than silently chosen.

## Requirements

| ID | Requirement | WCAG | Plan |
|---|---|---|---|
| A-01 | Semantic structure: `<header>`, `<nav aria-label>`, `<main>`, one `<h1>` ("Transactions"), real `<table>` with `<caption>`/`aria-label`, `<thead>/<th scope="col">` | 1.3.1, 4.1.2 | Landmarks + table markup |
| A-02 | Sortable headers are `<button>`s inside `<th aria-sort>` with state announced; click and Enter/Space | 2.1.1, 4.1.2 | Header component |
| A-03 | Status communicated by text **and** icon, never color alone | 1.4.1 | StatusBadge |
| A-04 | Visible focus on every interactive element, not obscured by sticky header/popover | 2.4.7, 2.4.11 | `:focus-visible` ring token; scroll-padding |
| A-05 | Filter popovers: `aria-haspopup`, `aria-expanded`, focus moves in, Esc closes, focus returns to trigger, Tab order sane | 2.1.1, 2.4.3, 3.2.1 | Radix Popover (ADR-004) or equivalent |
| A-06 | Multi-select: checkbox group semantics with accessible names; selected count announced | 1.3.1, 4.1.2 | Checkbox list in popover |
| A-07 | Tooltip content available on hover **and** focus, dismissible (Esc), hoverable, persistent until dismissed | 1.4.13 | Tooltip wraps focusable trigger (`<time>` focusable via button/`tabIndex=0`) |
| A-08 | Copy action has accessible name incl. the ID ("Copy payment ID pi_…") and announces result via polite live region | 4.1.3 | CopyIdButton |
| A-09 | Row checkboxes and select-all have labels ("Select payment pi_…") | 1.3.1, 4.1.2 | Table |
| A-10 | Text contrast ≥ 4.5:1 (3:1 large/UI components). Muted greys from the reference measured; failures documented with the chosen compliant shade | 1.4.3, 1.4.11 | Token audit |
| A-11 | Targets ≥ 24×24 CSS px (or spacing exception) | 2.5.8 | Reference rows are dense; check icon buttons |
| A-12 | Reflow at 320 CSS px and 200% zoom; table scrolls inside its own region (focusable, labelled) | 1.4.10, 1.4.4 | Scroll container `tabIndex=0` + `role="region"` + label |
| A-13 | Respect `prefers-reduced-motion` | 2.3.3 (AAA) / best practice | Disable transitions |
| A-14 | Form controls (amount inputs, search, date inputs) have visible labels or `aria-label`, error text associated via `aria-describedby`, validation messages not color-only | 3.3.1, 3.3.2 | Filters |
| A-15 | Empty/loading/error states are announced (`role="status"`/`aria-live`) | 4.1.3 | EmptyState |
| A-16 | Language set (`<html lang="en">`), page title per route | 3.1.1, 2.4.2 | layout/metadata |
| A-17 | Dismissible banner and menus operable by keyboard; `aria-label="Dismiss"` | 2.1.1 | Banner |

## Known fidelity-vs-accessibility tensions to resolve with measurement

1. Reference muted grey text (e.g. "Description", dashes, currency code) may be below 4.5:1.
2. Reference filter chip borders (dashed light grey) may be below 3:1 (WCAG 1.4.11 applies to the component's visual boundary only where needed to identify it; evaluate).
3. Dense 24px-ish row controls vs 2.5.8.
Decision rule: keep reference value if it passes; otherwise the smallest change that passes, recorded in `visual-fidelity.md`.

## Verification

- **Automated:** `@axe-core/playwright` on default, popover open, tooltip visible, empty state, narrow viewport. Fail the test on any violation.
- **Manual (to run and record):** keyboard-only walk-through of every flow; VoiceOver + Safari/Chrome smoke test; 200% zoom; reduced motion; Windows High Contrast / forced-colors sanity check.
- Automated tools cover only a fraction of WCAG; do not claim "WCAG AA compliant" — claim only what was tested.

## Results log

| Date | Check | Result |
|---|---|---|
| 2026-11-24 | axe-core (tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) via `@axe-core/playwright` on 12 states: default, status popover, amount popover with validation error, date popover (custom), edit-columns panel, tooltip visible, filtered/sorted view with applied chips, empty state, payment details page, 404, mobile default, mobile with the navigation menu open | **0 violations** after fixes (below). Run 3× consecutively without flakiness after hydration waits were added to the tests |
| 2026-11-24 | Keyboard (automated) | Skip link is the first tab stop and moves focus to `#main`; every control in a table row is focusable; sort headers are buttons with `aria-sort`; popover closes with Esc and returns focus to its trigger |
| 2026-11-24 | `prefers-reduced-motion` | Transition duration < 0.01 s on buttons when reduce is emulated |
| 2026-11-24 | Narrow viewports | No horizontal page scroll at 390 and 640 px (table scrolls inside its own labelled region) |
| — | VoiceOver / NVDA, forced-colors, 400 % zoom, real touch | **Not executed** — automated axe covers only part of WCAG; manual assistive-tech testing is still outstanding |

**Defects found by these tests and fixed:** (1) the "clear filter" × button in an applied chip was smaller than 24 × 24 px (WCAG 2.5.8) → min 24 px target; (2) `sr-only` cells escaped the scroll container and made the mobile page scroll sideways (1.4.10) → `relative` on the scroll region.

**Contrast decisions (WCAG 1.4.3 / 1.4.11):** all measured text colors pass 4.5:1 (see `visual-fidelity.md`). The reference's light borders (`#d9dee3`, 1.35:1 on white) fail 3:1 for *controls*: checkbox borders, text-input rings and the page-size select now use `#8b93a1` (≈ 3.1:1). This **deliberately deviates from the reference** for those controls only; decorative borders (tiles, rows, chips whose label identifies them) keep the reference color. The disabled "Previous/Next" text is exempt (disabled).
