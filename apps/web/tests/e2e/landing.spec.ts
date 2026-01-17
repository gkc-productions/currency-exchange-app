import { test, expect } from "@playwright/test";

const locales = ["en", "fr"] as const;

test.describe("landing funnel", () => {
  for (const locale of locales) {
    test(`loads ${locale} and renders quote + recommendations`, async ({ page, request }) => {
      const assetsResponse = await request.get("/api/assets");
      expect(assetsResponse.ok()).toBeTruthy();

      await page.goto(`/${locale}`);
      await expect(page.getByTestId("send-amount")).toBeVisible();

      await page.getByTestId("send-amount").fill("250");
      await page.getByTestId("send-cta").click();

      await expect(page.getByTestId("quote-section")).toBeVisible();
      await expect(page.getByTestId("quote-breakdown")).toBeVisible();

      await expect(page.getByTestId("recommendation-recommended")).toBeVisible();

      const railLabels = await page
        .locator("[data-testid='recommendation-rail']")
        .allTextContents();
      const trimmed = railLabels.map((label) => label.trim()).filter(Boolean);
      if (trimmed.length >= 2) {
        const unique = new Set(trimmed);
        expect(unique.size).toBeGreaterThan(1);
      }
    });
  }
});
