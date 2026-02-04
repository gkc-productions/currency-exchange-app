import test from "node:test";
import assert from "node:assert/strict";

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
  return { status: res.status, json };
}

const testIntegration = RUN_INTEGRATION ? test : test.skip;

testIntegration("admin payouts rejects non-admin requests", async () => {
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/payouts?limit=1`);
  assert.equal(res.status, 403);
});

const adminEmails = (process.env.ADMIN_EMAILS ?? "").toLowerCase();
const allowAdminTests =
  RUN_INTEGRATION &&
  process.env.DEV_BYPASS_AUTH === "1" &&
  adminEmails.includes("you@example.com");

const testAdminIntegration = allowAdminTests ? test : test.skip;

testAdminIntegration("admin payouts returns list shape", async () => {
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/payouts?limit=2`, {
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json));
  const items = res.json as Array<Record<string, unknown>>;
  if (items.length > 0) {
    const first = items[0] ?? {};
    assert.equal(typeof first.id, "string");
    assert.equal(typeof first.referenceCode, "string");
    assert.equal(typeof first.status, "string");
    assert.equal(typeof first.payoutRail, "string");
  }
});

testAdminIntegration("admin payouts filters by status", async () => {
  const res = await fetchJson(
    `${INTEGRATION_BASE}/api/admin/payouts?limit=2&status=COMPLETED`,
    { headers: DEV_HEADERS }
  );
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json));
});

testAdminIntegration("admin payouts CSV export returns header", async () => {
  const res = await fetch(`${INTEGRATION_BASE}/api/admin/exports/payouts.csv`, {
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 200);
  const contentType = res.headers.get("content-type") ?? "";
  assert.equal(contentType.includes("text/csv"), true);
  const text = await res.text();
  const firstLine = text.split("\n")[0] ?? "";
  assert.equal(
    firstLine.trim(),
    "transferId,referenceCode,status,providerPayoutId,providerPayoutStatus,providerPayoutProvider,completedAt"
  );
});
