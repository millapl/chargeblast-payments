# Security

Status: **threat model and checklist only. No control below has been implemented or verified.** Items are `REC-SEC-*`/CLAUDE.md recommendations, not official assessment requirements.

## Context and assets

Public, unauthenticated, read-only demo over synthetic data. No real financial or personal data, no secrets, no backend writes, no payment integration, no database. The goal is demonstrating security awareness proportionate to scope, not building defences for features that do not exist.

## Threat model

| ID | Threat | Entry point | Impact | Planned control | Verification |
|---|---|---|---|---|---|
| T1 | Malformed/oversized URL params break rendering or cause expensive work | `searchParams` | Crash, slow render | Zod parse with defaults; allowlisted enums; `q` ≤ 64; `size` ∈ {25,50,100}; `page` int ≥ 1 clamped; sort ≤ 3 allowlisted keys; invalid → default, never throw | UT with fuzz-ish table (empty, huge, unicode, arrays, `__proto__`) |
| T2 | XSS via rendered data (customer name/email/description) or reflected `q` | table cells, search input echo | Script execution | React auto-escaping; no `dangerouslySetInnerHTML`, `eval`, `new Function`; CSP | ESLint rule + grep check; E2E with payload in `q` |
| T3 | CSV formula injection in export | CSV (REQ-OPT-06) | Spreadsheet code execution/data exfil on open | Prefix cells starting with `= + - @ \t \r` with `'`; RFC-4180 quoting; `Content-Type` + `Content-Disposition`; export only current-view fields | UT incl. `=HYPERLINK(...)`, `@SUM`, `-1+1`, leading whitespace/tab, quotes/newlines |
| T4 | ReDoS / injection through search | `q` | CPU burn | Never build `RegExp` from input; `includes` on lowercased strings | UT |
| T5 | Clickjacking | whole app | UI redress | `frame-ancestors 'none'` (+ `X-Frame-Options: DENY` for legacy) | header check on prod build |
| T6 | Content sniffing, referrer leakage, powerful APIs | responses | misc | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying unused features (clipboard-write must stay allowed for self) | header check |
| T7 | Transport downgrade | deployment | MITM | `Strict-Transport-Security` (host usually terminates TLS; header set in app too) | header check on deployed URL |
| T8 | Vulnerable dependencies / supply chain | npm packages | varied | Lockfile committed; `pnpm install --frozen-lockfile` in CI; `pnpm audit`; minimal new deps (each justified in ADR) | CI step + recorded output |
| T9 | Secret leakage | repo, bundle | credential exposure | No secrets exist; `.env*` gitignored; no `NEXT_PUBLIC_` secrets; reference materials gitignored | repo scan |
| T10 | PII leakage | data, logs | privacy | Synthetic data on reserved email domains; reference-screenshot PII not reproduced; no logging of query/customer data | data test + review |
| T11 | Clipboard abuse | copy button | low | Writes only the payment ID chosen by the user gesture; handles rejection | IT |
| T12 | Open redirect / unsafe links | tabs, banner links | phishing | Links are internal or inert; no user-controlled `href` | review |

## Content Security Policy (implemented in `next.config.ts`, verified on a production build)

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; style-src-attr 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self';
form-action 'self'; frame-ancestors 'none'
```
(`'unsafe-eval'` is added **only** in `next dev`.)

**What was tried, with results (2026-11-24):**
1. Experimental SRI (`experimental.sri`) with `script-src 'self'`: **broke the app** — the browser blocked every inline `<script>` that Next streams (RSC payload and bootstrap); the page never hydrated (verified by capturing the console: "Executing inline script violates … 'script-src self'"). SRI only covers external files, and the inline content differs per request, so static hashes cannot work either.
2. Nonce via `proxy.ts`: per the installed Next docs it requires dynamic rendering for every route and is incompatible with Partial Prerendering, i.e. it would remove the static shell that `cacheComponents` provides. Not adopted.
3. **Adopted:** `'unsafe-inline'` for scripts only (the pattern documented by Next for apps without nonces), everything else strict. The residual risk is explicit: if an attacker could inject markup, inline script would run. Mitigations: React escapes all rendered data, there is no `dangerouslySetInnerHTML`/`eval`/`innerHTML` anywhere in `src` (grep, 2026-11-24), user input is validated and rendered as text (E2E with `"><img onerror><script>` payload), and the CSP still blocks external script origins, cross-origin `connect`/`img`/`form` targets, plugins, `<base>` hijacking and framing, so injected code could not load remote scripts or exfiltrate through fetch/XHR/image requests. It is **not** a complete mitigation: navigation-based exfiltration (e.g. assigning `location`) and same-origin requests are not blocked.
4. `style-src-attr 'unsafe-inline'` is required because Radix positions popovers and tooltips with inline style attributes; inline `<style>` elements remain blocked.

**Other headers (all routes, E2E-verified on `/payments`, `/payments/export` and a 404):** `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, `Cross-Origin-Opener-Policy: same-origin`; `X-Powered-By` removed. `clipboard-read=()` was deliberately **not** set: the app only writes to the clipboard, reading already needs a user permission, and the E2E suite reads the clipboard to verify the copy button (a policy that blocks it would make that check impossible).

## Checklist (status as of 2026-11-24)

- [x] Zod/nuqs parse + limits in place; T1 unit tests pass (`url-state.test.ts`: invalid enums, oversize/negative page, `__proto__`, duplicate keys, 500-char `q`)
- [x] No `dangerouslySetInnerHTML`/`eval`/`new Function`/`innerHTML`/`document.write` in `src` (grep)
- [x] CSV escaping tests pass (T3, `csv.test.ts` + E2E on the endpoint)
- [x] Hardening headers present on production responses (E2E `security.spec.ts`)
- [x] CSP active with **no console violations** while sorting, filtering, opening popovers/tooltips and the Edit-columns panel (E2E)
- [x] `pnpm audit`: "No known vulnerabilities found" (2026-11-24)
- [x] Lockfile committed state: `pnpm-lock.yaml` modified in the working tree and intended for commit; **commit not made yet**
- [x] Reference materials not tracked: `git ls-files docs/references` is empty
- [ ] CI uses a frozen lockfile (workflow written in Step 10, not yet run on GitHub)
- [ ] Re-run `pnpm audit` immediately before delivery

## Results log

| Date | Check | Result |
|---|---|---|
| 2026-11-24 | `pnpm audit` on scaffold + current deps | No known vulnerabilities found |
| 2026-11-24 | `pnpm audit` after adding Radix/faker/nuqs and all app code | No known vulnerabilities found |
| 2026-11-24 | SRI + `script-src 'self'` | **Failed** — inline scripts blocked, page does not hydrate (see above) |
| 2026-11-24 | Final CSP, interactive flow, Chromium | 0 violations, 0 console errors, 0 page errors |
| 2026-11-24 | Security headers on 3 routes | All present (E2E) |
| 2026-11-24 | Hostile `q` (`"><img onerror><script>`) | Rendered as text, no dialog, no injected `<img>` (E2E) |
| 2026-11-24 | CSV formula injection | Neutralised (unit tests, including values with leading spaces, added after the independent review); the generated data contains no formula prefixes, so the E2E can only check the endpoint shape |

## Assumptions and limitations (to publish in README)

Demo only: no authentication, no authorization, no rate limiting (no server mutations to protect), data is fake, CSV export is a server-side GET route handler (`/payments/export`) that validates the query with the same parsers as the page and returns every matching row; it is unauthenticated and has no rate limit or row cap, which is acceptable only because the dataset is a fixed 500-row in-memory set, headers are verified for the Vercel-style deployment only. Hosting-platform headers may differ from `next start`.

## Independent review (2026-11-24, read-only, by a subagent following `.claude/agents/security-reviewer.md`)

No high or critical findings. Verified by reading (not re-run by the reviewer): no bypass found in URL parsing/limits, search, sorting, `proxy.ts` (case, encodings, `%2F`, newline, rewrite loop), headers, secrets/PII (`git ls-files docs/references` is empty; emails only on reserved domains); no `dangerouslySetInnerHTML`/`eval`/`new RegExp(userInput)`/`console.*` in `src`.

| Finding | Severity | Resolution |
|---|---|---|
| CSV only checked the first character, so ` =1+1` (leading space) passed through | Low | **Fixed**: first non-blank character is now checked; tests added |
| This document said CSV export runs client-side; it is a server route handler | Low (accuracy) | **Fixed** (see Assumptions) |
| CSP residual-risk text overstated ("could not exfiltrate") | Low (accuracy) | **Fixed**: navigation-based exfiltration and same-origin requests are explicitly not blocked |
| Payment-id regex duplicated in proxy.ts, timeline.ts, schemas.ts | Low | **Fixed**: one `PAYMENT_ID_PATTERN` in `types.ts`; `proxy.ts` must keep its own copy (Proxy cannot import shared modules per the Next docs) and a unit test fails if the two drift |
| Export endpoint has no rate limit / row cap | Low | **Accepted**: demo over a fixed 500-row dataset; documented |
| Trailing-slash handling of `/payments/<id>/` depends on Next's redirect before the proxy | Info (speculation) | Not tested; not changed |
| Lockfile/source not committed (index tracks only the scaffold) | Low | **Open**: nothing has been committed in this session because no commit was requested |
