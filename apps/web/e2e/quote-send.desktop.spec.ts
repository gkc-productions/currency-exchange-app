import { expect, test } from "@playwright/test";
import { assertNoSevereErrors, trackSevereErrors } from "./helpers";

test.describe("Quote start behavior (desktop)", () => {
  test.beforeEach(async ({ page }) => {
    trackSevereErrors(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await assertNoSevereErrors(page, testInfo);
  });

  test("clicking Start a quote activates quote flow", async ({ page }) => {
    await page.goto("/en#send");

    const startQuote = page.getByRole("link", { name: /start a quote/i }).first();
    await expect(startQuote).toBeVisible();
    await startQuote.click();

    await expect
      .poll(
        async () => {
          if (/\/en\/quote/i.test(page.url())) {
            return true;
          }

          const quoteSection = page.locator("section#quote");
          if (await quoteSection.isVisible().catch(() => false)) {
            const hasBreakdown = await quoteSection
              .getByText(/quote breakdown/i)
              .first()
              .isVisible()
              .catch(() => false);
            if (hasBreakdown) {
              return true;
            }

            const hasFee = await quoteSection
              .getByText(/fee|fees/i)
              .first()
              .isVisible()
              .catch(() => false);
            const hasRate = await quoteSection
              .getByText(/rate/i)
              .first()
              .isVisible()
              .catch(() => false);
            const hasRecipientGets = await quoteSection
              .getByText(/recipient gets/i)
              .first()
              .isVisible()
              .catch(() => false);

            return hasFee && hasRate && hasRecipientGets;
          }

          return false;
        },
        { timeout: 10_000 }
      )
      .toBeTruthy();
  });
});
