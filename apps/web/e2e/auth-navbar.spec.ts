import { expect, test } from "@playwright/test";
import { assertNoSevereErrors, authHeaders, trackSevereErrors } from "./helpers";

test.describe("Navbar auth behavior", () => {
  test.beforeEach(async ({ page }) => {
    trackSevereErrors(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await assertNoSevereErrors(page, testInfo);
  });

  test("after API login, navbar shows dashboard/sign out and not sign in", async ({
    page,
    context,
    baseURL,
  }) => {
    test.fail(true, "Known issue: navbar still shows Sign in after authenticated session.");
    const resolvedBaseURL = baseURL || "http://127.0.0.1:3000";
    const email = `e2e+${Date.now()}@example.com`;
    const password = "Str0ng!Passw0rd!";

    const signupResponse = await context.request.post("/api/auth/signup", {
      headers: authHeaders(resolvedBaseURL),
      data: { email, password },
    });
    expect([201, 400]).toContain(signupResponse.status());

    await context.request.post("/api/auth/logout", {
      headers: authHeaders(resolvedBaseURL),
      data: {},
    });

    const loginResponse = await context.request.post("/api/auth/login", {
      headers: authHeaders(resolvedBaseURL),
      data: { email, password },
    });
    expect(loginResponse.status(), "Programmatic /api/auth/login should succeed").toBe(200);

    await page.goto("/en");

    await expect
      .poll(async () => page.getByRole("link", { name: /^sign in$/i }).count(), {
        timeout: 10_000,
      })
      .toBe(0);

    const dashboardLink = page.getByRole("link", { name: /dashboard/i });
    const signOutButton = page.getByRole("button", { name: /sign out/i });

    await expect
      .poll(
        async () =>
          (await dashboardLink.count()) + (await signOutButton.count()),
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0);
  });
});
