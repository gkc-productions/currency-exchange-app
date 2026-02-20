import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      testMatch: ["**/*.desktop.spec.ts", "**/auth-navbar.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile-iphone13",
      testMatch: ["**/*.mobile.spec.ts", "**/auth-navbar.spec.ts"],
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
      },
    },
  ],
});
