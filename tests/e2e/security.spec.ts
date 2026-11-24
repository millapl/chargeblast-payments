import { expect, test } from "@playwright/test";

const HOSTILE = '"><img src=x onerror=alert(1)><script>alert(2)</script>';
const ROUTES = ["/payments", "/payments/export", "/does-not-exist"];

test.describe("security headers", () => {
  for (const route of ROUTES) {
    test(`${route} sends the hardening headers`, async ({ request }) => {
      const response = await request.get(route);
      const headers = response.headers();

      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["referrer-policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(headers["strict-transport-security"]).toContain("max-age=");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
      expect(headers["x-powered-by"]).toBeUndefined();

      const csp = headers["content-security-policy"] ?? "";
      for (const directive of [
        "default-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "connect-src 'self'",
      ]) {
        expect(csp).toContain(directive);
      }
      expect(csp).not.toContain("unsafe-eval");
      expect(csp).not.toMatch(/\*/);
    });
  }
});

test("the CSP does not break the app: no violations or console errors while using it", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      console.error(
        `CSP violation: ${event.violatedDirective} ${event.blockedURI}`,
      );
    });
  });

  await page.goto("/payments");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Sort by Amount" }).click();
  await page.getByRole("button", { name: /^Status/ }).click();
  await page.getByRole("checkbox", { name: "Failed" }).click();
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/status=failed/);
  await expect(page.getByText(/^Viewing /)).not.toHaveText(
    "Viewing 1–25 of 500 results",
  );
  await page.locator("tbody tr").first().locator("time").first().hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.getByRole("button", { name: "Edit columns" }).click();
  await page.keyboard.press("Escape");

  expect(problems).toEqual([]);
});

test("hostile input is rendered inertly", async ({ page }) => {
  let dialogOpened = false;
  page.on("dialog", async (dialog) => {
    dialogOpened = true;
    await dialog.dismiss();
  });
  await page.goto(`/payments?q=${encodeURIComponent(HOSTILE)}`);
  await expect(page.getByText("No payments found")).toBeVisible();
  const search = page.getByRole("searchbox", { name: /Search payments/ });
  await expect(search).toHaveValue(HOSTILE);
  expect(await page.locator("img[src='x']").count()).toBe(0);
  expect(dialogOpened).toBe(false);
});
