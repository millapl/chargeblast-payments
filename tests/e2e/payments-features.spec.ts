import { expect, test, type Page } from "@playwright/test";

const rows = (page: Page) => page.locator("tbody tr");

test.describe("CSV export", () => {
  test("the endpoint returns every row matching the filters, with safe headers", async ({
    request,
  }) => {
    const response = await request.get(
      "/payments/export?status=failed&sort=amount:asc",
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["content-disposition"]).toContain("attachment");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");

    const lines = (await response.text()).trimEnd().split("\r\n");
    expect(lines[0]).toBe(
      "Payment ID,Amount,Currency,Status,Payment method,Description,Customer,Date (UTC),Refunded date (UTC),Decline reason",
    );
    expect(lines.length).toBeGreaterThan(26); // more than one page of failed payments
    expect(
      lines.slice(1).every((line) => line.split(",")[3] === "Failed"),
    ).toBe(true);
  });

  test("ignores invalid parameters instead of failing", async ({ request }) => {
    const response = await request.get(
      "/payments/export?status=nope&sort=__proto__:asc&size=9999",
    );
    expect(response.status()).toBe(200);
    expect((await response.text()).trimEnd().split("\r\n")).toHaveLength(501);
  });

  test("the Export button downloads the current view", async ({ page }) => {
    await page.goto("/payments?currency=JPY");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Export" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("payments.csv");
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const lines = Buffer.concat(chunks)
      .toString("utf8")
      .trimEnd()
      .split("\r\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.slice(1).every((line) => line.split(",")[2] === "JPY")).toBe(
      true,
    );
  });
});

test.describe("Edit columns", () => {
  test("hides and restores columns", async ({ page }) => {
    await page.goto("/payments");
    await expect(
      page.getByRole("columnheader", { name: "Description" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Edit columns" }).click();
    await page
      .getByRole("dialog")
      .getByRole("checkbox", { name: "Description" })
      .click();
    await expect(
      page.getByRole("columnheader", { name: "Description" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Customer" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Reset to default" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Description" }),
    ).toBeVisible();
  });
});

test.describe("row selection", () => {
  test("select-all and individual selection", async ({ page }) => {
    await page.goto("/payments");
    const selectAll = page.getByRole("checkbox", {
      name: "Select all payments on this page",
    });
    await selectAll.click();
    await expect(page.locator("tbody tr[data-selected]")).toHaveCount(25);
    await expect(selectAll).toBeChecked();

    await rows(page).first().getByRole("checkbox").click();
    await expect(page.locator("tbody tr[data-selected]")).toHaveCount(24);
    await expect(selectAll).toHaveAttribute("aria-checked", "mixed");
  });
});

test.describe("responsive layout", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("mobile: navigation lives in a menu and the page does not scroll sideways", async ({
    page,
  }) => {
    await page.goto("/payments");
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Transactions" }),
    ).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Escape");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("region", { name: "Payments" })).toBeVisible();
  });
});

test.describe("error pages", () => {
  test("unknown routes show a helpful 404", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to Transactions" }).click();
    await expect(page).toHaveURL(/\/payments$/);
  });
});

test.describe("account menu", () => {
  test("opens from the sidebar header, lists actions and closes with Escape", async ({
    page,
  }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    const trigger = page.getByRole("button", { name: /account menu/i });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("demo@example.com")).toBeVisible();
    for (const name of ["Account settings", "Switch account", "Sign out"]) {
      await expect(dialog.getByRole("button", { name })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe("pagination contract", () => {
  test("the page-size selector offers exactly 25, 50 and 100", async ({
    page,
  }) => {
    await page.goto("/payments");
    const options = await page
      .getByLabel("Rows per page")
      .locator("option")
      .allTextContents();
    expect(options).toEqual(["25", "50", "100"]);
  });

  test("changing a filter resets the page to 1", async ({ page }) => {
    await page.goto("/payments?page=3");
    await expect(
      page.getByText(/^Viewing 51–75 of 500 results$/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Failed", exact: true }).click();
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByText(/^Viewing 1–/)).toBeVisible();
  });
});
