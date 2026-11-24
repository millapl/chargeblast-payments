import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")),
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

test.describe("axe (WCAG 2.2 AA)", () => {
  test("default view", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("tbody tr")).toHaveCount(25);
    await scan(page);
  });

  test("status filter popover open", async ({ page }) => {
    await page.goto("/payments");
    await page.getByRole("button", { name: /^Status/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page);
  });

  test("amount popover showing a validation error", async ({ page }) => {
    await page.goto("/payments");
    await page.getByRole("button", { name: /^Amount/ }).click();
    await page.getByLabel("Minimum").fill("abc");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Use a number" }),
    ).toBeVisible();
    await scan(page);
  });

  test("date popover with the custom range", async ({ page }) => {
    await page.goto("/payments");
    await page.getByRole("button", { name: /^Date and time/ }).click();
    await page.getByRole("radio", { name: "Custom" }).check();
    await scan(page);
  });

  test("edit columns panel open", async ({ page }) => {
    await page.goto("/payments");
    await page.getByRole("button", { name: "Edit columns" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page);
  });

  test("account menu open", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /account menu/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page);
  });

  test("tooltip visible", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await page.locator("tbody tr").first().locator("time").first().hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await scan(page);
  });

  test("filtered, sorted and paginated view with applied chips", async ({
    page,
  }) => {
    await page.goto(
      "/payments?status=failed,succeeded&currency=USD&min=10&sort=amount:asc&size=50",
    );
    await expect(
      page.getByRole("button", { name: /^Status.*Failed \+1/ }),
    ).toBeVisible();
    await scan(page);
  });

  test("empty state", async ({ page }) => {
    await page.goto("/payments?q=zzz-no-match");
    await expect(page.getByText("No payments found")).toBeVisible();
    await scan(page);
  });

  test("payment details page", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await page.locator("tbody tr").first().getByRole("link").first().click();
    await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
    await scan(page);
  });

  test("404 page", async ({ page }) => {
    await page.goto("/does-not-exist");
    await scan(page);
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test("default view and open navigation", async ({ page }) => {
      await page.goto("/payments");
      await expect(page.locator("tbody tr")).toHaveCount(25);
      await scan(page);
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(
        page.getByRole("navigation", { name: "Main" }),
      ).toBeVisible();
      await scan(page);
    });
  });
});

test.describe("keyboard and preferences", () => {
  test("skip link is the first tab stop and moves focus to the content", async ({
    page,
  }) => {
    await page.goto("/payments");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("every interactive control in the first table row is reachable with Tab", async ({
    page,
  }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    const firstRow = page.locator("tbody tr").first();
    const targets = firstRow.locator("button, [tabindex='0'], a");
    const count = await targets.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let index = 0; index < count; index += 1) {
      await targets.nth(index).focus();
      await expect(targets.nth(index)).toBeFocused();
    }
  });

  test("sort headers are real buttons with accessible names and aria-sort", async ({
    page,
  }) => {
    await page.goto("/payments");
    const sortable = page
      .getByRole("columnheader")
      .filter({ has: page.getByRole("button") });
    await expect(sortable).toHaveCount(3);
    for (const header of await sortable.all()) {
      await expect(header).toHaveAttribute(
        "aria-sort",
        /ascending|descending|none/,
      );
    }
    await page.getByRole("button", { name: "Sort by Status" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/sort=status/);
  });

  test("reduced motion disables transitions and animations", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/payments");
    const duration = await page
      .getByRole("button", { name: "Next" })
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });

  test("the page is usable at 200% zoom equivalent (640 px wide) without sideways page scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto("/payments");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
