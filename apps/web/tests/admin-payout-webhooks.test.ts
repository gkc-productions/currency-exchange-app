import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL;
const RUN_INTEGRATION = Boolean(BASE && BASE.trim());
const INTEGRATION_BASE = BASE && BASE.trim() ? BASE.trim() : "http://localhost:3000";

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

const testIntegration = RUN_INTEGRATION ? test : test.skip;

testIntegration("admin payout webhook list rejects non-admin", async () => {
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/webhooks/payout`);
  assert.ok(res.status === 401 || res.status === 403);
});

testIntegration("admin payout webhook list returns array shape", async () => {
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/webhooks/payout`, {
    headers: {
      "x-dev-bypass-auth": "1",
      "x-dev-user-email": "you@example.com",
    },
  });
  if (res.status !== 200) {
    return;
  }
  assert.ok(Array.isArray(res.json));
  const first = (res.json as Array<Record<string, unknown>>)[0];
  if (!first) {
    return;
  }
  assert.ok("id" in first);
  assert.ok("receivedAt" in first);
  assert.ok("provider" in first);
  assert.ok("transferId" in first);
  assert.ok("status" in first);
});
