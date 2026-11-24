// Lab measurement of the production build with Chromium (not Lighthouse). Usage:
//   pnpm build && pnpm exec next start --port 3100 &
//   node scripts/measure-performance.mjs [baseUrl]
// Reports the median of RUNS page loads per profile. Numbers are from this machine only.
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3100";
const RUNS = 5;

const PROFILES = {
  "desktop (no throttling)": {
    viewport: { width: 1440, height: 900 },
    cpu: 1,
    network: null,
  },
  "mobile (390px, CPU 4x, ~1.6 Mbps / 150 ms RTT)": {
    viewport: { width: 390, height: 844 },
    cpu: 4,
    network: {
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    },
  },
};

const OBSERVERS = () => {
  window.__perf = { lcp: 0, cls: 0, fcp: 0, longTasks: [], events: [] };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries())
      if (!entry.hadRecentInput) window.__perf.cls += entry.value;
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries())
      if (entry.name === "first-contentful-paint")
        window.__perf.fcp = entry.startTime;
  }).observe({ type: "paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries())
      window.__perf.longTasks.push({
        start: entry.startTime,
        duration: entry.duration,
      });
  }).observe({ type: "longtask", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries())
      window.__perf.events.push({ name: entry.name, duration: entry.duration });
  }).observe({ type: "event", durationThreshold: 16, buffered: true });
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

async function measureOnce(browser, profile) {
  const context = await browser.newContext({ viewport: profile.viewport });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  if (profile.cpu > 1)
    await client.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
  if (profile.network) {
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      ...profile.network,
    });
  }
  await page.addInitScript(OBSERVERS);
  await page.goto(`${BASE}/payments`, { waitUntil: "networkidle" });
  await page.locator("tbody tr").first().waitFor();

  // Interactions after load: sort, next page, open a popover (INP is the worst event duration).
  await page.getByRole("button", { name: "Sort by Amount" }).click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Next" }).click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /^Status/ }).click();
  await page.waitForTimeout(400);

  const result = await page.evaluate(() => {
    const perf = window.__perf;
    const tbt = perf.longTasks
      .filter((task) => task.start > perf.fcp)
      .reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);
    const interactions = perf.events.filter((event) =>
      ["click", "pointerdown", "keydown", "pointerup"].includes(event.name),
    );
    const scripts = performance
      .getEntriesByType("resource")
      .filter(
        (entry) =>
          entry.initiatorType === "script" || entry.name.endsWith(".js"),
      );
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      ttfb: nav.responseStart,
      fcp: perf.fcp,
      lcp: perf.lcp,
      cls: perf.cls,
      tbt,
      inp: interactions.length
        ? Math.max(...interactions.map((event) => event.duration))
        : 0,
      jsTransferKB:
        scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0) / 1024,
      jsFiles: scripts.length,
    };
  });
  await context.close();
  return result;
}

const browser = await chromium.launch();
console.log(
  `Base URL ${BASE}; median of ${RUNS} runs; Chromium ${browser.version()}\n`,
);
for (const [name, profile] of Object.entries(PROFILES)) {
  const runs = [];
  for (let index = 0; index < RUNS; index += 1)
    runs.push(await measureOnce(browser, profile));
  const pick = (key) => median(runs.map((run) => run[key]));
  console.log(name);
  console.log(
    `  TTFB ${pick("ttfb").toFixed(0)} ms | FCP ${pick("fcp").toFixed(0)} ms | LCP ${pick("lcp").toFixed(0)} ms`,
  );
  console.log(
    `  CLS ${pick("cls").toFixed(4)} | TBT(approx) ${pick("tbt").toFixed(0)} ms | INP(approx, max event) ${pick("inp").toFixed(0)} ms`,
  );
  console.log(
    `  JS over the wire (encoded body, incl. interactions) ${pick("jsTransferKB").toFixed(0)} KB in ${pick("jsFiles")} files`,
  );
  console.log(
    `  LCP runs: ${runs.map((run) => run.lcp.toFixed(0)).join(", ")}\n`,
  );
}
await browser.close();
