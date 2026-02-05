import test from "node:test";
import assert from "node:assert/strict";
import { getVersionInfo } from "../src/lib/version";

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const original = { ...process.env };
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
  try {
    fn();
  } finally {
    process.env = original;
  }
}

test("version info reflects dev bypass gate", () => {
  withEnv({ NODE_ENV: "production", DEV_BYPASS_AUTH: "1" }, () => {
    const info = getVersionInfo();
    assert.equal(info.devBypassEnabled, false);
  });

  withEnv({ NODE_ENV: "development", DEV_BYPASS_AUTH: "1" }, () => {
    const info = getVersionInfo();
    assert.equal(info.devBypassEnabled, true);
  });
});

test("version info includes base url fallback", () => {
  withEnv({ APP_BASE_URL: "https://app.example.com", NEXTAUTH_URL: undefined }, () => {
    const info = getVersionInfo();
    assert.equal(info.appBaseUrl, "https://app.example.com");
  });
});
