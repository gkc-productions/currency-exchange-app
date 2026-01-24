import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://10.0.0.105:3000";

const auditState = {
  steps: new Set<string>(),
  failingUrls: new Set<string>(),
  consoleErrors: [] as string[],
  pageErrors: [] as string[],
  requestFailures: [] as string[],
  responseFailures: [] as string[],
  screenshots: [] as string[],
};

const screenshotDir = path.join(process.cwd(), "audit", "screenshots");

function recordStep(step: string) {
  auditState.steps.add(step);
}

function isTrackedUrl(url: string) {
  return url.startsWith(baseURL);
}

function setupAuditListeners(page: Page, label: string) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      auditState.consoleErrors.push(`[${label}] ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    auditState.pageErrors.push(`[${label}] ${error.message}`);
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!isTrackedUrl(url)) {
      return;
    }
    const reason = request.failure()?.errorText ?? "Unknown failure";
    auditState.requestFailures.push(`[${label}] ${reason} ${url}`);
    auditState.failingUrls.add(url);
  });

  page.on("response", (response) => {
    const url = response.url();
    if (!isTrackedUrl(url)) {
      return;
    }
    if (response.status() >= 400) {
      auditState.responseFailures.push(
        `[${label}] ${response.status()} ${response.statusText()} ${url}`
      );
      auditState.failingUrls.add(url);
    }
  });
}

async function writeAuditReport() {
  fs.mkdirSync(path.join(process.cwd(), "audit"), { recursive: true });

  const sections = [
    "# UI Audit",
    "",
    `- Base URL: ${baseURL}`,
    `- Timestamp: ${new Date().toISOString()}`,
    "",
    "## Steps",
    ...Array.from(auditState.steps).map((step) => `- ${step}`),
    "",
    "## Failing URLs",
    ...(auditState.failingUrls.size > 0
      ? Array.from(auditState.failingUrls).map((url) => `- ${url}`)
      : ["- None"]),
    "",
    "## Console Errors",
    ...(auditState.consoleErrors.length > 0
      ? auditState.consoleErrors.map((entry) => `- ${entry}`)
      : ["- None"]),
    "",
    "## Page Errors",
    ...(auditState.pageErrors.length > 0
      ? auditState.pageErrors.map((entry) => `- ${entry}`)
      : ["- None"]),
    "",
    "## Request Failures",
    ...(auditState.requestFailures.length > 0
      ? auditState.requestFailures.map((entry) => `- ${entry}`)
      : ["- None"]),
    "",
    "## Response Failures",
    ...(auditState.responseFailures.length > 0
      ? auditState.responseFailures.map((entry) => `- ${entry}`)
      : ["- None"]),
    "",
    "## Failure Screenshots",
    ...(auditState.screenshots.length > 0
      ? auditState.screenshots.map((entry) => `- ${entry}`)
      : ["- None"]),
    "",
  ];

  fs.writeFileSync(
    path.join(process.cwd(), "audit", "ui-audit.md"),
    sections.join("\n")
  );
}

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const safeTitle = testInfo.title.replace(/[^a-z0-9-_]+/gi, "-");
    const screenshotPath = path.join(
      screenshotDir,
      `${safeTitle}-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    auditState.screenshots.push(screenshotPath);
  }
});

test.afterAll(async () => {
  await writeAuditReport();
});

async function assertNoAuditFailures(label: string) {
  expect(
    auditState.consoleErrors.filter((entry) => entry.startsWith(`[${label}]`))
  ).toEqual([]);
  expect(
    auditState.pageErrors.filter((entry) => entry.startsWith(`[${label}]`))
  ).toEqual([]);
  expect(
    auditState.requestFailures.filter((entry) => entry.startsWith(`[${label}]`))
  ).toEqual([]);
  expect(
    auditState.responseFailures.filter((entry) => entry.startsWith(`[${label}]`))
  ).toEqual([]);
}

async function createTransfer(request: APIRequestContext, rail: string) {
  const quoteResponse = await request.get(
    `/api/quote?from=USD&to=GHS&rail=${rail}&sendAmount=250`
  );
  if (!quoteResponse.ok()) {
    auditState.responseFailures.push(
      `[transfer] ${quoteResponse.status()} ${quoteResponse.url()}`
    );
    auditState.failingUrls.add(quoteResponse.url());
    return null;
  }
  const quote = (await quoteResponse.json()) as { id?: string };
  if (!quote.id) {
    return null;
  }

  const payload: Record<string, unknown> = {
    quoteId: quote.id,
    payoutRail: rail,
    recipientName: "Audit Recipient",
    recipientCountry: "GH",
    memo: "UI audit",
  };

  if (rail === "MOBILE_MONEY") {
    payload.mobileMoney = {
      provider: "MTN",
      number: "+233240000000",
    };
  }
  if (rail === "LIGHTNING") {
    payload.crypto = {
      network: "BTC_LIGHTNING",
      amountSats: 5000,
    };
  }

  const transferResponse = await request.post("/api/transfers", {
    data: payload,
  });
  if (!transferResponse.ok()) {
    auditState.responseFailures.push(
      `[transfer] ${transferResponse.status()} ${transferResponse.url()}`
    );
    auditState.failingUrls.add(transferResponse.url());
    return null;
  }

  const transfer = (await transferResponse.json()) as { id?: string };
  return transfer.id ?? null;
}

test.describe("UI audit", () => {
  const locales = ["en", "fr"] as const;

  for (const locale of locales) {
    test(`audit ${locale}`, async ({ page, request }) => {
      const label = locale.toUpperCase();
      setupAuditListeners(page, label);

      recordStep(`Load /${locale} landing page`);
      const assetsResponse = await request.get("/api/assets");
      expect(assetsResponse.ok()).toBeTruthy();
      const assets = (await assetsResponse.json()) as Array<{ code: string }>;
      expect(assets.length).toBeGreaterThan(0);

      await page.goto(`/${locale}`);
      await expect(page.getByTestId("send-amount")).toBeVisible();
      await expect(page.locator('[class*="text-rose-"]')).toHaveCount(0);

      recordStep(`Open country selector on /${locale}`);
      const selectorButton = page.locator('button[aria-haspopup="dialog"]').first();
      await selectorButton.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('input[type="search"]')).toBeVisible();
      await page.keyboard.press("Escape");

      recordStep(`Request quotes for USD→GHS and USD→XOF (${locale})`);
      const quoteGhs = await request.get(
        "/api/quote?from=USD&to=GHS&rail=MOBILE_MONEY&sendAmount=250"
      );
      expect(quoteGhs.ok()).toBeTruthy();
      const quoteXof = await request.get(
        "/api/quote?from=USD&to=XOF&rail=MOBILE_MONEY&sendAmount=250"
      );
      expect(quoteXof.ok()).toBeTruthy();

      recordStep(`Trigger quote + recommendations on /${locale}`);
      await page.getByTestId("send-amount").fill("250");
      await page.getByTestId("send-cta").click();
      await expect(page.getByTestId("quote-section")).toBeVisible();
      await expect(page.getByTestId("recommendation-recommended")).toBeVisible();

      const recommendationLabels = await page
        .locator("[data-testid='recommendation-rail']")
        .allTextContents();
      const uniqueLabels = new Set(
        recommendationLabels.map((value) => value.trim()).filter(Boolean)
      );
      if (recommendationLabels.length >= 2) {
        expect(uniqueLabels.size).toBeGreaterThan(1);
      }

      recordStep(`Create transfers and load receipts (${locale})`);
      const routesResponse = await request.get(
        "/api/routes?from=USD&to=GHS"
      );
      expect(routesResponse.ok()).toBeTruthy();
      const routesPayload = (await routesResponse.json()) as {
        routes?: Array<{ rail: string }>;
      };
      const rails = new Set(
        (routesPayload.routes ?? []).map((route) => route.rail)
      );

      const mobileTransferId = await createTransfer(request, "MOBILE_MONEY");
      expect(mobileTransferId).not.toBeNull();
      if (mobileTransferId) {
        await page.goto(`/${locale}/transfer/${mobileTransferId}`);
        await expect(page.getByText(/Transfer receipt|Reçu de transfert/)).toBeVisible();
      }

      if (rails.has("LIGHTNING")) {
        const lightningTransferId = await createTransfer(request, "LIGHTNING");
        expect(lightningTransferId).not.toBeNull();
        if (lightningTransferId) {
          await page.goto(`/${locale}/transfer/${lightningTransferId}`);
          await expect(page.getByText(/Transfer receipt|Reçu de transfert/)).toBeVisible();
        }
      } else {
        recordStep(`Lightning not enabled for USD→GHS; skipped (${locale})`);
      }

      await assertNoAuditFailures(label);
    });
  }
});
