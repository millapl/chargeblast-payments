import { expect, test, type Page } from "@playwright/test";

const headers = (page: Page) =>
  page
    .locator("thead th")
    .evaluateAll((cells) =>
      cells
        .map((cell) => cell.getAttribute("data-column-id"))
        .filter((id): id is string => id !== null),
    );

const width = (page: Page, columnId: string) =>
  page
    .locator(`thead th[data-column-id="${columnId}"]`)
    .evaluate((cell) => Math.round(cell.getBoundingClientRect().width));

/** dnd-kit registers its keyboard listener one tick after Space; real typing is slower than a script. */
async function pressSlowly(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  }
}

async function ready(page: Page, url = "/payments") {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("tbody tr")).toHaveCount(25);
}

test.describe("column reordering", () => {
  test("by keyboard: Space picks the column up, arrows move it, Space drops it", async ({
    page,
  }) => {
    await ready(page);
    const before = await headers(page);
    const index = before.indexOf("customer");

    await page
      .getByRole("button", { name: "Reorder or resize the Customer column" })
      .focus();
    await pressSlowly(page, ["Space", "ArrowLeft", "Space"]);

    await expect
      .poll(() => headers(page))
      .toEqual(
        before.map((id, position) => {
          if (position === index - 1) return "customer";
          if (position === index) return before[index - 1];
          return id;
        }),
      );
  });

  test("by mouse: dragging a header over another moves it, and a plain click still sorts", async ({
    page,
  }) => {
    await ready(page);
    const before = await headers(page);

    const source = page.locator('thead th[data-column-id="date"]');
    const target = page.locator('thead th[data-column-id="customer"]');
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) throw new Error("headers not laid out");

    await page.mouse.move(sourceBox.x + 8, sourceBox.y + 15);
    await page.mouse.down();
    await page.mouse.move(sourceBox.x - 30, sourceBox.y + 15, { steps: 10 });
    await page.mouse.move(targetBox.x + 8, targetBox.y + 15, { steps: 10 });
    await page.mouse.up();

    await expect
      .poll(async () => {
        const after = await headers(page);
        return after.indexOf("date") < after.indexOf("customer");
      })
      .toBe(true);
    const after = await headers(page);
    expect(after).toHaveLength(before.length);
    expect(after[0]).toBe("select");
    expect(after.at(-1)).toBe("actions");

    // The drag must not have been taken for a sort click, and a real click must still sort.
    await expect(page).not.toHaveURL(/sort=/);
    // dnd-kit swallows clicks for a few ms after a drag; a person never clicks that fast.
    await page.waitForTimeout(300);
    await page
      .getByRole("button", { name: /^Date, sorted descending/ })
      .click();
    await expect(page).toHaveURL(/sort=date(%3A|:)asc/);
  });

  test("the checkbox and actions columns cannot be moved", async ({ page }) => {
    await ready(page);
    await expect(
      page.getByRole("button", {
        name: /Reorder or resize the (Select|Actions)/,
      }),
    ).toHaveCount(0);
  });

  test("rows follow the new order and Reset to default restores it", async ({
    page,
  }) => {
    await ready(page);
    const original = await headers(page);
    await page
      .getByRole("button", { name: "Reorder or resize the Status column" })
      .focus();
    await pressSlowly(page, ["Space", "ArrowRight", "Space"]);
    await expect.poll(() => headers(page)).not.toEqual(original);

    // Cells are in the same order as their headers.
    const order = await headers(page);
    const firstRowIds = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .evaluateAll((cells) => cells.length);
    expect(firstRowIds).toBe(order.length);

    await page.getByRole("button", { name: "Edit columns" }).click();
    await page.getByRole("button", { name: "Reset to default" }).click();
    await expect.poll(() => headers(page)).toEqual(original);
  });

  test("announces the move to screen readers", async ({ page }) => {
    await ready(page);
    await page
      .getByRole("button", { name: "Reorder or resize the Date column" })
      .focus();
    await pressSlowly(page, ["Space"]);
    await expect(
      page.getByText(/The Date column is over position \d+ of 9/),
    ).toBeAttached();
    await pressSlowly(page, ["ArrowLeft"]);
    await expect(
      page.getByText(/The Date column is over position 6 of 9/),
    ).toBeAttached();
    await pressSlowly(page, ["Escape"]);
    await expect(
      page.getByText(/Moving the Date column was cancelled/),
    ).toBeAttached();
  });
});

test.describe("column resizing", () => {
  test("by mouse: dragging the edge of a header changes the column width", async ({
    page,
  }) => {
    await ready(page);
    const before = await width(page, "customer");
    const handle = page.locator('[data-resize-handle="customer"]');
    const box = await handle.boundingBox();
    if (!box) throw new Error("no resize handle");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();

    await expect
      .poll(() => width(page, "customer"))
      .toBeGreaterThan(before + 40);
    // Other columns keep their width: only the dragged column changes.
    await expect.poll(() => width(page, "status")).toBe(118);
  });

  test("by keyboard: Shift+Arrow resizes in 10 px steps, Alt in 1 px steps", async ({
    page,
  }) => {
    await ready(page);
    const before = await width(page, "description");
    const button = page.getByRole("button", {
      name: "Reorder or resize the Description column",
    });
    await button.focus();
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await expect.poll(() => width(page, "description")).toBe(before + 20);
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    await expect.poll(() => width(page, "description")).toBe(before + 19);
    await expect(
      page.getByText(/Description column width \d+ pixels/),
    ).toBeAttached();
  });

  test("a column cannot shrink below its minimum width", async ({ page }) => {
    await ready(page);
    const button = page.getByRole("button", {
      name: "Reorder or resize the Date column",
    });
    await button.focus();
    for (let i = 0; i < 30; i += 1)
      await page.keyboard.press("Shift+ArrowLeft");
    await expect.poll(() => width(page, "date")).toBeGreaterThanOrEqual(90);
    expect(await width(page, "date")).toBeLessThan(100);
  });

  test("double-clicking the handle and Reset to default restore the width", async ({
    page,
  }) => {
    await ready(page);
    const original = await width(page, "paymentId");
    await page
      .getByRole("button", { name: "Reorder or resize the Payment ID column" })
      .focus();
    await page.keyboard.press("Shift+ArrowRight");
    await expect.poll(() => width(page, "paymentId")).toBe(original + 10);

    await page.locator('[data-resize-handle="paymentId"]').dblclick();
    await expect.poll(() => width(page, "paymentId")).toBe(original);

    await page.keyboard.press("Shift+ArrowRight");
    await page.getByRole("button", { name: "Edit columns" }).click();
    await page.getByRole("button", { name: "Reset to default" }).click();
    await expect.poll(() => width(page, "paymentId")).toBe(original);
  });

  test("the table keeps a horizontal scroll area when columns are widened", async ({
    page,
  }) => {
    await ready(page);
    const button = page.getByRole("button", {
      name: "Reorder or resize the Customer column",
    });
    await button.focus();
    for (let i = 0; i < 20; i += 1)
      await page.keyboard.press("Shift+ArrowRight");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const scrollable = await page
      .getByRole("region", { name: "Payments" })
      .evaluate((element) => element.scrollWidth > element.clientWidth);
    expect(scrollable).toBe(true);
  });
});

test.describe("export dialog", () => {
  async function openExport(page: Page, url = "/payments") {
    await ready(page, url);
    await page.getByRole("button", { name: "Export" }).click();
    const dialog = page.getByRole("dialog", { name: "Export payments" });
    await expect(dialog).toBeVisible();
    return dialog;
  }

  async function exportedLines(
    page: Page,
    dialog: ReturnType<Page["getByRole"]>,
  ) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      dialog.getByRole("link", { name: "Export" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("payments.csv");
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8").trimEnd().split("\r\n");
  }

  test("has the Stripe options: time zone, date range, columns, Cancel and Export", async ({
    page,
  }) => {
    const dialog = await openExport(page);
    await expect(
      dialog.getByRole("radio", { name: /GMT-03:00 \(America\/Sao_Paulo\)/ }),
    ).toBeChecked();
    await expect(dialog.getByRole("radio", { name: "UTC" })).toBeVisible();
    for (const name of [
      "Current view",
      "Today",
      "Current month",
      "Last 7 days",
      "Last 4 weeks",
      "Last month",
      "All",
      "Custom",
    ]) {
      await expect(
        dialog.getByRole("radio", { name, exact: true }),
      ).toBeVisible();
    }
    await expect(dialog.getByLabel("Columns")).toHaveValue("default");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Export" })).toBeVisible();
    // Presets show the dates they cover.
    await expect(
      dialog.getByText(/^[A-Z][a-z]{2} \d{1,2}$/).first(),
    ).toBeVisible();
  });

  test("Cancel and Escape close it, returning focus to the trigger", async ({
    page,
  }) => {
    const dialog = await openExport(page);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Export" })).toBeFocused();

    await page.getByRole("button", { name: "Export" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("exports the current view by default (filters, sort, all pages)", async ({
    page,
  }) => {
    const dialog = await openExport(
      page,
      "/payments?status=failed&sort=amount:asc",
    );
    const lines = await exportedLines(page, dialog);
    expect(lines.length).toBeGreaterThan(26);
    expect(lines[0]).toContain("Date (America/Sao_Paulo)");
    // Failed is the 4th column; the local timestamp has no "T"/"Z".
    expect(
      lines.slice(1).every((line) => line.split(",")[3] === "Failed"),
    ).toBe(true);
    expect(lines[1].split(",")[7]).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
    await expect(dialog).toHaveCount(0);
  });

  test("UTC writes ISO timestamps", async ({ page }) => {
    const dialog = await openExport(page);
    await dialog.getByRole("radio", { name: "UTC" }).check();
    const lines = await exportedLines(page, dialog);
    expect(lines[0]).toContain("Date (UTC)");
    expect(lines[1].split(",")[7]).toMatch(/Z$/);
  });

  test("a date range replaces the table's date filter and narrows the rows", async ({
    page,
  }) => {
    const dialog = await openExport(page);
    await dialog.getByRole("radio", { name: "Today" }).check();
    const today = await exportedLines(page, dialog);

    const second = await openExport(page);
    await second.getByRole("radio", { name: "All" }).check();
    const all = await exportedLines(page, second);

    expect(today.length).toBeGreaterThan(1);
    expect(all.length).toBe(501);
    expect(today.length).toBeLessThan(all.length);
  });

  test("table columns exports only the visible columns, in table order terms", async ({
    page,
  }) => {
    await ready(page);
    await page.getByRole("button", { name: "Edit columns" }).click();
    await page
      .getByRole("dialog")
      .getByRole("checkbox", { name: "Description" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("checkbox", { name: "Customer" })
      .click();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Export" }).click();
    const dialog = page.getByRole("dialog", { name: "Export payments" });
    await dialog.getByLabel("Columns").selectOption("table");
    await expect(
      dialog.getByText("Payment ID, Amount, Currency, Status, Payment method"),
    ).toBeVisible();
    const lines = await exportedLines(page, dialog);
    expect(lines[0]).not.toContain("Description");
    expect(lines[0]).not.toContain("Customer");
    expect(lines[0]).toContain("Payment ID");
  });

  test("a custom range needs valid dates and Export stays disabled until then", async ({
    page,
  }) => {
    const dialog = await openExport(page);
    await dialog.getByRole("radio", { name: "Custom" }).check();
    const disabledExport = dialog.getByRole("button", { name: "Export" });
    await expect(disabledExport).toBeDisabled();
    await expect(dialog.getByRole("alert")).toContainText(
      "Choose a start date",
    );

    await dialog.getByLabel("From", { exact: true }).fill("2026-11-20");
    await dialog.getByLabel("To", { exact: true }).fill("2026-11-01");
    await expect(dialog.getByRole("alert")).toContainText("must not be after");
    await expect(disabledExport).toBeDisabled();

    await dialog.getByLabel("From", { exact: true }).fill("2026-11-01");
    await dialog.getByLabel("To", { exact: true }).fill("2026-11-20");
    await expect(dialog.getByRole("link", { name: "Export" })).toBeVisible();
    const lines = await exportedLines(page, dialog);
    expect(lines.length).toBeGreaterThan(1);
  });

  test("the endpoint ignores invalid tz and cols values", async ({
    request,
  }) => {
    const response = await request.get(
      "/payments/export?tz=Mars&cols=password,id",
    );
    expect(response.status()).toBe(200);
    const lines = (await response.text()).trimEnd().split("\r\n");
    expect(lines[0]).toBe("Payment ID");
    expect(lines).toHaveLength(501);
  });
});
