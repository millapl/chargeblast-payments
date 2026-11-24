# Architecture overview

Status: **proposed, not implemented.** Assumptions needing confirmation are tagged `(assumed)` and tracked in `docs/implementation-plan.md` (Q1–Q9).

## Scope-driven design

One screen, ~500 in-memory synthetic rows, no auth, no database, no payments integration. The architecture is deliberately small: a pure domain core, a thin in-memory data module, and a handful of UI components. Nothing is added "for scale" unless the scale is the challenge itself (correct filter/sort/URL semantics and visual fidelity).

## Layers

```
URL (search params)  ──parse (Zod)──▶  PaymentsQuery  ──queryPayments(rows, query)──▶  { rows[], total, page }
                                                                   ▲
                                                 in-memory dataset (seeded, Zod-validated)
UI (server components render shell + table; client islands for filters, copy, tooltip, menus)
```

| Layer | Responsibility | May depend on |
|---|---|---|
| `domain` | Types, Zod schemas, money/date formatting helpers, `queryPayments` (filter → search → sort → paginate), URL-state parse/serialize, CSV serializer | nothing React/Next |
| `data` | Seeded generator and repository exposing `getAllPayments()` / `getPaymentById()` | `domain` |
| `components` | Presentation; receive typed props; no business rules | `domain` types, `shared` |
| `app` | Routing, composition, search-param parsing, metadata, headers | all of the above |

## Directory layout (proposed)

```
src/
  app/
    layout.tsx, globals.css, not-found.tsx, error.tsx
    page.tsx                    # redirect/compose → /payments
    payments/page.tsx           # parses searchParams → queryPayments → renders
    payments/[id]/page.tsx      # optional (REQ-OPT-03)
  features/payments/
    domain/    types.ts schemas.ts money.ts dates.ts query.ts search.ts url-state.ts csv.ts
    data/      generate.ts repository.ts
    components/ PaymentsTable.tsx columns.tsx StatusBadge.tsx PaymentMethodCell.tsx
               CopyIdButton.tsx RelativeTime.tsx StatusTiles.tsx FilterBar.tsx
               filters/(DateFilter|AmountFilter|StatusFilter|MethodFilter|CurrencyFilter).tsx
               Pagination.tsx ExportButton.tsx EmptyState.tsx
  layout/    Sidebar.tsx Topbar.tsx PageHeader.tsx Tabs.tsx Banner.tsx
  shared/    ui/(Button|Popover|Tooltip|Checkbox).tsx  lib/(cn.ts)
tests/e2e/   *.spec.ts
```

Colocate unit tests (`*.test.ts[x]`) next to sources. No barrel files (avoid cycles and bundle bloat). Path alias `@/*` already configured.

## Rendering model (assumed — ADR-002)

- The Payments page is a Server Component. It parses `searchParams` with Zod, calls `queryPayments`, and renders at most 100 rows, so the client never receives the whole dataset.
- Interactive pieces (filters, copy button, tooltip, row menus, banner dismiss) are small Client Components. They update the URL through `nuqs`; navigation re-renders the server slice.
- TanStack Table is used as the column/row model with `manualSorting`/`manualPagination`/`manualFiltering` (server-computed by `queryPayments`) *only if* the spike (Step 0) shows it earns its place; otherwise a plain typed `<table>` is simpler. CLAUDE.md lists TanStack Table in the stack, so default is to use it for column definitions and header sort state.
- Fallback if `cacheComponents` makes dynamic `searchParams` awkward: client-side table over a ≤1,000-row dataset, which the PDF explicitly permits (REQ-PAGE-02).

## Timezone and time

Timestamps stored as UTC ISO strings. Rendered with `Intl.DateTimeFormat` in a fixed IANA zone `America/Sao_Paulo` (assumed, Q6) so server and client output match. "Now" for presets and relative time is injectable (`clock` parameter) for deterministic tests.

## Styling

Tailwind CSS v4 with design tokens as CSS variables in `globals.css` (measured from the reference). No component library; Stripe-specific anatomy is bespoke. Icons: `lucide-react` where shapes match; custom inline SVG for brand/status glyphs.

## Error and empty states

`error.tsx`, `not-found.tsx`, and an in-table empty state for zero results with a "clear filters" action.

## Non-goals

Auth, persistence, real Stripe API, i18n beyond `Intl`, saved filters (REQ-OPT-04 second half), real-time updates.
