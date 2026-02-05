import test from "node:test";
import assert from "node:assert/strict";
import { getReadOnlyResponse } from "../src/lib/security";

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

test("read-only blocks write methods", () => {
  withEnv({ APP_READ_ONLY: "1", NODE_ENV: "production" }, () => {
    const req = new Request("http://localhost/api/transfers/123", { method: "POST" });
    const res = getReadOnlyResponse(req);
    assert.ok(res);
    assert.equal(res?.status, 503);
  });
});

test("read-only allows GET", () => {
  withEnv({ APP_READ_ONLY: "1", NODE_ENV: "production" }, () => {
    const req = new Request("http://localhost/api/transfers/123", { method: "GET" });
    const res = getReadOnlyResponse(req);
    assert.equal(res, null);
  });
});

test("admin override allowed only in non-production", () => {
  withEnv({ APP_READ_ONLY: "1", NODE_ENV: "development" }, () => {
    const req = new Request("http://localhost/api/transfers/123", { method: "POST" });
    const res = getReadOnlyResponse(req, { isAdmin: true });
    assert.equal(res, null);
  });

  withEnv({ APP_READ_ONLY: "1", NODE_ENV: "production" }, () => {
    const req = new Request("http://localhost/api/transfers/123", { method: "POST" });
    const res = getReadOnlyResponse(req, { isAdmin: true });
    assert.ok(res);
    assert.equal(res?.status, 503);
  });
});
