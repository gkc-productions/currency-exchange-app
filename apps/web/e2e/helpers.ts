import { expect, type Page, type TestInfo } from "@playwright/test";

const severeMap = new WeakMap<Page, string[]>();

function isIgnorableConsoleMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("favicon.ico") ||
    normalized.includes("failed to load resource: the server responded with a status of 404")
  );
}

export function trackSevereErrors(page: Page) {
  const errors: string[] = [];
  severeMap.set(page, errors);

  page.on("pageerror", (error) => {
    errors.push(`pageerror:${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    const text = message.text();
    if (isIgnorableConsoleMessage(text)) {
      return;
    }
    errors.push(`console:${text}`);
  });
}

export async function assertNoSevereErrors(page: Page, testInfo: TestInfo) {
  const errors = severeMap.get(page) ?? [];
  if (errors.length === 0) {
    return;
  }
  await testInfo.attach("severe-js-errors", {
    body: errors.join("\n"),
    contentType: "text/plain",
  });
  expect(errors, "Severe JavaScript errors detected").toEqual([]);
}

export function authHeaders(baseURL: string) {
  void baseURL;
  return {
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
  };
}
