import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";

const BASE = process.env.TEST_BASE_URL;
const RUN_INTEGRATION = Boolean(BASE && BASE.trim());
const INTEGRATION_BASE = BASE && BASE.trim() ? BASE.trim() : "http://localhost:3000";
const DEV_HEADERS = {
  "x-dev-bypass-auth": "1",
  "x-dev-user-email": "you@example.com",
};

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

testIntegration("admin webhook list rejects non-admin", async () => {
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/webhook-events`);
  assert.ok(res.status === 401 || res.status === 403);
});

testIntegration("webhook stale timestamp rejected", async () => {
  const secret = process.env.WEBHOOK_SECRET ?? "";
  assert.ok(secret);
  const payload = {
    provider: "MockProvider",
    payoutId: "payout_test",
    transferId: "transfer_test",
    eventId: "evt_stale_test",
    status: "COMPLETED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const staleTimestamp = Math.floor((Date.now() - 6 * 60 * 1000) / 1000).toString();

  const res = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": staleTimestamp,
      "x-webhook-event-id": payload.eventId,
    },
    body: rawBody,
  });

  assert.equal(res.status, 401);
  assert.equal((res.json as { error?: string })?.error, "stale_webhook");
  assert.equal((res.json as { errorCode?: string })?.errorCode, "STALE_TIMESTAMP");
});

const replayTest = RUN_INTEGRATION ? test : test.skip;
replayTest("replay forbidden in production", async () => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/webhook-events/abc/replay`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 403);
});
