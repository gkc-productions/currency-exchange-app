import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";

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

testIntegration("admin payout provider endpoints require auth", async () => {
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/payout-providers`);
  assert.equal(res.status, 403);
});

testIntegration("admin payout provider dev bypass works", async () => {
  const res = await fetchJson(`${INTEGRATION_BASE}/api/admin/payout-providers`, {
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json));
});

testIntegration("provider health flips on execution", async () => {
  const providerKey = "mock";
  await prisma.payoutProviderState.upsert({
    where: { providerKey },
    update: { isEnabled: true, isHealthy: true },
    create: { providerKey, isEnabled: true, isHealthy: true },
  });

  const quoteRes = await fetchJson(
    `${INTEGRATION_BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=MOBILE_MONEY&sendAmount=100`
  );
  const quoteId = (quoteRes.json as { id: string }).id;
  await fetchJson(`${INTEGRATION_BASE}/api/quote/${quoteId}/lock`, { method: "POST" });

  const transferRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...DEV_HEADERS },
    body: JSON.stringify({
      quoteId,
      payoutRail: "MOBILE_MONEY",
      recipientName: "Test Recipient",
      recipientCountry: "GH",
      recipientPhone: "+233201234567",
      mobileMoney: { provider: "MTN", number: "+233201234567" },
      memo: "FAIL",
      saveRecipient: false,
    }),
  });
  const transferId = (transferRes.json as { id: string }).id;

  await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });

  const state = await prisma.payoutProviderState.findUnique({
    where: { providerKey },
    select: { isHealthy: true, lastErrorCode: true },
  });
  assert.equal(state?.isHealthy, false);
  assert.ok(state?.lastErrorCode);
});
