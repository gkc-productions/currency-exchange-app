import test, { after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";

const BASE = process.env.TEST_BASE_URL;
const RUN_INTEGRATION = Boolean(BASE && BASE.trim());
const INTEGRATION_BASE = BASE && BASE.trim() ? BASE.trim() : "http://localhost:3000";
const DEV_HEADERS = {
  "x-dev-bypass-auth": "1",
  "x-dev-user-email": "you@example.com",
};

let cachedQuoteId: string | null = null;
let cachedQuoteExpiresAt = 0;

after(async () => {
  await prisma.$disconnect();
});

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

async function getLockedQuoteId() {
  const now = Date.now();
  if (cachedQuoteId && cachedQuoteExpiresAt > now + 5000) {
    return cachedQuoteId;
  }

  const quoteRes = await fetchJson(
    `${INTEGRATION_BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=MOBILE_MONEY&sendAmount=100`
  );
  assert.equal(quoteRes.status, 200);
  const quote = quoteRes.json as { id: string; expiresAt: string };
  assert.ok(quote.id);
  cachedQuoteId = quote.id;
  cachedQuoteExpiresAt = new Date(quote.expiresAt).getTime();

  const lockRes = await fetchJson(`${INTEGRATION_BASE}/api/quote/${quote.id}/lock`, {
    method: "POST",
  });
  assert.equal(lockRes.status, 200);

  return cachedQuoteId;
}

async function createReadyTransfer(memo?: string, referenceSuffix?: string) {
  const quoteId = await getLockedQuoteId();

  const transferRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...DEV_HEADERS,
    },
    body: JSON.stringify({
      quoteId,
      payoutRail: "MOBILE_MONEY",
      recipientName: "Test Recipient",
      recipientCountry: "GH",
      recipientPhone: "+233201234567",
      mobileMoney: { provider: "MTN", number: "+233201234567" },
      memo: memo ?? "Test",
      saveRecipient: false,
    }),
  });
  assert.equal(transferRes.status, 200);
  const transferId = (transferRes.json as { id: string }).id;
  assert.ok(transferId);

  if (referenceSuffix) {
    const code = `FX-TST-${transferId.slice(0, 8).toUpperCase()}${referenceSuffix}`;
    await prisma.transfer.update({
      where: { id: transferId },
      data: { referenceCode: code },
    });
  }

  return { transferId };
}

const testIntegration = RUN_INTEGRATION ? test : test.skip;

testIntegration("transfer events include payout completion after webhook", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");

  const executeRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(executeRes.status, 200);
  const providerPayoutId = (executeRes.json as { providerPayoutId?: string }).providerPayoutId;
  assert.ok(providerPayoutId);

  const webhookRes = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: `evt_${transferId}`,
      provider: "MockProvider",
      providerPayoutId,
      status: "COMPLETED",
    }),
  });
  assert.equal(webhookRes.status, 200);

  const eventsRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/events`, {
    headers: DEV_HEADERS,
  });
  assert.equal(eventsRes.status, 200);

  const events = eventsRes.json as Array<{ type: string }>;
  const types = new Set(events.map((event) => event.type));
  assert.equal(types.has("PAYOUT_STARTED"), true);
  assert.equal(types.has("PAYOUT_COMPLETED"), true);
});

testIntegration("transfer events include payout failure after webhook", async () => {
  const { transferId } = await createReadyTransfer("FAIL", "A");

  const executeRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(executeRes.status, 200);
  const providerPayoutId = (executeRes.json as { providerPayoutId?: string }).providerPayoutId;
  assert.ok(providerPayoutId);

  const webhookRes = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: `evt_${transferId}_failed`,
      provider: "MockProvider",
      providerPayoutId,
      status: "FAILED",
    }),
  });
  assert.equal(webhookRes.status, 200);

  const eventsRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/events`, {
    headers: DEV_HEADERS,
  });
  assert.equal(eventsRes.status, 200);

  const events = eventsRes.json as Array<{ type: string }>;
  const types = new Set(events.map((event) => event.type));
  assert.equal(types.has("PAYOUT_STARTED"), true);
  assert.equal(types.has("PAYOUT_FAILED"), true);
});
