# Testing strategy

Status: **strategy only. No test or config exists yet; no check has been run.** Meaningful assertions over coverage targets (CLAUDE.md).

## Pyramid

| Layer | Tool | Scope | Where |
|---|---|---|---|
| Unit | Vitest | Pure domain: money, dates, filter/search/sort/paginate, URL parse/serialize, CSV, generator, schemas | `src/**/*.test.ts` |
| Integration | Vitest + RTL + user-event (jsdom) | Components with behavior: copy button, tooltip, filter popovers, multi-select, pagination controls, empty state, status badge text+icon | `src/**/*.test.tsx` |
| E2E | Playwright | Critical flows against `next build && next start` | `tests/e2e/` |
| Accessibility | `@axe-core/playwright` + manual checklist | Key states | `tests/e2e/a11y.spec.ts` |
| Visual regression | Playwright `toHaveScreenshot` | Our own UI baselines at fixed viewports; plus manual overlay vs reference | `tests/e2e/visual.spec.ts` |

jsdom caveats: no layout, no real clipboard, no real focus-trap geometry → those go to Playwright.

## Unit test inventory (maps to requirements)

| Area | Cases | Reqs |
|---|---|---|
| Money | integer minor→display for USD/EUR/GBP/BRL/JPY; rounding never via floats; amount-input parser rejects `1e3`, `-1`, `1.234`, `NaN`, 10+ digits | REQ-COL-04, REQ-FLT-04 |
| Dates | presets at boundaries (23:59/00:00 in zone), custom inclusive range, from>to, invalid date, injected clock | REQ-FLT-01, REQ-COL-07 |
| Relative time | seconds/min/hours/days; future skew; locale | REQ-COL-08 |
| Filter | each filter alone, AND combination, empty selection = no filter, zero results | REQ-FLT-01..04, 06 |
| Search | id substring, email case-insens., last4 only when 4 digits, trims, regex metacharacters literal (`.*`, `(`), max length | REQ-FLT-05 |
| Sort | date/amount/status asc+desc, stable tie-break, multi-key order, cross-currency nominal semantic, unknown key ignored | REQ-SORT-* |
| Pagination | sizes 25/50/100, invalid size → default, page clamp, last partial page, total counts, reset on filter change | REQ-PAGE-* |
| URL state | round-trip, defaults omitted, malformed/array/huge/`__proto__` inputs, unknown keys ignored | REC-URL-01, REC-SEC-01 |
| Data | seed determinism, 300–1000 rows, unique ids, schema valid, ≥4 currencies, all 4 official statuses, invariants (refundedAt/declineReason), emails on reserved domains | REQ-DATA-* |
| CSV | formula prefixes, quotes, commas, newlines, unicode, header row, current view only | REC-SEC-02 |
| Shorten ID | deterministic, never longer than N, keeps prefix | REQ-COL-01 |

## Integration (RTL)

Status badge shows text + icon for every status; copy button calls `navigator.clipboard.writeText` with full ID, announces success, survives rejection; tooltip appears on hover and focus, Esc dismisses; multi-select toggles and reflects count; empty state with "clear filters"; pagination buttons disabled at ends; `aria-sort` toggles.

## E2E (Playwright) critical flows

1. Load → default view (25 rows, date desc).
2. Sort by date/amount/status; URL reflects sort; reload preserves.
3. Page size 25→50→100; next/previous; page clamps.
4. Each filter; combined filters; clear all; zero-result state.
5. Search by id, email, last4.
6. Copy ID (grant clipboard permissions in context).
7. Deep link: open a URL with filters → matching UI state.
8. Keyboard-only: tab through filters, open/close popovers, select options, sort via header button.
9. CSV download content check (if built).
10. Viewports: 1440, 1024, 768, 390 — no horizontal page overflow other than the table's own scroller (as in reference).

## Accessibility tests

axe on: default, open filter popover, tooltip shown, empty state, small viewport. Manual: keyboard walk-through, VoiceOver smoke, 200% zoom/reflow, reduced-motion. See `accessibility.md`.

## Visual regression

Baselines are of **our own** screens (guard regressions). Fidelity against the Stripe reference is manual/semi-automatic per `visual-fidelity.md` (overlay at identical scale). Screenshots must be deterministic: fixed seed, fixed clock, fonts loaded, animations disabled, fixed viewport/DPR. Baselines are generated and committed only after review.

## CI (GitHub Actions)

`pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` (`tsc --noEmit`) → `pnpm test` → `pnpm build` → Playwright (install browsers, run against `next start`) → upload report. `pnpm audit` as non-blocking or blocking per ADR (decide in Step 7).

## Scripts to add

`typecheck`, `test`, `test:watch`, `test:coverage`, `e2e`, `format`. Config: `vitest.config.ts` (jsdom, setup with jest-dom), `playwright.config.ts` (webServer: `pnpm build && pnpm start`).

## Results log (fill only with executed runs)

| Date | Command | Result |
|---|---|---|
| 2026-11-24 | `pnpm lint` (scaffold only) | exit 0 |
| 2026-11-24 | `pnpm typecheck` (`tsc --noEmit`) | exit 0 |
| 2026-11-24 | `pnpm build` | exit 0; routes `/` and `/_not-found` static. Initial run warned about a stray `package-lock.json` in `/Users/milla`; fixed with `turbopack.root` in `next.config.ts`, warning gone on re-run |
| 2026-11-24 | `pnpm test` (vitest 5.1.1) | exit 1 — "No test files found" (expected: no tests exist yet) |
| 2026-11-24 | `pnpm exec playwright test --list` | config loads; 0 tests. E2E not run (no tests, no server started) |
| 2026-11-24 | `pnpm exec prettier --check` on new config files | pass |
| 2026-11-24 | Step 2: `pnpm test` (vitest) | exit 0 — 5 files, 91 tests passed (money, dates, query/filter/sort/search/pagination, URL state, generator + schema, repository window) |
| 2026-11-24 | **Pixel-audit pass (final)** `pnpm lint`, `typecheck`, `pnpm test`, `e2e` ×2, visual, `audit` | lint/tsc exit 0; 148 unit; **58 E2E passed twice**; **4 visual passed** after re-generating the baselines (intentional layout/typography changes; baselines reviewed by eye: desktop); `pnpm audit` clean |
| 2026-11-24 | **Final run (Steps 7–11)** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` | exit 0; 12 files / **148 unit+integration tests**; build routes: `/` static, `/payments` partial prerender, `/payments/[id]` partial prerender, `/payments/export` dynamic, Proxy active |
| 2026-11-24 | **Final run** `pnpm e2e --grep-invert @visual` (executed twice) and `pnpm e2e --grep @visual` | **53 passed** both times at that point (58 after the review-driven additions: account menu, date sort, pagination contract; re-run: **58 passed**); **4 visual passed** against baselines generated the same day on macOS (reviewed by eye: desktop baseline checked, dynamic regions masked). Spec files: table, filters, features (CSV/columns/selection/mobile/404), security, accessibility, payment-details, visual |
| 2026-11-24 | Flakiness found and fixed in tests (not in the app) | Assertions that read the DOM right after a filter/URL change raced the server re-render (`expect.poll` added); keyboard/tooltip tests ran before hydration (`waitForLoadState("networkidle")` added); a Playwright mouse jump to (0,0) never produced a pointer-leave for Radix (pointer moved in steps) |
| 2026-11-24 | CI workflow | `.github/workflows/ci.yml` written; **never run on GitHub** |
| 2026-11-24 | Step 6: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` | exit 0; 11 files / 139 tests (adds CSV escaping, sort helpers); build routes `/` static, `/payments` partial prerender, `/payments/export` dynamic |
| 2026-11-24 | Step 6: `pnpm e2e` | **27 passed** (adds CSV endpoint headers/content/invalid params/download button, Edit columns hide+reset, select-all/indeterminate, mobile 390 px menu + no horizontal overflow, 404 page). One real defect found and fixed by the mobile test: `scrollWidth` 1422 > 390 caused by absolutely positioned `sr-only` cells escaping the scroll container (fixed with `relative` on the region) |
| 2026-11-24 | Step 5: `pnpm test`, `pnpm typecheck`, `pnpm lint` | exit 0; 10 files / 124 tests (adds chip summaries, `hasActiveFilters`, 8 statuses) |
| 2026-11-24 | Step 5: `pnpm e2e` | **20 passed** (production build, chromium): 9 table tests + 11 filter/search tests — status tiles, status/method/currency multi-select with apply+clear, amount validation and nominal range, date presets (Today/30 days/custom incl. reversed-range error), popover keyboard (Esc returns focus to chip), search by last 4 / id / email, empty state + Clear filters, regex/script input treated as text, combined filters restored from a shared URL. First run had 7 failures caused by test races (asserting before the server re-rendered after Apply); fixed by polling (`expect.poll`), plus one ambiguous `getByLabel("To")` fixed with `exact`. No app code changed for those fixes. Date-preset tests depend on the real clock (Today needs ≥ 1 row; the seeded window makes this near-certain but not guaranteed within minutes of São Paulo midnight) |
| 2026-11-24 | Step 4: `pnpm test` | exit 0 — 9 files, 111 tests (adds sort logic, StatusBadge, PaymentMethodCell, PaymentIdCell incl. clipboard success/failure/keyboard) |
| 2026-11-24 | Step 4: `pnpm typecheck`, `pnpm lint`, `pnpm build` | all exit 0; `/payments` is a Partial Prerender route (static shell + streamed table) |
| 2026-11-24 | Step 4: `pnpm e2e` after downloading `chromium_headless_shell-1255` (100.8 MiB, user-approved) | **9 passed** (production build on :3100, chromium): default view, `/` redirect, sort by amount (both directions, values verified ordered), sort by status, pagination + page size reset, shared-link restore, malicious query params ignored, clipboard copy, relative-time tooltip on hover and focus + Esc. First run: 8/9; the tooltip test failed because Playwright teleported the mouse to (0,0) in one event and Radix never saw a pointer leave; the test now moves the pointer in 20 steps (real users generate continuous pointer events). This is a test-harness adjustment, not an app change, and tooltip dismissal on a *single* jump was not verified. |
| 2026-11-24 | (superseded) first attempt, before the browser download: all 9 failed to launch  — all 9 failed to launch: Playwright 1.65.1 needs `chromium_headless_shell-1255`, not in `~/Library/Caches/ms-playwright` (cached: 1217–1248). Awaiting permission to run `pnpm exec playwright install chromium`. The spec has therefore never executed; behaviors were checked manually in Chrome against the dev server (sort by status, copy + announcement, relative-time tooltip, Next page → `?page=2`) |
| 2026-11-24 | Step 3: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` | all exit 0 / 91 tests pass; routes `/` (redirect), `/payments`, `/_not-found` static. Manual check in Chrome against the dev server on :3000 (a server already held the port; `pnpm start` hit EADDRINUSE): shell renders, banner dismiss works. No automated UI tests yet |
| 2026-11-24 | Step 2: `pnpm typecheck`, `pnpm lint`, `pnpm build` | all exit 0; build routes still `/` and `/_not-found` (domain not yet wired to a route, so bundle impact of faker/nuqs is **not yet measured**) |
| 2026-11-24 | `pnpm audit` | "No known vulnerabilities found" (scaffold + current deps) |

Installed versions confirmed by reading `node_modules/*/package.json`: next 16.4.6, react/react-dom 19.3.0, @tanstack/react-table 9.3.1, nuqs 2.10.3, zod 4.6.7, tailwindcss 4.3.3, vitest 5.1.1, @playwright/test 1.65.1, @faker-js/faker 10.6.0. Playwright browsers appear cached on this machine (`~/Library/Caches/ms-playwright`); not yet exercised.
