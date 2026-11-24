# Performance

Status: **plan and criteria only. Nothing has been measured. No performance claim may be made until a row in the results table is filled from an actual run.** Not an official assessment requirement (`REC-PERF-01`).

## Principles

- Measure on a **production build** (`pnpm build && pnpm start`), never `next dev`.
- Server Components for shell and table; client JS limited to interactive islands.
- Render at most 100 rows per page.
- No `useMemo`/`useCallback`/`React.memo` unless a profile shows a problem.
- No unmeasured claims in README or docs.

## Targets (goals to verify, not results)

Based on public Core Web Vitals "good" thresholds, adopted as our targets:

| Metric | Target | Tool |
|---|---|---|
| LCP | ≤ 2.5 s | Lighthouse (mobile + desktop), Playwright trace |
| CLS | ≤ 0.1 (aim 0) | Lighthouse, Playwright `PerformanceObserver` |
| INP | ≤ 200 ms for sort/filter/page interactions | Playwright trace/manual profile; Lighthouse "TBT" as lab proxy |
| TBT | ≤ 200 ms (lab proxy) | Lighthouse |
| First-load JS (route) | tracked and justified; no fixed number promised | `next build` output / bundle analyzer if needed |
| Interaction cost | sort/filter on 500 rows without visible jank | manual profile |

## Design measures planned

| Concern | Measure |
|---|---|
| Layout shift | Fixed row heights and column widths; fixed-size icon boxes; `next/font` with fallback metrics adjustments; reserve space for banner/tiles |
| Fonts | Single self-hosted variable font via `next/font` (or system stack); `display: swap` with size-adjust |
| Images/icons | Inline SVG / `lucide-react` named imports (tree-shaken); no raster assets in the table |
| Bundle | Justify each dependency in ADR; check faker is not in the client bundle (ADR-006); Radix only if approved (ADR-004) |
| Data | Query computed server-side; client receives ≤100 rows |
| Rendering | Avoid per-row client state; row components are server-rendered where possible; client islands per filter, not whole-table client component |
| Caching | Follow Next 16 `cacheComponents` guidance after reading installed docs |

## Measurement procedure

1. `pnpm build`; record route sizes from the build output.
2. `pnpm start`; Lighthouse CLI (or Chrome DevTools) mobile + desktop, 3 runs, median, on a clean profile; record device/network emulation settings.
3. Playwright script performs sort, filter, page-size change; capture trace; record long tasks.
4. Compare to targets; log deviations and fixes.

## Results (fill only from executed runs)

| Date | Commit | Env | LCP | CLS | INP/TBT | First-load JS | Notes |
|---|---|---|---|---|---|---|---|
| 2026-11-24 | Step 4 working tree | local `next start`, port 3100 (no Lighthouse, no throttling) | not measured | not measured | not measured | `/payments` loads 9 script chunks: **714 KB raw / 223 KB gzip** (computed by fetching the scripts listed in the HTML and gzipping them) | Includes Next/React runtime, TanStack Table, Radix, nuqs, lucide; the runtime-only baseline was not measured, so the app's own share is unknown. `@faker-js/faker` string not present in any client chunk (checked by substring search). |
| 2026-11-24 | final working tree | `scripts/measure-performance.mjs`, Chromium 159, production `next start` on localhost, **desktop, no throttling**, median of 5 | LCP **64 ms** (FCP 64 ms; runs 176, 64, 60, 60, 64) | CLS **0.0000** | TBT(approx) **0 ms**; INP(approx) **48 ms** | 197 KB encoded JS over the wire in 11 files (includes the post-load interactions: sort, next page, popover) | See caveats below |
| 2026-11-24 | same | same script, **mobile profile**: 390×844, CPU 4× slowdown, ~1.6 Mbps down / 150 ms RTT, median of 5 | LCP **556 ms** (FCP 556 ms; runs 556, 568, 556, 544, 536) | CLS **0.0000** | TBT(approx) **30 ms**; INP(approx) **64 ms** | 197 KB, 11 files | See caveats below |

**Caveats (important):** this is a local lab run, not Lighthouse and not a real device/network; localhost makes TTFB ≈ 4–151 ms. LCP equals FCP because the static shell (heading text) paints first — the table streams in afterwards, so **LCP does not measure the table**. "TBT(approx)" sums `longtask` entries above 50 ms after FCP; "INP(approx)" is the largest `click/pointerdown/keydown/pointerup` event duration (≥ 16 ms threshold) observed during three interactions, not the official INP metric. CLS 0 was measured for this load and these interactions only. The numbers are consistent with the "good" thresholds listed in the targets table, but no Lighthouse score is claimed.
