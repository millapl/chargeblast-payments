# Stripe Payments screen — Chargeblast front-end challenge

A recreation of the Stripe Dashboard **Transactions → Payments** screen, built for the Chargeblast front-end engineering challenge. All data is synthetic; nothing here talks to Stripe.

- **Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 · TanStack Table 9 · nuqs · Zod 4 · Radix UI primitives · Vitest · Playwright · pnpm
- **Live URL:** _not deployed yet_ (see [Deploying](#deploying))

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3000  (redirects to /payments)

pnpm build && pnpm start   # production build
```

| Script | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test` | Vitest unit + integration tests (jsdom, Testing Library) |
| `pnpm e2e` | Playwright against a production build on port 3100 (`pnpm exec playwright install chromium` once) |
| `pnpm e2e --grep-invert @visual` | Everything except platform-specific screenshot tests (what CI runs) |
| `node scripts/measure-performance.mjs` | Lab measurement of a running production build |

## What is implemented

**Required (official challenge)**

- Payments table: Payment ID (shortened, copy to clipboard), Customer, Amount with currency, Status badge, Payment method (brand + last 4), Date with relative time in a tooltip (hover and keyboard focus)
- Sorting on date, amount and status · pagination with 25 / 50 / 100 rows
- Filters: date range (Today, 7 days, 30 days, Custom), status and payment method (multi-select), amount range, text search by payment ID, email or last 4 digits
- 500 deterministic synthetic payments in 5 currencies (including zero-decimal JPY) and a realistic status mix

**Optional extras built:** sidebar and top bar · payment details page (`/payments/[id]`) with timeline and metadata · every filter/sort/page in the URL, so any view is a shareable link · CSV export of the current view

**Reference-fidelity extras:** status tiles, Currency filter, "Edit columns", row selection, the announcement banner, Disputed/Uncaptured/Canceled/Blocked statuses

**Not built:** column resize / drag-to-reorder, saved filters, real navigation for the other sidebar entries (they are inert), account menu

## Design decisions worth knowing

- **URL is the single source of truth** for filters, sort, page and page size. The page is a Server Component that parses `searchParams` (nuqs parsers; invalid input falls back to defaults, it never throws), filters/sorts/paginates in a pure function and sends at most 100 rows to the client. Header clicks and filters update the URL with `shallow: false`.
- **Money is integer minor units** formatted with `Intl`. Amount sorting and the amount filter compare **nominal** values across currencies (no FX conversion — there is no rate source in scope). The UI says so.
- **Time:** timestamps are UTC ISO strings, displayed in a fixed zone (`America/Sao_Paulo`) so server and client agree; "now" is injected for tests.
- **Synthetic data is seeded** (`@faker-js/faker`, server-only, not in the client bundle) and generated relative to the current hour, so the date presets always have rows while ids and relative ages stay stable.
- **Brand marks:** Visa, Mastercard, American Express, Discover, Apple Pay and Google Pay use the real marks (SVG paths from the CC0 `simple-icons` package, v16.38.1, inlined — no runtime dependency). The marks remain trademarks of their owners and are shown only to identify payment-method types in this demo. Stripe **Link** is not in that package; its tile is redrawn from the reference and is an approximation. Customer names/emails are generated on reserved example domains; nothing from the reference screenshot's real-looking data was copied.
- Full list of decisions and rejected alternatives: [`docs/architecture/decisions.md`](docs/architecture/decisions.md).

## Quality

| Area | What exists | Where |
|---|---|---|
| Unit / integration | 148 tests: money, dates, query, URL state, CSV, timeline, generator, components | `src/**/*.test.ts(x)` |
| End to end | 58 tests: table, sort, pagination, every filter, search, export, details page, mobile, 404 | `tests/e2e` |
| Accessibility | axe (WCAG 2.2 AA tags) on 12 states, keyboard and reduced-motion checks | `tests/e2e/accessibility.spec.ts` |
| Security | headers + CSP, hostile-input and CSV tests, `pnpm audit` | `tests/e2e/security.spec.ts`, [`docs/quality/security.md`](docs/quality/security.md) |
| Visual regression | Screenshot baselines of **this app's** layout (macOS; skipped in CI) | `tests/e2e/visual.spec.ts` |
| CI | lint, types, tests, audit, build, E2E | `.github/workflows/ci.yml` |

What the numbers do **not** prove: automated axe checks cover only part of WCAG, so no "WCAG AA compliant" claim is made; the visual tests guard against regressions and are not a comparison with Stripe; performance numbers are a local lab run, not Lighthouse. Details, results and caveats are in [`docs/quality/`](docs/quality/).

## Security assumptions and limitations

Public, unauthenticated, read-only demo over fake data: no auth, no database, no secrets, no rate limiting (there is nothing to protect). The CSP allows `'unsafe-inline'` for scripts because Next.js streams inline scripts whose content changes per request; every other directive is strict, and the reasoning (including what was tried and failed) is in [`docs/quality/security.md`](docs/quality/security.md).

## Fidelity to the reference

The reference is a single static screenshot. Chrome (layout, sizes, spacing, colors) was measured from it and compared at the same scale: chrome edges and text positions agree within about 3 px (image pixels at 1.42×; worst case ≈ 7 px on the Create payment button) (see the table in [`docs/quality/visual-fidelity.md`](docs/quality/visual-fidelity.md)). Hover/focus/open states are not visible in the reference and were designed, using a live Stripe test-mode dashboard only for behavior hints. "Pixel-perfect" is not claimed.

## Project layout

```
src/
  app/(dashboard)/payments/   page, [id] details, export route handler, error boundary
  features/payments/
    domain/                   pure logic: types, Zod schema, money, dates, query, URL state, CSV, timeline
    data/                     seeded generator + in-memory repository
    components/               table, cells, filters, tiles, pagination
  layout/                     sidebar, top bar, header, tabs, banner
  shared/                     Button, Popover, Tooltip, Checkbox, cn
  proxy.ts                    real 404 for malformed payment ids
docs/                         requirements, plan, architecture, quality reports
tests/e2e/                    Playwright specs
```

## Deploying

The app needs no environment variables or services; any host that runs Next.js 16 works.

```bash
# Vercel
npx vercel --prod
```

After deploying, re-run the E2E suite against the public URL by changing `baseURL` in `playwright.config.ts` (or setting up a second config) and add the URL at the top of this file.
