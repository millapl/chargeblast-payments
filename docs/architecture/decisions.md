# Architecture decision records

Status legend: **Accepted** = implemented and verified as noted; **Revised** = changed during implementation (see the entry); **Rejected/Skipped** = deliberately not done. Last reviewed 2026-11-24. All ADRs below are Accepted unless the entry says otherwise. Each decision is justified by the challenge's actual scope. Context: 1 screen, ~500 synthetic rows, assessed on fidelity + correctness + code quality.

## ADR-001 Feature-based structure with a pure domain layer
- **Decision:** `features/payments/{domain,data,components}`, plus `layout/` and `shared/`.
- **Why:** CLAUDE.md requires feature-based architecture and separation of presentation/domain/data. The riskiest logic (filters, sort, URL, money) is testable only if framework-free.
- **Rejected:** Redux/feature-sliced-design full layering — overkill for one screen.

## ADR-002 URL as the single source of state; server-computed page slice (Q4; Step 0 docs review done, code spike deferred to Step 4)
- **Step 0 findings (from installed Next 16.4.6 docs and nuqs docs, not yet exercised in code):**
  - With `cacheComponents`, `searchParams` is request-time data: read it inside a focused `<Suspense>` boundary so the heading/toolbar/skeleton stay in the static shell (`01-app/02-guides/optimizing-the-static-shell.md`). Client components can use `useSearchParams()` synchronously.
  - nuqs provides `createLoader` + typed parsers (`parseAsStringLiteral`, `parseAsArrayOf`, `parseAsInteger`) from `nuqs/server` that return defaults for invalid values; client updates default to `shallow: true`, so filter changes must use `shallow: false` to re-run the server component.
  - **Revision:** the nuqs parsers become the single URL schema, shared by the server loader and client hooks. Zod is kept for dataset validation and cross-field rules (e.g. `min ≤ max`) applied after parsing, rather than duplicating a second URL parser.
- **Decision:** Parse `searchParams` via the nuqs loader in the page Server Component, run `queryPayments`, render ≤100 rows; client islands mutate the URL via `nuqs` with `shallow: false`.
- **Why:** Satisfies REQ-OPT-04 (shareable links) with no extra state library; keeps JS small; PDF allows either client- or server-side pagination (REQ-PAGE-02).
- **Risk:** `cacheComponents` + dynamic searchParams (R4). **Fallback:** client-side table over the in-memory dataset with the same pure functions and nuqs for URL sync.
- **Rejected:** Zustand/Redux store (duplicates URL state); fetching from a mock API route (adds network layer, no benefit).

## ADR-003 TanStack Table as column/row model, manual modes
- **Decision:** Use `@tanstack/react-table` (already installed, named in CLAUDE.md) for column definitions and header state with `manualSorting/manualPagination`; the pure `queryPayments` does the work.
- **Why:** Consistent column config, accessible header wiring, future resize/reorder (REQ-OPT-05) support.
- **Step 0 findings (Context7, TanStack v9 migration docs):** v9 uses `useTable({ features, columns, data })` with an explicit `tableFeatures({...})` object (define it outside the component for a stable reference), `createColumnHelper<typeof features, Payment>()` takes the features type, and row models/fns live on the features object. `useReactTable`/`useLegacyTable` are v8-style/deprecated paths — do not use them. Exact manual-mode option names must be confirmed against installed typings when implementing.
- **Tension to resolve in Step 4 with measured JS:** with a server-computed slice, `useTable` forces the table into a Client Component (≤100 rows serialized). A server-rendered `<table>` with sort links would ship less JS. TanStack earns its place mainly for column visibility ("Edit columns" in the reference) and optional resize/reorder (REQ-OPT-05). CLAUDE.md lists TanStack Table in the stack, so default is to use it; if the build output shows a meaningful cost without matching benefit, revert to a plain table and record the measurement here.
- **Implemented (Step 4):** `PaymentsTable` is a client component using `useTable({ features: tableFeatures({ rowSelectionFeature }), columns, data, getRowId })`; sorting/pagination are NOT TanStack features — they are URL-driven (`manualSorting`-equivalent: header buttons call nuqs, the server recomputes the slice). TanStack provides the typed column model, `FlexRender` and row selection. `ColumnMeta` is augmented (`table-meta.ts`) with `className`/`headerClassName`. JS cost of TanStack alone not yet isolated (see `quality/performance.md`).
- **Revisit:** if the v9 API adds more ceremony than value, render a plain typed `<table>` and record that here.

## ADR-013 Filters: draft state + Apply, URL as the committed state (Step 5)
- Each chip opens a Radix Popover with a local draft and an Apply button (Stripe's own pattern, observed in the live sandbox); Apply writes the URL with `page=1`. Invalid input (non-numeric amount, reversed amount/date range) is rejected in the UI with an `role="alert"` message; the domain additionally treats reversed bounds as unbounded so hand-edited URLs never break.
- The top-bar search is rendered inside its own `<Suspense>` + `<NuqsAdapter>` so the static shell stays prerendered (a layout-level adapter would force a client-side bailout for the whole shell). `SearchBox` debounces 300 ms and uses a `lastPushed` ref so server round-trips cannot overwrite what the user is still typing.
- Known duplication: `SearchBoxFallback` repeats the input markup of `SearchBox`; extract a shared presentational field in Step 6.

## ADR-014 CSV export via a route handler; column visibility via TanStack (Step 6)
- **Export** is a plain link to `GET /payments/export?<same query>` handled by the same Zod/nuqs parser, `filterPayments` and `sortPayments` as the page, so it exports every matching row (not only the visible page) without shipping the dataset to the client. Response headers: `text/csv; charset=utf-8`, `Content-Disposition: attachment`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. Cells that start with `=`, `+`, `-`, `@`, tab or CR are prefixed with `'`; fields containing `, " CR LF` are RFC 4180-quoted. Amounts are formatted with integer arithmetic. Dates are ISO UTC (not the display zone) so the file is unambiguous.
- **Edit columns** uses `columnVisibilityFeature`; state is local to the page (not persisted, not in the URL).
- **Mobile navigation** reuses `SidebarNav` inside a Radix Popover under 1024 px (no extra dependency).

## ADR-004 Headless primitives (Popover, Tooltip, Checkbox) — NEEDS APPROVAL
- **Options:** (a) add Radix primitives (`@radix-ui/react-popover`, `-tooltip`, `-checkbox`) — mature a11y (focus management, Esc, collision handling); (b) native Popover API / `<dialog>` + hand-built tooltip — zero deps, more a11y work and risk.
- **Recommendation:** (a), unstyled (no component-library aesthetic), because filter popovers/tooltips are core and WCAG 1.4.13/2.4.3 are easy to get subtly wrong. CLAUDE.md: "additional dependencies require clear justification" → this is it.
- **Status:** APPROVED by user 2026-11-24 (Radix Popover, Tooltip, Checkbox, unstyled). Not yet installed; install at Step 4 and record exact versions here.

## ADR-005 Tailwind v4 + CSS-variable tokens, no component library
- **Why:** Stack mandated; bespoke Stripe anatomy; library aesthetics explicitly discouraged. Tokens in `globals.css` give one place to correct measurements.

## ADR-006 Seeded in-memory dataset
- **Decision:** `@faker-js/faker` seeded; generated at module init relative to an anchor date; Zod-validated. Faker is a devDependency today, so runtime use requires moving it to `dependencies`. It is large; since the data module is only imported by Server Components it should stay out of the client bundle — **to verify in Step 0** by inspecting the build output. If it leaks or is too heavy, switch to a small hand-written seeded PRNG (e.g. mulberry32) with curated name/domain lists, keeping faker for tests only.
- **Why:** Deterministic, reviewable, satisfies REQ-DATA-*.
- **Verified (Step 4):** after wiring the data module into the page, a substring search of all 9 client chunks served for `/payments` found no `faker` string, so the dataset is generated server-side only.
- **Implemented (Step 2):** a local `Faker` instance (`new Faker({ locale: [en] })`, no global state, only the English locale) seeded with `20261124`; 500 rows; window anchored to the current UTC hour and cached per hour in `data/repository.ts`. `@faker-js/faker` is still listed under `devDependencies` and **must move to `dependencies`** when the data module is imported by a route (Step 4). Client-bundle leakage not yet measured.

## ADR-007 Cross-currency amount semantics
- **Decision:** Sort and range-filter amounts by nominal major-unit value, no FX conversion; documented in UI helper text and tests. See `data-model.md`.
- **Why:** No FX source in scope; inventing rates would be fabricated data. CLAUDE.md requires documenting these semantics.

## ADR-008 Fixed display timezone
- **Decision:** `America/Sao_Paulo` for all absolute dates and day-boundary logic (assumed, Q6).
- **Why:** Avoids server/client hydration mismatch; deterministic tests; reviewers are in Brasília time.

## ADR-009 Security posture: static headers + CSP, no auth/backend
- **Step 0 finding (installed Next docs, `01-app/02-guides/content-security-policy.md`):** nonce-based CSP requires fully dynamic rendering and is **incompatible with Partial Prerendering / the static shell** that `cacheComponents` provides. Documented alternatives: (a) experimental SRI (`experimental.sri`) with `script-src 'self'`, keeps static generation; (b) CSP without nonces via `headers()` in `next.config.ts` using `'unsafe-inline'` for scripts/styles (weak); (c) nonce + proxy and drop the static shell.
- **Decision (final, 2026-11-24):** (a) was tried and failed (inline scripts blocked); (c) rejected (loses the static shell); **(b) adopted** — `script-src 'self' 'unsafe-inline'` with every other directive strict. Full results and residual risk in `quality/security.md`. Static headers (HSTS, nosniff, Referrer-Policy, Permissions-Policy, `frame-ancestors 'none'`) go in `headers()` regardless. Verified only on a production build. See `quality/security.md`.
- **Why:** CLAUDE.md demands headers + compatible CSP; scope has no sessions or secrets.

## ADR-010 (Revised 2026-11-24) Real brand marks instead of redrawn glyphs
- **Original decision (superseded):** draw simple generic glyphs to avoid using trademarked logos.
- **Revised decision (user request, 2026-11-24):** use the **real marks** for Visa, Mastercard, American Express, Discover, Apple Pay and Google Pay, matching the reference (the PDF says to copy icons and assets as they appear in the reference). Glyph outlines are the SVG paths of the open-source **simple-icons** package v16.38.1 (CC0-1.0), fetched from jsDelivr on 2026-11-24, inspected as text (only `<path>` data, no scripts or external references) and embedded as inline SVG in `components/brand-paths.ts` — no new runtime dependency, no network request at runtime. Tiles (20 × 18 CSS px, rounded 4 px) are composed to match the reference: Visa `#23569a` with the white wordmark, Mastercard black with the red/orange/overlap circles, Apple black with the white apple, Google Pay and Discover white with a hairline border.
- **Not the vendor files:** the Stripe-specific tile artwork was not copied from Stripe; tiles are our composition around the brands' public marks. **Link** (Stripe's wallet) is not in simple-icons, so its green tile and chevron are redrawn from the reference screenshot and are an approximation, not the official asset.
- **Update (2026-11-24, user request): icons taken from the Stripe Dashboard itself.** With the user's test-mode sandbox open, the inline SVGs of the Dashboard's own icon set were read from the DOM (read-only, via the browser) and copied into `src/shared/ui/stripe-icon-data.ts`: Home, Balances, Transactions, Customers, Product catalog, Pin (Payments analytics), Connect, Payments, Billing, Reporting, More, Developers, Help, Bell, Settings, Create (+), the small chevron, and the Visa wordmark of Stripe's card tile (placed on the reference's `#23569a` instead of the live build's `#1434CB`, because the screenshot is the review target). Each SVG was assembled from the console output, parsed as XML and checked for scripts/external references, then rendered next to the originals. The sandbox only contains a Visa payment, so Mastercard/Amex/Discover/Apple Pay/Google Pay still come from simple-icons; the Reports/Sigma/Radar clock icons are not in the live sidebar and remain lucide; the three third-party app icons in the top-bar pill are not installed in this account and remain hand-traced. These are Stripe's assets, used because the challenge text says to copy icons and assets as they appear; replace them before any use beyond this assessment.
- **Legal note:** the marks remain trademarks of their owners; they are shown only to identify payment-method types in a non-commercial demo recreation. Replace them before any commercial use.

## ADR-011 Testing stack as installed
- Vitest + RTL (jsdom) for unit/integration, Playwright (+ axe) for E2E/a11y/visual. No Storybook, no MSW (no network).

## ADR-012 Optional features (Revised): URL state, CSV and the details route were built; resize/reorder skipped
- **Why:** URL state and CSV were cheap given ADR-002 and `queryPayments`. **Outcome (2026-11-24):** the details route was also built (synthetic timeline); column resize/drag-reorder was skipped as the highest complexity for the least weight in the PDF ranking; "Edit columns" visibility toggling exists instead.

## ADR-015 Sorting semantics: single-column UI, alphabetical status order
- **Status order:** statuses sort **alphabetically by display label** (Blocked, Canceled, Disputed, Failed, Pending, Refunded, Succeeded, Uncaptured). A "severity" order was rejected because it would need a product opinion that the challenge does not give; alphabetical is predictable and testable.
- **UI mode (REQ-SORT-04):** single-column. Clicking another header sorts by it in its natural first direction (date/amount descending, status ascending); clicking the primary header flips direction; secondary keys are dropped from the UI. The URL and `sortPayments` accept up to 3 keys (`?sort=status:asc,date:desc`) so shared links and future UI can use multi-sort; every sort ends with a stable tie-break on `id`.
- **Amount across currencies:** nominal value, see ADR-007.
