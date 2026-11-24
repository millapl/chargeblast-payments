import { expect, test, type Page } from "@playwright/test";

const rows = (page: Page) => page.locator("tbody tr");
const summary = (page: Page) => page.getByText(/^Viewing /);

function nominal(text: string): number {
  return Number(text.replace(/[^0-9.]/g, ""));
}

async function amounts(page: Page): Promise<number[]> {
  const cells = await page
    .locator("tbody tr td:nth-child(2) span.font-semibold")
    .allTextContents();
  return cells.map(nominal);
}

test.describe("payments table", () => {
  test("loads the default view: 25 rows, newest first", async ({ page }) => {
    await page.goto("/payments");
    await expect(rows(page)).toHaveCount(25);
    await expect(summary(page)).toHaveText("Viewing 1–25 of 500 results");
    await expect(
      page.getByRole("columnheader", { name: /Date/ }),
    ).toHaveAttribute("aria-sort", "descending");
  });

  test("redirects / to /payments", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/payments$/);
  });

  test("sorts by amount in both directions and reflects it in the URL", async ({
    page,
  }) => {
    await page.goto("/payments");
    const header = page.getByRole("columnheader", { name: /Amount/ });

    await page.getByRole("button", { name: "Sort by Amount" }).click();
    await expect(page).toHaveURL(/sort=amount(%3A|:)desc/);
    await expect(header).toHaveAttribute("aria-sort", "descending");
    const desc = await amounts(page);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));

    await page
      .getByRole("button", { name: /^Amount, sorted descending/ })
      .click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    const asc = await amounts(page);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
  });

  test("sorts by date in both directions", async ({ page }) => {
    await page.goto("/payments");
    const header = page.getByRole("columnheader", { name: /Date/ });
    const times = () =>
      page
        .locator("tbody tr td:nth-child(8) time")
        .evaluateAll((nodes) =>
          nodes.map((node) => Date.parse(node.getAttribute("datetime") ?? "")),
        );

    const newestFirst = await times();
    expect(newestFirst).toEqual([...newestFirst].sort((a, b) => b - a));

    await page
      .getByRole("button", { name: /^Date, sorted descending/ })
      .click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await expect
      .poll(async () => {
        const values = await times();
        return (
          values.length === 25 &&
          values.every(
            (value, index) => index === 0 || value >= values[index - 1],
          )
        );
      })
      .toBe(true);
  });

  test("sorts by status alphabetically", async ({ page }) => {
    await page.goto("/payments");
    await page.getByRole("button", { name: "Sort by Status" }).click();
    await expect(
      page.getByRole("columnheader", { name: /Status/ }),
    ).toHaveAttribute("aria-sort", "ascending");
    await expect(rows(page).first()).toContainText("Blocked");
  });

  test("paginates, changes page size and resets to page 1", async ({
    page,
  }) => {
    await page.goto("/payments");
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();

    await page.getByRole("button", { name: "Next" }).click();
    await expect(summary(page)).toHaveText("Viewing 26–50 of 500 results");
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("button", { name: "Previous" })).toBeEnabled();

    await page.getByLabel("Rows per page").selectOption("100");
    await expect(rows(page)).toHaveCount(100);
    await expect(summary(page)).toHaveText("Viewing 1–100 of 500 results");
    await expect(page).not.toHaveURL(/page=/);
  });

  test("restores state from a shared link", async ({ page }) => {
    await page.goto("/payments?sort=amount:asc&size=50&page=2");
    await expect(rows(page)).toHaveCount(50);
    await expect(summary(page)).toHaveText("Viewing 51–100 of 500 results");
    await expect(
      page.getByRole("columnheader", { name: /Amount/ }),
    ).toHaveAttribute("aria-sort", "ascending");
  });

  test("ignores malicious or invalid query parameters", async ({ page }) => {
    await page.goto(
      "/payments?size=100000&page=-4&sort=__proto__:asc&status=<script>alert(1)</script>",
    );
    await expect(rows(page)).toHaveCount(25);
    await expect(summary(page)).toHaveText("Viewing 1–25 of 500 results");
  });

  test("copies the full payment id to the clipboard", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/payments");
    const firstRow = rows(page).first();
    const fullId = await firstRow
      .locator("td:nth-child(6) span.sr-only")
      .textContent();
    expect(fullId).toMatch(/^pi_[A-Za-z0-9]{24}$/);

    await firstRow.hover();
    await firstRow.getByRole("button", { name: /^Copy payment ID/ }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      fullId,
    );
    await expect(
      page.getByRole("status").filter({ hasText: "copied" }),
    ).toHaveText("Payment ID copied to clipboard");
  });

  test("shows relative time in a tooltip on hover and on focus", async ({
    page,
  }) => {
    await page.goto("/payments");
    const date = rows(page).first().locator("time").first();
    // A hover before hydration is lost, so retry it until the tooltip appears.
    await expect(async () => {
      await page.mouse.move(5, 400);
      await date.hover();
      await expect(page.getByRole("tooltip")).toContainText(
        /ago|now|yesterday|in /,
        { timeout: 1000 },
      );
    }).toPass({ timeout: 10_000 });
    await page.mouse.move(5, 400, { steps: 20 });
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await date.focus();
    await expect(page.getByRole("tooltip")).toContainText(
      /ago|now|yesterday|in /,
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });
});
