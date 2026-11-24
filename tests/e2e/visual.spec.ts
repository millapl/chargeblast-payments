import { expect, test, type Page } from "@playwright/test";

// Regression guard for OUR layout, not a comparison with Stripe (see docs/quality/visual-fidelity.md).
// Baselines are platform-specific (system fonts), so CI skips this file (@visual).
// Rows, dates and counts depend on the clock/seed, so they are masked.
const dynamic = (page: Page) => [
  page.locator("tbody"),
  page.getByText(/^Viewing |^No results$/),
  page.getByText("Test mode has moved."),
];

test.describe("visual regression @visual", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("desktop chrome", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("desktop.png", {
      mask: dynamic(page),
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });

  test("filter popover open", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /^Status/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveScreenshot(
      "status-popover.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.01,
      },
    );
  });

  test("empty state", async ({ page }) => {
    await page.goto("/payments?q=zzz-no-match");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("No payments found")).toBeVisible();
    await expect(page).toHaveScreenshot("empty.png", {
      mask: [page.getByText("Test mode has moved.")],
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("mobile chrome", async ({ page }) => {
      await page.goto("/payments");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("mobile.png", {
        mask: dynamic(page),
        animations: "disabled",
        maxDiffPixelRatio: 0.01,
      });
    });
  });
});
