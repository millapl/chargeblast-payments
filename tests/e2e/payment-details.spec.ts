import { expect, test } from "@playwright/test";

test.describe("payment details page", () => {
  test("opens from the table with timeline, details and metadata", async ({
    page,
  }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    const firstRow = page.locator("tbody tr").first();
    const fullId =
      (await firstRow.locator("td:nth-child(6) span.sr-only").textContent()) ??
      "";
    await firstRow.getByRole("link", { name: fullId }).click();

    await expect(page).toHaveURL(new RegExp(`/payments/${fullId}$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/\d/);
    await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
    const events = page
      .getByRole("list")
      .filter({ hasText: "Payment created" })
      .getByRole("listitem");
    expect(await events.count()).toBeGreaterThanOrEqual(2);
    await expect(events.first()).toContainText("Payment created");
    await expect(
      page.getByRole("heading", { name: "Payment details" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Metadata" })).toBeVisible();
    await expect(page.getByText(fullId, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Synthetic demo data/)).toBeVisible();

    await page.getByRole("link", { name: "Transactions" }).first().click();
    await expect(page).toHaveURL(/\/payments$/);
  });

  test("a failed payment shows its decline reason in the timeline", async ({
    page,
  }) => {
    await page.goto("/payments?status=failed");
    await page.waitForLoadState("networkidle");
    const row = page.locator("tbody tr").first();
    const reason = (
      (await row.locator("td:nth-child(10)").textContent()) ?? ""
    ).trim();
    expect(reason).not.toBe("");
    await row.getByRole("link").first().click();
    await expect(page.getByText("Payment failed")).toBeVisible();
    await expect(page.getByText(reason).first()).toBeVisible();
  });

  test("malformed ids get a real 404 status and the 404 page", async ({
    page,
  }) => {
    for (const id of [
      "not-an-id",
      "pi_short",
      "pi_AAAAAAAAAAAAAAAAAAAAAAAAA",
    ]) {
      const response = await page.goto(`/payments/${id}`);
      expect(response?.status(), `status for ${id}`).toBe(404);
      await expect(
        page.getByRole("heading", { name: "Page not found" }),
      ).toBeVisible();
    }
  });

  test("a well-formed id that does not exist shows the 404 page and is marked noindex", async ({
    page,
  }) => {
    await page.goto("/payments/pi_AAAAAAAAAAAAAAAAAAAAAAAA");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"][content*="noindex"]').first(),
    ).toBeAttached();
  });

  test("path traversal style ids are rejected", async ({ page }) => {
    const response = await page.goto("/payments/..%2F..%2Fetc%2Fpasswd");
    // The app answers 404; a hosting platform may reject the encoded slashes earlier with 400.
    expect([400, 404]).toContain(response?.status());
  });
});
