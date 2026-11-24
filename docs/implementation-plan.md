# Implementation plan

Status: **planning only. No application code written. No quality check has been executed.**

Official vs recommended items are labelled as in `docs/requirements.md` (`REQ-*` official, `REC-*` recommended).

## Principles

1. Required table first, fully correct; optional features only after.
2. Pure domain logic first (cheap to test), UI second.
3. One feature at a time; each step ends with its acceptance criteria *executed*.
4. No dependency added without an ADR line in `architecture/decisions.md`.

## Roadmap

| Step | Work | Depends on | Acceptance criteria | Agent |
|---|---|---|---|---|
| 0 | **DONE 2026-11-24 (docs-based; see results in `quality/testing.md`).** Remaining from this step: bundle/JS measurement of TanStack client table and faker leakage — moved to Steps 2 and 4. **Housekeeping & spikes.** Run baseline `pnpm install --frozen-lockfile`, `lint`, `tsc --noEmit`, `build`; record results. Read `node_modules/next/dist/docs/` (cacheComponents, searchParams, headers/CSP), TanStack Table v9 and nuqs docs (Context7). Add prettier, vitest, playwright configs, scripts (`typecheck`, `test`, `e2e`). Throwaway spike: nuqs + RSC searchParams + TanStack v9 column model. | — | Baseline results written in `quality/testing.md` status table; ADR-002/003 confirmed or revised. | test-engineer |
| 1 | **DONE 2026-11-24 (partial):** colors, divider positions, row pitch, sidebar width, tile/banner/search extents measured; scale inferred as K ≈ 1.422 (1440 px viewport) — earlier "2×" assumption was wrong. **Remaining:** corner radii, chip/button/badge exact heights, cell paddings, then define tokens in `globals.css` during Step 3. **Reference measurement.** Measure colors, font sizes, row/header heights, paddings, radii from `reference-payments-screen.png`. | 0 | Token table in `visual-fidelity.md` filled with measured values and measurement method. | ui-fidelity-reviewer + ui-engineer |
| 2 | **DONE 2026-11-24:** domain (types, Zod schema, money, dates, query/filter/sort/search/paginate, URL state via nuqs parsers) + seeded generator + hourly-window repository; 91 unit tests pass. Not yet done from this step: CSV serializer (Step 9). **Domain + data.** `types`, Zod schemas, money/format helpers, seeded generator (~500 rows), `queryPayments`, URL-state parse/serialize. | 0 | Unit tests for REQ-DATA-*, REQ-FLT-*, REQ-SORT-*, REQ-PAGE-*, REC-URL-01 pass. | domain-data-engineer |
| 3 | **DONE 2026-11-24 (pixel calibration deferred to Step 6):** tokens in `globals.css`; `Sidebar`, `Topbar`, `PageHeader`, `Tabs`, `Banner` (dismissible) and `Button`; route group `(dashboard)` with `/payments`; `/` redirects to `/payments`. Known gaps: sidebar is hidden below 1024 px with no mobile nav yet; non-implemented nav items/tabs are inert buttons. **App shell.** Sidebar, top bar (with search), page header, tabs, banner (REQ-OPT-01/02). | 1 | VIS review of shell vs reference; keyboard nav works. | ui-engineer |
| 4 | **DONE 2026-11-24 (calibration deferred):** table with TanStack Table (columns, row selection), sortable Amount/Status/Date headers (URL-driven, `aria-sort`), status badges (6 statuses, text + icon), payment-method cell with original brand glyphs, Payment ID with copy + live-region announcement, Date cell with relative-time tooltip (hover + focus), pagination footer with 25/50/100, empty state, skeleton, `await connection()` before reading the clock. 111 unit/integration tests pass. E2E: 9/9 pass on a production build (see `testing.md`). **Not done:** pixel calibration (Step 6), Status tiles/filters (Step 5). **Table core.** Columns, StatusBadge, PaymentMethodCell, CopyButton, relative-time tooltip, sorting, pagination + page size (REQ-COL-*, REQ-SORT-*, REQ-PAGE-*). | 2, 3 | IT tests pass; E2E sort/paginate/copy pass. | ui-engineer + test-engineer |
| 5 | **DONE 2026-11-24:** status tiles (All, Succeeded, Refunded, Disputed, Failed, Uncaptured), chips Date and time / Amount / Currency / Status / Payment method / More filters (Radix Popover, Apply pattern), top-bar search (debounced 300 ms, Enter submits), clear-filters, empty state, URL round-trip. Domain gained `disputed` and `uncaptured` statuses. **Not rendered yet (present in reference):** "Export" and "Edit columns" buttons — Export arrives with Step 9; Edit columns is open (would use TanStack column visibility). **Filters.** Status tiles, chips: Date and time, Amount, Currency, Status, Payment method; search (REQ-FLT-*); URL sync (REQ-OPT-04). | 2, 4 | E2E for every filter + reload/share restores state. | ui-engineer |
| 6 | **DONE 2026-11-24:** calibration against the reference (±2 image px on chrome, see `visual-fidelity.md`), **Edit columns** (TanStack `columnVisibilityFeature`), **Export** (CSV from a server route handler, formula-injection-safe — this also delivers Step 9), mobile navigation (popover menu under 1024 px), responsive fixes (a real bug: `sr-only` cells escaped the scroll container and made the mobile page scroll sideways), `error.tsx`, `not-found.tsx`, `SearchField` de-duplicated. 139 unit/integration + 27 E2E tests. **Not done:** reduced-motion verification, forced-colors, a11y audit (Step 8). **States & polish.** hover/focus/active/disabled/empty/loading/error; responsive; reduced motion. | 4, 5 | State checklist in `visual-fidelity.md` complete (verified). | ui-engineer |
| 7 | **DONE 2026-11-24:** headers + CSP in `next.config.ts` (SRI approach tried and **failed**, `unsafe-inline` for scripts adopted — see `security.md`), `pnpm audit` clean, dangerous-pattern grep clean, E2E for headers/CSP violations/hostile input. **Security hardening.** Headers + CSP in `next.config.ts`/proxy, `pnpm audit`, input-limit tests. | 5 | `quality/security.md` checklist verified on prod build. | security-reviewer |
| 8 | **DONE 2026-11-24 (automated only):** axe on 12 states = 0 violations after fixing 2 real defects; keyboard + reduced-motion checks automated; manual screen-reader testing **not done**. **Accessibility pass.** axe on key states, keyboard walk-through, screen-reader smoke. | 6 | Zero axe violations on tested states; manual checklist recorded. | a11y-auditor |
| 9 | **DONE early (Step 6)** — `domain/csv.ts` + `GET /payments/export`. **CSV export** (REQ-OPT-06). | 5 | Formula-injection tests pass; exports current view. | domain-data-engineer + ui-engineer |
| 10 | **DONE 2026-11-24 (CI not yet run on GitHub):** `.github/workflows/ci.yml` written, never executed remotely; visual baselines (macOS) for 4 states, skipped in CI; lab performance numbers in `performance.md` (not Lighthouse). **CI + visual regression + perf measurement.** GitHub Actions; Playwright screenshots; Lighthouse on `next start`. | 6–9 | CI green; perf table filled with measured numbers only. | test-engineer |
| 11 | **PARTIAL 2026-11-24:** payment details route built; column resize/reorder deliberately skipped. **Stretch (only if time):** payment details route (REQ-OPT-03). Column resize/reorder (REQ-OPT-05) last; likely skipped. | 10 | Per requirement. | ui-engineer |
| 12 | **Delivery.** Deploy, README, requirements audit, final reviews, submission email (REQ-DEL-*). | all | `requirements-auditor` report with every REQ-ID traced. | requirements-auditor |

## Recommended order rationale

Domain before UI because filter/sort/URL semantics are the main correctness risk and are pure functions. Shell before table so the table is judged in its real context for fidelity. CSV after filters because it reuses the same query function. Details page and resize/reorder last because they add the most complexity for the least score weight (PDF ranks them 3 and 5; reorder/resize may need an extra dependency).

## Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Deadline (Nov 20 2026) already passed. | Ask user (Q1). |
| R2 | Reference behaviors (hover, menus, filters) not observable from static frame. | Access Stripe test mode (Q9); otherwise document assumptions. |
| R3 | Installed versions (Next 16.4.6, React 19.3, TanStack Table 9.3, nuqs 2.10, Zod 4, Vitest 5, Tailwind 4.3) postdate common knowledge; APIs may differ. | Step 0 spike; use docs/Context7 before writing each integration; AGENTS.md says read Next docs first. |
| R4 | `cacheComponents` + `partialPrefetching` constrain use of `searchParams`/`Date.now()` in server components (dynamic data must be behind Suspense). | Spike in step 0; ADR-002 revisit. |
| R5 | Strict CSP vs Next inline scripts/nonces and cached shells. | Verify on prod build; document any relaxation explicitly. |
| R6 | ~~Stripe's proprietary font cannot be used.~~ **Resolved 2026-11-24:** the live dashboard uses the system font stack, so we use the same stack (no webfont). | — |
| R7 | Third-party brand logos (Visa/Mastercard/Discover/Apple Pay/Link) — licensing. | Simplified original glyphs; documented. |
| R8 | Greys used by Stripe for muted text may fail 4.5:1 contrast. | Measure; prefer AA-passing shade if visually imperceptible; document deviations. |
| R9 | Relative dates ("Today", "7 days") vs static mock data go stale. | Generate data relative to a build/server anchor date; ADR-006. |
| R10 | Scope creep from optional features. | Roadmap order above; optional items gated on required items verified. |
| R11 | Visual regression baselines are only self-referential (not the Stripe reference). | Manual overlay procedure in `visual-fidelity.md`; do not claim pixel parity. |

## Open questions and assumed defaults

| # | Question | Assumed default until answered |
|---|---|---|
| Q1 | Deadline passed; proceed / extension agreed? | **Answered 2026-11-24: proceed.** |
| Q2 | Reference columns vs written columns? | Reference look + extra Payment ID column (I-1). User asked to check live Stripe (done, see Q9); the live build differs from the reference, the reference still wins. |
| Q3 | Include reference-only extras (Canceled/Blocked, status tiles, Currency chip, banner)? | Yes, additive. |
| Q4 | Server-computed page slice with nuqs vs fully client-side TanStack Table? | Server-computed via URL (ADR-002), pending Step 0 spike. |
| Q5 | Headless primitives: Radix vs hand-built? | **Answered 2026-11-24: Radix approved** (ADR-004). |
| Q6 | Display timezone? | Fixed IANA zone `America/Sao_Paulo` (matches the assessor's timezone and avoids hydration mismatch). |
| Q7 | Commit reference PDF/screenshot? | **Not committed** (gitignored, per CLAUDE.md). |
| Q8 | Deploy target/repo visibility? | Vercel + public GitHub repo. |
| Q9 | Stripe test-mode access for hover states and measurements? | **Answered 2026-11-24: yes.** User opened a sandbox in a browser window controlled by this session. The live build is newer than the reference PNG; used for behavior and font only (see `visual-fidelity.md`). |
