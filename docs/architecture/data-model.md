# Data model

Status: **proposed, not implemented.**

## Entities

```ts
type Currency = 'USD' | 'EUR' | 'GBP' | 'BRL' | 'JPY';          // JPY = zero-decimal (assumed set)
type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'refunded'   // official (REQ-COL-05)
                   | 'canceled' | 'blocked' | 'disputed' | 'uncaptured'; // reference extras (REC-DATA-01)
type MethodType = 'card' | 'ach' | 'wallet';
type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover';
type Wallet = 'apple_pay' | 'google_pay' | 'link';

interface Payment {
  id: string;               // 'pi_' + 24 alphanumerics, deterministic from seed
  amountMinor: number;      // integer, > 0, minor units of `currency`
  currency: Currency;
  status: PaymentStatus;
  customerEmail: string;    // synthetic, reserved domain (example.com/.org/.net)
  customerName: string;
  description: string;      // e.g. 'Subscription update'
  method: { type: 'card'; brand: CardBrand; last4: string }
        | { type: 'wallet'; wallet: Wallet; brand: CardBrand; last4: string }
        | { type: 'ach'; bankName: string; last4: string };
  createdAt: string;        // ISO 8601 UTC, e.g. '2026-11-23T14:03:00.000Z'
  refundedAt: string | null;   // non-null iff status === 'refunded'
  declineReason: string | null;// non-null iff status in {'failed','blocked'}
}
```

Field naming follows the reference column labels (Amount, Payment method, Description, Customer, Date, Refunded date, Decline reason) plus an added Payment ID (see requirements I-1). `canceled`/`blocked` are additive; if Q3 is answered "no" they are dropped from the union.

## Zod schemas (`domain/schemas.ts`)

- `paymentSchema` mirrors the interface; uses `z.discriminatedUnion('type', …)` for `method`; `.refine` enforces the cross-field invariants above (`refundedAt` ⇔ refunded, `declineReason` ⇔ failed/blocked, `amountMinor` safe integer).
- `paymentsQuerySchema` for URL state (below).
- The dataset is validated once (test + build-time module init in dev); invalid data fails fast.

## Money

- Stored as integer minor units; **no floating-point arithmetic on money**.
- Exponent per currency from an explicit ISO 4217 table in `domain/money.ts` (USD/EUR/GBP/BRL 2, JPY 0). Revised from "read it from `Intl`": a typed table is explicit and cannot return `undefined`.
- `formatMoney({amountMinor, currency})` → `Intl.NumberFormat` output (`$9.88`, `R$ 99,99`/locale-dependent). Locale fixed to `en-US` to match the reference (`R$ 99.99` in the reference appears with a period; verify the formatter output and adjust options if it differs — flagged for visual check).
- Currency code displayed separately (reference: `$9.88 USD`).
- Amount filter input parsed from decimal string to minor units with a strict regex (`^\d{1,9}(\.\d{1,2})?$`), no `parseFloat` on money.

### Cross-currency semantics (ADR-007, assumed)

Amounts in different currencies are not comparable without FX rates, and no rates exist in scope. Decision:

- **Sorting by amount** compares numeric *major-unit* value regardless of currency (documented as "nominal value, not FX-converted"), ties broken by `id`. Alternative (group by currency) rejected as surprising for a flat table.
- **Amount range filter** applies to nominal major-unit value; when a Currency filter has exactly one currency selected the range is unambiguous. UI helper text states "Nominal amount, no currency conversion" — to be reviewed against fidelity.

## Dates

- Stored UTC. Day boundaries (Today / 7 days / 30 days / Custom from–to) computed in `America/Sao_Paulo` (assumed, Q6) via `Intl`-based helpers; no hand-rolled offset math, no `moment`/`date-fns` unless a spike shows `Intl` insufficient.
- `Today` = [00:00, now]. `7 days` / `30 days` = trailing N×24h from now (Stripe presets are trailing). Custom = inclusive start-of-day(from) to end-of-day(to).
- Edge cases to test: DST (Brazil has none since 2019 — still test the helper for zones that do), midnight boundary, from>to.

## Synthetic data generation

- `@faker-js/faker` seeded with a constant (`faker.seed(20261124)`), ~500 rows, generated at module init (in-memory) — deterministic across server restarts and tests. A committed JSON snapshot is an alternative; generation at init is chosen to avoid a large static file and keep the generator reviewable (ADR-006).
- Anchor date: **implemented** as the start of the current UTC hour (`data/repository.ts`). Row ages are seeded (spread over 45 days, skewed to recent via `u^1.8`) so ids and relative ages never change; the whole window slides forward hourly and presets always find data. `generatePayments({ anchor })` is pure and tests inject a fixed anchor.
- Status mix (target, tunable): succeeded ~72%, failed ~12%, pending ~6%, refunded ~5%, canceled ~3%, blocked ~2%.
- Amount distributions per currency (minor units; implemented in `data/generate.ts`): e.g. USD 399–49,999, EUR 500–45,000, GBP 399–40,000, BRL 990–199,999, JPY 500–80,000 (¥), with common price points (`999`, `1998`, `1999`) weighted to resemble the reference subscription amounts.
- Method mix: card ~75% (visa-heavy), wallet ~15%, ACH ~10%; `last4` 4 random digits.
- Identity: emails `first.last@example.com|org|net` (reserved domains → no real person); names from faker. **No value copied from the reference screenshot.**
- Uniqueness: ids unique (asserted in test). Stable ids by seed order.
- Declines: `declineReason` from a short list (e.g. "Insufficient funds", "Do not honor", "Transaction not allowed"); only for failed/blocked.

## Query model (URL state)

```ts
interface PaymentsQuery {
  status: PaymentStatus[];          // ?status=succeeded,failed   (allowlist, max 6)
  method: MethodType[];             // ?method=card,wallet
  currency: Currency[];             // ?currency=usd,brl          (reference chip)
  range: 'all' | 'today' | '7d' | '30d' | 'custom';  // ?range=7d
  from?: string; to?: string;       // ?from=2026-11-01&to=2026-11-20  (YYYY-MM-DD, custom only)
  min?: string; max?: string;       // decimal major units, ≤ 9 digits
  q: string;                        // trimmed, ≤ 64 chars
  sort: { key: 'date'|'amount'|'status'|…; dir: 'asc'|'desc' }[]; // ?sort=date:desc  (max 3 keys, allowlist)
  page: number;                     // int ≥ 1, clamped to last page
  size: 25 | 50 | 100;              // default 25
}
```

Implementation note (ADR-002): the URL schema is expressed once as nuqs parsers (`createLoader` on the server, same parser map in client hooks); Zod handles dataset validation and post-parse cross-field rules.

Parsing rules: every field optional with defaults; repeated/oversized/invalid values are **dropped to defaults, never thrown**; unknown keys ignored; canonical re-serialization omits defaults for clean shareable URLs. `queryPayments` pipeline order: filter (status, method, currency, date, amount) → search → sort (stable, tie-break `id`) → paginate; returns `{ items, total, page, pageCount }`. Any filter/sort/size change resets `page` to 1.

Search: `q` matches (a) `id` substring case-insensitive, (b) `customerEmail` substring case-insensitive, (c) `last4` when `q` is exactly 4 digits. Implemented with `String.prototype.includes` on lowercased strings — never `new RegExp(q)`.

## Open data-model questions

Whether `Pending` ever appears in the reference (no); whether `Currency` filter is in scope (extra); whether `Description`/`Refunded date`/`Decline reason` columns are rendered by default (reference: yes) — all tied to Q2/Q3.
