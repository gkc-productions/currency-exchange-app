import { expect, test } from "@playwright/test";
import { assertNoSevereErrors, trackSevereErrors } from "./helpers";

test.describe("Quote start behavior (mobile)", () => {
  test.beforeEach(async ({ page }) => {
    trackSevereErrors(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await assertNoSevereErrors(page, testInfo);
  });

  test("clicking Start a quote shows Quote Breakdown on iPhone viewport", async ({
    page,
  }) => {
    test.fail(true, "Known issue: mobile Quote Breakdown parity is inconsistent.");
    await page.goto("/en#send");

    const startQuote = page.getByRole("link", { name: /start a quote/i }).first();
    await expect(startQuote).toBeVisible();
    await startQuote.click();

    const quoteSection = page.locator("section#quote");
    await expect(quoteSection).toBeVisible({ timeout: 10_000 });
    await expect(quoteSection.getByText(/quote breakdown/i).first()).toBeVisible();
    await expect(quoteSection.getByText(/fee|fees/i).first()).toBeVisible();
    await expect(quoteSection.getByText(/rate/i).first()).toBeVisible();
    await expect(quoteSection.getByText(/recipient gets/i).first()).toBeVisible();
  });
});
