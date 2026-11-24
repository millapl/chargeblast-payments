# Requirements

Source of truth: official challenge PDF (`docs/references/challenge.pdf`, 4 pages) and its reference screenshot (`docs/references/reference-payments-screen.png`). The PDF text was extracted programmatically; pages 3–4 contain images only. Page 4 is a single low-resolution frame of a walkthrough animation; the animation itself (filters, account menu, payment details page) could not be extracted and has **not** been seen.

Legend:

- **OFFICIAL** — stated in the PDF. IDs `REQ-*`.
- **RECOMMENDED** — our engineering additions (from `CLAUDE.md` or this plan). IDs `REC-*`. Never mistaken for assessment requirements.
- Verification methods: **UT** unit test, **IT** integration (RTL) test, **E2E** Playwright, **A11Y** axe/manual, **VIS** side-by-side visual review, **MAN** manual check, **REV** document/review check.
- The tables in §1 describe the **planned** acceptance criteria and verification methods (written before implementation). The implementation status as of 2026-11-24 is in **§0 below**; the per-row "Build"/"Plan" cells in §1.7 were updated when features were built.

## 0. Status summary (2026-11-24)

"Verified" = code read **and** a test whose assertions exercise the criterion (unit `src/**/*.test.ts(x)` or E2E `tests/e2e/*.spec.ts`), confirmed by an independent read-only audit plus the final test runs recorded in `docs/quality/testing.md` (145+ unit/integration, 58 E2E, 4 visual). Gaps the audit raised are listed.

| IDs | Status | Notes / known gaps |
|---|---|---|
| REQ-COL-01, 02, 04, 05, 06, 08 | Verified | COL-05: only succeeded/failed tones are asserted distinct; all 8 statuses are asserted to render text + icon |
| REQ-COL-03 | Implemented, weakly tested | Customer email is truncated visually (`truncate`) with the full text in the DOM; no hover title |
| REQ-COL-07 | Implemented | Fixed display zone, covered by date unit tests; no dedicated hydration-mismatch test (E2E loads show no console errors) |
| REQ-SORT-01, 02 | Verified | Date sort both directions now asserted in E2E |
| REQ-SORT-03 | Verified | Status order is **alphabetical by display label** (documented in ADR-015) |
| REQ-SORT-04 | Verified | UI is single-column (ADR-015); URL/domain accept up to 3 keys |
| REQ-PAGE-01, 03 | Verified | E2E now asserts the selector offers exactly 25/50/100 and that a filter change resets to page 1 |
| REQ-PAGE-02 | Verified | Server-computed slice (ADR-002) |
| REQ-FLT-01…06 | Verified | FLT-03 E2E asserts ACH only; all three types are unit-tested |
| REQ-DATA-01…05 | Verified | DATA-03 asserts positivity and per-currency ranges by construction, not statistical plausibility |
| REQ-SCOPE-01, REQ-LOOK-01/02, REQ-REV-01/02/04 | **Partial** | Visual fidelity measured against the single static PNG (±2 image px on chrome); hover/open states not comparable; brand glyphs replaced on purpose (ADR-010). "Pixel-perfect" is not claimed |
| REQ-REV-03, 05 | Verified | Feature suite green; lint + `tsc --noEmit` exit 0 |
| REQ-REV-06 | Partial | Self-review done via the measurements and two read-only subagent audits; not a substitute for a human look at the deployed site |
| REQ-TECH-01, 02 | Verified | Next.js App Router + TypeScript strict; Tailwind 4 |
| REQ-OPT-01, 02 | Built | Sidebar (inert entries except Transactions), top bar with search, and an **account menu** (sidebar header popover; actions are inert and labelled as demo) |
| REQ-OPT-03, 04, 06 | Verified | Details page (synthetic timeline), URL state, CSV export |
| REQ-OPT-05 | Built | Reorder + resize (mouse and keyboard); not persisted |
| REQ-DEL-01…06 | **Not done** | Deploy, GitHub link, reply email — need the user's accounts; the PDF deadline (Nov 20, 2026) has passed |

## 1. Official requirements

### 1.1 Scope

| ID | Requirement | Acceptance criteria | Verification |
|---|---|---|---|
| REQ-SCOPE-01 | Rebuild the Stripe Dashboard Payments screen (Transactions → Payments) as close to pixel-perfect as possible. Only the payments table is required. | A single route renders the Payments screen; the payments table is complete and functional. | VIS, E2E |
| REQ-SCOPE-02 | Everything under "Nice-to-haves" is optional. | Optional items are tracked separately (§1.7) and never block required items. | REV |

### 1.2 Table columns

| ID | Requirement | Acceptance criteria | Verification |
|---|---|---|---|
| REQ-COL-01 | Payment ID column, shortened. | Full ID is never shown in-cell; a deterministic shortening (e.g. `pi_3Q…x9Kd`) is used; full ID available via copy and accessible name. | UT (shorten fn), IT |
| REQ-COL-02 | Payment ID has copy to clipboard. | Activating the control (mouse or keyboard) writes the full ID to the clipboard; user gets visible + screen-reader confirmation; permission denial handled without crash. | IT (mocked clipboard), E2E |
| REQ-COL-03 | Customer column. | Shows customer identifier (email; name optionally) from synthetic data; long values truncate with accessible full text. | IT, VIS |
| REQ-COL-04 | Amount formatted with its currency. | Amounts rendered via `Intl.NumberFormat` from integer minor units; zero-decimal currencies (JPY) correct; currency code visible as in reference. | UT, VIS |
| REQ-COL-05 | Status badge: Succeeded, Pending, Failed, Refunded. | All four render with distinct text label + icon (not color alone); styling matches reference badge anatomy. | IT, A11Y, VIS |
| REQ-COL-06 | Payment method: card brand and last 4 digits. | Brand glyph + `•••• NNNN` shown; non-card methods (ACH/wallet) show a sensible equivalent without inventing digits. | IT, VIS |
| REQ-COL-07 | Created: date and time. | Absolute date+time in the documented fixed timezone, no hydration mismatch. | UT, E2E |
| REQ-COL-08 | Created shows relative time in a tooltip on hover. | Hover **and** keyboard focus reveal relative time ("3 hours ago") computed with `Intl.RelativeTimeFormat`; dismissible with Esc. | IT, A11Y |

### 1.3 Sorting

| ID | Requirement | Acceptance criteria | Verification |
|---|---|---|---|
| REQ-SORT-01 | Sort by date. | Asc/desc toggle; stable tie-break; reflected in `aria-sort`. | UT, E2E |
| REQ-SORT-02 | Sort by amount. | Semantics across currencies documented (see ADR-007) and tested. | UT, E2E |
| REQ-SORT-03 | Sort by status. | Deterministic status order documented. | UT, E2E |
| REQ-SORT-04 | Single- or multi-column sorting acceptable. | Chosen mode documented in ADR; behavior consistent and discoverable. | REV, E2E |

### 1.4 Pagination

| ID | Requirement | Acceptance criteria | Verification |
|---|---|---|---|
| REQ-PAGE-01 | Page sizes 25, 50 or 100 rows. | Selector offers exactly 25/50/100; invalid sizes from URL fall back to default. | UT, E2E |
| REQ-PAGE-02 | Client-side pagination is acceptable. | Any implementation (client or server-computed from in-memory data) is acceptable; chosen approach in ADR-002. | REV |
| REQ-PAGE-03 (derived) | Pagination must work with filters. | Page resets to 1 on filter change; out-of-range page clamps; empty result shows empty state. | UT, E2E |

### 1.5 Filters

| ID | Requirement | Acceptance criteria | Verification |
|---|---|---|---|
| REQ-FLT-01 | Date range with presets Today, 7 days, 30 days, Custom. | Each preset filters correctly at day boundaries in the documented timezone; Custom accepts from/to with validation (from ≤ to). | UT, E2E |
| REQ-FLT-02 | Status multi-select. | Any subset of statuses; none selected = no filter; selection reflected in UI and URL. | UT, IT, E2E |
| REQ-FLT-03 | Payment method multi-select (e.g. Card, ACH, Wallet). | Same semantics as REQ-FLT-02 over method types. | UT, IT, E2E |
| REQ-FLT-04 | Amount range. | Min/max inclusive; handles empty bound, min>max (rejected or normalised, documented), and currency semantics (ADR-007). | UT, E2E |
| REQ-FLT-05 | Text search by payment ID, email, or last 4 digits. | Case-insensitive; ID/email substring, last4 4-digit match; trimmed; length-capped; no regex interpretation of input. | UT, E2E |
| REQ-FLT-06 (derived) | Filters combine with AND. | Combined filters tested together. | UT |

### 1.6 Mock data, look and feel, tech

| ID | Requirement | Acceptance criteria | Verification |
|---|---|---|---|
| REQ-DATA-01 | Local JSON or in-memory service. | No external network/DB. | REV |
| REQ-DATA-02 | About 300–1,000 rows. | Dataset size within range (planned ≈500). | UT |
| REQ-DATA-03 | Realistic amounts. | Per-currency plausible amount distributions; no negatives/zero (except documented). | UT |
| REQ-DATA-04 | Several currencies. | ≥4 currencies incl. one zero-decimal. | UT |
| REQ-DATA-05 | Mix of statuses. | All four official statuses present with realistic proportions. | UT |
| REQ-LOOK-01 | Match Stripe's look as closely as possible. | Side-by-side review passes per `quality/visual-fidelity.md`. | VIS |
| REQ-LOOK-02 | Copy labels, icons and assets as they appear in the reference. | Labels match exactly; icon shapes match; third-party brand marks handled per ADR-010 (documented deviation). | VIS, REV |
| REQ-TECH-01 | Next.js with TypeScript preferred. | Next.js App Router, TS strict. | REV |
| REQ-TECH-02 | Any styling approach / component library allowed. | Tailwind CSS v4 chosen. | REV |

### 1.7 Optional (ranked by PDF preference; not required)

| ID | Item | Acceptance criteria (if built) | Verification | Plan |
|---|---|---|---|---|
| REQ-OPT-01 | Left sidebar with sections (Payments, Customers, Balances, Product catalog) | Matches reference sidebar; keyboard-navigable | VIS, A11Y | Build (needed for fidelity) |
| REQ-OPT-02 | Top bar: search input + account menu | Matches reference; menu accessible | VIS, A11Y | Build |
| REQ-OPT-03 | Payment details page (own route) with event timeline + metadata | `/payments/[id]` route, 404 for unknown id, timeline from data | E2E, VIS | **Built (Step 11):** timeline + details + metadata; the timeline is **synthetic** (derived from status and timestamps, labelled as such on the page); malformed ids get a real 404 status via `proxy.ts`, well-formed unknown ids render the not-found UI with status 200 + `noindex` (streaming limitation) |
| REQ-OPT-04 | Saved filters, or filters in URL for shareable links | URL round-trips all filter/sort/page state | UT, E2E | **Built:** all filter/sort/page/size state lives in the URL (UT + E2E). Saved filters: not planned |
| REQ-OPT-05 | Column resizing and drag-reorder | Pointer + keyboard operable | E2E, A11Y | **Built (2026-11-24, user request):** drag a header to reorder (dnd-kit, as the Stripe Dashboard does) or use Space + arrow keys; drag the header edge to resize (TanStack column sizing/resizing), Shift+Arrow resizes by keyboard (Alt = 1 px), double-click resets; min widths enforced; "Reset to default" restores order, widths and visibility. E2E for mouse and keyboard on both. Not persisted across reloads. |
| REQ-OPT-06 | CSV export of current view | Exports filtered+sorted rows; formula-injection safe (REC-SEC-02) | UT, E2E | **Built; reworked 2026-11-24 to follow the Stripe "Export payments" dialog:** Export opens a dialog with Time zone (display zone or UTC), Date range (Current view, Today, Current month, Last 7 days, Last 4 weeks, Last month, All, Custom, each showing the dates it covers), Columns (Default or the visible table columns, with the list shown) and Cancel/Export. The file contains every row matching the table filters (+ chosen date range) and sort, not just the page. UT for escaping/options/date presets, E2E for the dialog and downloaded content |

### 1.8 Delivery and review

| ID | Requirement | Acceptance criteria | Verification |
|---|---|---|---|
| REQ-DEL-01 | Deploy anywhere (Vercel, Netlify, Heroku…); send public URL. | URL loads without auth; production build. | MAN |
| REQ-DEL-02 | Share code on GitHub (public fine). | Repo link works for reviewers. | MAN |
| REQ-DEL-03 | If private, add collaborators `arthurrios-chargeblast` and `BrunoMestanzaChargeblast`. | Both added. | MAN |
| REQ-DEL-04 | Reply to the original email with both links before the deadline. | Email sent. | MAN |
| REQ-DEL-05 | Confirm receipt of the document by replying to the email. | Done by user. | MAN |
| REQ-DEL-06 | Deadline: end of day Friday, November 20, 2026 (Brasília time). | **Status: deadline already passed as of 2026-11-24 — see Open question Q1.** | MAN |
| REQ-REV-01 | Hierarchy: every element present and in the right order. | Checklist in visual-fidelity.md. | VIS |
| REQ-REV-02 | Visual fidelity: sizes, spacing, padding, borders, radius. | Measured token comparison. | VIS |
| REQ-REV-03 | Features: everything in the required list works. | All REQ-COL/SORT/PAGE/FLT pass. | E2E |
| REQ-REV-04 | Content: labels and text match the reference exactly. | Label inventory diffed against reference. | VIS, REV |
| REQ-REV-05 | Code: clean, typed, well organized. | Lint, `tsc --noEmit`, review. | REV |
| REQ-REV-06 | Self-review with a critical eye before sending. | Final review checklist executed. | REV |

## 2. Inconsistencies between written requirements and reference

| # | Written text | Reference screenshot | Proposed resolution (assumed, pending confirmation) |
|---|---|---|---|
| I-1 | Columns: Payment ID, Customer, Amount, Status, Payment method, Created. | Columns: checkbox, Amount (+ currency code + status badge in one cell), Payment method, Description, Customer, Date, Refunded date, Decline reason, row menu. **No Payment ID column; header says "Date" not "Created".** | Keep reference column order/labels and **add** a Payment ID column so every written column exists. **Implemented (Step 4):** columns are checkbox, Amount, Status, Payment method, Description, **Payment ID** (inserted after Description, as live Stripe also shows the payment id there), Customer, Date, Refunded date, Decline reason, row menu. Two deliberate deviations: a separate "Status" column header (the reference merges the badge under "Amount", but REQ-SORT-03 needs a sortable status control) and the extra Payment ID column. Date column is labelled "Date" (reference wins on labels, REQ-REV-04) with Created semantics. |
| I-2 | Statuses: Succeeded, Pending, Failed, Refunded. | Visible: Succeeded, Failed, Canceled, Blocked. Tiles: All, Succeeded, Refunded, Disputed, Failed, Uncaptured. No Pending seen. | Support the four official statuses; additionally support Canceled, Blocked, **Disputed and Uncaptured** as reference-fidelity extras (REC-DATA-01). **Implemented (Step 5):** all eight are in the model, in the Status filter, and the six tiles carry the reference labels exactly (All, Succeeded, Refunded, Disputed, Failed, Uncaptured); Pending/Canceled/Blocked are reachable through the Status chip. |
| I-3 | Method filter e.g. Card, ACH, Wallet. | Only card brands + wallet marks (Apple Pay, Link) with last 4. | Model `card`, `ach`, `wallet`; wallet rows carry an underlying card brand + last4 like the reference. |
| I-4 | Filters: date range, status, method, amount range, text search. | Chips: Date and time, Amount, Currency, Status, Payment method, More filters. No in-table search (global search in top bar). | Implement chips in reference order/labels; text search lives in the top-bar search (reference position) and drives `q`. **Implemented (Step 5):** chip order Date and time, Amount, Currency, Status, Payment method, More filters; "More filters" holds the same search field (Payment ID, email or last 4 digits) and shares `q` with the top-bar search. Date presets are labelled Today / 7 days / 30 days / Custom as in the PDF. Currency chip added (REC). "More filters" opens a minimal popover or is non-functional-but-accessible (decision). |
| I-5 | Page sizes 25/50/100. | 20 rows, "Viewing 1–20 of over 10,000 results", Previous/Next only. | Footer reproduces reference wording pattern with exact counts; add page-size selector in the footer (new element, minimal styling). |
| I-6 | Relative time tooltip, copy to clipboard, sorting. | Not visible in static frame. | **Checked in live Stripe test mode on 2026-11-24:** table headers are not sortable and the date cell showed no tooltip on hover (≈ 1 s), so there is no Stripe precedent for REQ-SORT-* and REQ-COL-08; we design them (accessible, minimal, consistent with Stripe styling). Copy affordance not observed (the sandbox shows the payment id in the Description column). |
| I-7 | "Copy labels, icons and assets as they appear." | Contains real-looking customer emails, an account name and third-party brand logos. | Labels/icons copied where generic; **customer data never copied** (synthetic only); brand logos replaced by simplified original glyphs (ADR-010). |
| I-8 | Amounts "formatted with its currency". | Symbol + separate grey currency code (`$9.88 USD`). | Follow reference: Intl-formatted amount + 3-letter code. |
| I-10 | (scale) none | Screenshot is 2048 px wide; its CSS scale is not stated. Measurement suggests ≈ 1.42× of a 1440 px viewport (not 2× of 1024 as first assumed). | Inferred, flagged unverified; see `quality/visual-fidelity.md`. |
| I-9 | Reference header "Transactions" with sibling tabs (Payouts, Top-ups, …) and banner. | Present. | Render as static, non-functional-but-accessible navigation (links to disabled/placeholder state), documented. |

## 3. Engineering recommendations (not official)

| ID | Recommendation | Source | Verification |
|---|---|---|---|
| REC-ARCH-01 | Feature-based structure; pure domain layer separate from React. | CLAUDE.md | REV |
| REC-TS-01 | TypeScript strict; no `any`/`@ts-ignore` without documented justification. | CLAUDE.md | lint, tsc |
| REC-DATA-01 | Money as integer minor units; Intl for formatting; fixed timezone; deterministic seeded data; Zod-validated records. | CLAUDE.md | UT |
| REC-DATA-02 | Document sorting/filtering semantics across currencies (ADR-007). | CLAUDE.md | REV |
| REC-URL-01 | All filter/sort/page state in URL, Zod-validated, defaults on invalid. | plan | UT, E2E |
| REC-SEC-01 | Treat URL params as untrusted; length/size caps; allowlisted sort keys. | CLAUDE.md | UT |
| REC-SEC-02 | CSV export neutralises formula injection. | CLAUDE.md | UT |
| REC-SEC-03 | Production security headers + CSP; `pnpm audit`. | CLAUDE.md | MAN (prod build) |
| REC-A11Y-01 | WCAG 2.2 AA target; automated + manual checks. | CLAUDE.md | A11Y |
| REC-PERF-01 | Measure on production build only; no unmeasured claims. | CLAUDE.md | MAN |
| REC-TEST-01 | Unit + integration + E2E + a11y + visual regression. | CLAUDE.md | CI |
| REC-CI-01 | GitHub Actions: lint, typecheck, test, build, e2e. | CLAUDE.md | CI |
| REC-GIT-01 | Conventional Commits; lockfile committed; no reference materials committed. | CLAUDE.md | REV |

## 4. Open questions

See `docs/implementation-plan.md` §Open questions (Q1–Q9). Defaults assumed until answered are listed there.
