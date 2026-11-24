import { expect, test, type Page } from "@playwright/test";

const rows = (page: Page) => page.locator("tbody tr");
const summary = (page: Page) => page.getByText(/^Viewing |^No results$/);

async function total(page: Page): Promise<number> {
  const text = (await summary(page).textContent()) ?? "";
  const match = /of ([\d,]+) results/.exec(text);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

/** Filters update the URL first and the table after the server responds, so always poll. */
function pollTotal(page: Page) {
  return expect.poll(() => total(page), { timeout: 10_000 });
}

/** True when at least one row exists and every row passes `check`. */
function pollRows(
  page: Page,
  selector: string,
  check: (text: string) => boolean,
) {
  return expect
    .poll(
      async () => {
        const texts = await rows(page).locator(selector).allTextContents();
        return texts.length > 0 && texts.every((text) => check(text.trim()));
      },
      { timeout: 10_000 },
    )
    .toBe(true);
}

async function openChip(page: Page, name: string) {
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  return page.getByRole("dialog");
}

const nominal = (text: string) => Number(text.replace(/[^0-9.]/g, ""));

test.describe("status tiles", () => {
  test("filter by a single status and reset with All", async ({ page }) => {
    await page.goto("/payments");
    await expect(
      page.getByRole("button", { name: "All", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Failed", exact: true }).click();
    await expect(page).toHaveURL(/status=failed/);
    await expect(
      page.getByRole("button", { name: "Failed", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await pollTotal(page).toBeLessThan(500);
    await pollRows(page, "td:nth-child(3)", (text) =>
      text.startsWith("Failed"),
    );

    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(page).not.toHaveURL(/status=/);
    await pollTotal(page).toBe(500);
  });
});

test.describe("filter chips", () => {
  test("status multi-select applies, summarises and clears", async ({
    page,
  }) => {
    await page.goto("/payments");
    const dialog = await openChip(page, "Status");
    await dialog.getByRole("checkbox", { name: "Succeeded" }).click();
    await dialog.getByRole("checkbox", { name: "Pending" }).click();
    await dialog.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/status=succeeded(%2C|,)pending/);
    await expect(
      page.getByRole("button", { name: /^Status.*Succeeded \+1/ }),
    ).toBeVisible();
    await pollRows(page, "td:nth-child(3)", (text) =>
      /^(Succeeded|Pending)/.test(text),
    );

    await page.getByRole("button", { name: "Clear Status filter" }).click();
    await expect(page).not.toHaveURL(/status=/);
    await pollTotal(page).toBe(500);
  });

  test("payment method multi-select", async ({ page }) => {
    await page.goto("/payments");
    const dialog = await openChip(page, "Payment method");
    await dialog.getByRole("checkbox", { name: "ACH" }).click();
    await dialog.getByRole("button", { name: "Apply" }).click();

    await pollRows(page, "td:nth-child(4) .sr-only", (text) =>
      text.startsWith("ACH bank account"),
    );
  });

  test("currency multi-select", async ({ page }) => {
    await page.goto("/payments");
    const dialog = await openChip(page, "Currency");
    await dialog.getByRole("checkbox", { name: "JPY" }).click();
    await dialog.getByRole("button", { name: "Apply" }).click();

    await pollRows(
      page,
      "td:nth-child(2) span.text-muted",
      (text) => text === "JPY",
    );
  });

  test("amount range filters on nominal value and validates input", async ({
    page,
  }) => {
    await page.goto("/payments");
    let dialog = await openChip(page, "Amount");
    await dialog.getByLabel("Minimum").fill("abc");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog.getByRole("alert")).toContainText("Use a number");
    await dialog.getByLabel("Minimum").fill("200");
    await dialog.getByLabel("Maximum").fill("100");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Minimum must not exceed maximum",
    );

    await dialog.getByLabel("Maximum").fill("400");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/min=200/);
    await expect(page).toHaveURL(/max=400/);
    await pollRows(page, "td:nth-child(2) span.font-semibold", (text) => {
      const amount = nominal(text);
      return amount >= 200 && amount <= 400;
    });

    dialog = await openChip(page, "Amount");
    await expect(dialog.getByLabel("Minimum")).toHaveValue("200");
  });

  test("date presets and custom range", async ({ page }) => {
    await page.goto("/payments");
    let dialog = await openChip(page, "Date and time");
    await dialog.getByRole("radio", { name: "Today" }).check();
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/range=today/);
    await pollTotal(page).toBeLessThan(500);
    const today = await total(page);
    expect(today).toBeGreaterThan(0);

    dialog = await openChip(page, "Date and time");
    await dialog.getByRole("radio", { name: "30 days" }).check();
    await dialog.getByRole("button", { name: "Apply" }).click();
    await pollTotal(page).toBeGreaterThan(today);

    dialog = await openChip(page, "Date and time");
    await dialog.getByRole("radio", { name: "Custom" }).check();
    await dialog.getByLabel("From", { exact: true }).fill("2026-11-20");
    await dialog.getByLabel("To", { exact: true }).fill("2026-11-01");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "start date must not be after",
    );

    await dialog.getByLabel("From", { exact: true }).fill("2026-11-01");
    await dialog.getByLabel("To", { exact: true }).fill("2026-11-20");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/range=custom/);
    await expect(page).toHaveURL(/from=2026-11-01/);
    await expect(
      page.getByRole("button", { name: /Nov 1 – Nov 20/ }),
    ).toBeVisible();
  });

  test("popover is keyboard operable: Escape closes and focus returns to the chip", async ({
    page,
  }) => {
    await page.goto("/payments");
    const chip = page.getByRole("button", { name: /^Currency/ });
    await chip.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(chip).toBeFocused();
  });
});

test.describe("search", () => {
  test("finds by the last four digits, by payment id and by email", async ({
    page,
  }) => {
    await page.goto("/payments");
    const search = page.getByRole("searchbox", { name: /Search payments/ });
    const first = rows(page).first();

    const description =
      (await first.locator("td:nth-child(4) .sr-only").textContent()) ?? "";
    const last4 = /ending in (\d{4})/.exec(description)?.[1];
    expect(last4).toBeDefined();
    await search.fill(last4 ?? "");
    await expect(page).toHaveURL(new RegExp(`q=${last4}`));
    await pollRows(page, "td:nth-child(4) .sr-only", (text) =>
      text.includes(`ending in ${last4}`),
    );

    await search.fill("");
    await expect(page).not.toHaveURL(/q=/);
    await pollTotal(page).toBe(500);

    const fullId =
      (await rows(page)
        .first()
        .locator("td:nth-child(6) span.sr-only")
        .textContent()) ?? "";
    await search.fill(fullId.slice(3, 12).toLowerCase());
    await expect(rows(page)).toHaveCount(1);
    await expect(
      rows(page).first().locator("td:nth-child(6) span.sr-only"),
    ).toHaveText(fullId);

    const email =
      (await rows(page).first().locator("td:nth-child(7)").textContent()) ?? "";
    await search.fill("");
    await pollTotal(page).toBe(500);
    await search.fill(email.trim().toUpperCase());
    await expect(rows(page).first().locator("td:nth-child(7)")).toHaveText(
      email.trim(),
    );
  });

  test("shows an empty state with a working Clear filters action", async ({
    page,
  }) => {
    await page.goto("/payments");
    await page
      .getByRole("searchbox", { name: /Search payments/ })
      .fill("zzz-no-such-customer");
    await expect(page.getByText("No payments found")).toBeVisible();
    await expect(summary(page)).toHaveText("No results");
    await page
      .getByRole("table")
      .getByRole("button", { name: "Clear filters" })
      .click();
    await expect(rows(page)).toHaveCount(25);
    await expect(page).not.toHaveURL(/q=/);
  });

  test("treats regex characters and script tags as plain text", async ({
    page,
  }) => {
    await page.goto("/payments");
    const search = page.getByRole("searchbox", { name: /Search payments/ });
    await search.fill(".*");
    await expect(page.getByText("No payments found")).toBeVisible();
    await search.fill("<script>alert(1)</script>");
    await expect(page.getByText("No payments found")).toBeVisible();
  });
});

test.describe("shared links", () => {
  test("restores combined filters from the URL and clears them together", async ({
    page,
  }) => {
    await page.goto(
      "/payments?status=failed,succeeded&currency=USD&min=10&sort=amount:asc",
    );
    await expect(
      page.getByRole("button", { name: /^Status.*Failed \+1/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Currency.*USD/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Amount.*≥ 10/ }),
    ).toBeVisible();
    await pollTotal(page).toBeLessThan(500);

    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await expect(page).toHaveURL(/sort=amount(%3A|:)asc/);
    await expect(page).not.toHaveURL(/status=|currency=|min=/);
    await pollTotal(page).toBe(500);
  });
});
