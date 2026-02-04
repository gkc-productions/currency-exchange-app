import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
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
  return { status: res.status, json, text };
}

function signPayload(secret: string, rawBody: string) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
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

async function createProcessingTransfer() {
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
      memo: "Test",
      saveRecipient: false,
    }),
  });
  assert.equal(transferRes.status, 200);
  const transferId = (transferRes.json as { id: string }).id;
  assert.ok(transferId);

  const executeRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(executeRes.status, 200);
  const providerPayoutId = (executeRes.json as { providerPayoutId?: string }).providerPayoutId;
  assert.ok(providerPayoutId);

  return { transferId, providerPayoutId };
}

const testIntegration = RUN_INTEGRATION ? test : test.skip;

testIntegration("webhook rejects invalid signature", async () => {
  const payload = {
    provider: "MockProvider",
    payoutId: "payout_1",
    transferId: "transfer_1",
    eventId: "evt_invalid",
    status: "COMPLETED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const res = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": "deadbeef",
      "x-payout-timestamp": timestamp,
    },
    body: rawBody,
  });

  assert.equal(res.status, 401);
});

testIntegration("webhook processes completion and dedupes", async () => {
  const { transferId, providerPayoutId } = await createProcessingTransfer();
  const secret = process.env.WEBHOOK_SECRET ?? "";
  assert.ok(secret);

  const staleTimestamp = Math.floor((Date.now() - 6 * 60 * 1000) / 1000).toString();
  const payload = {
    provider: "MockProvider",
    payoutId: providerPayoutId,
    transferId,
    eventId: `evt_${transferId}`,
    status: "COMPLETED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(secret, rawBody);

  const first = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": staleTimestamp,
    },
    body: rawBody,
  });
  assert.equal(first.status, 401);

  const freshTimestamp = Math.floor(Date.now() / 1000).toString();
  const firstFresh = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": freshTimestamp,
    },
    body: rawBody,
  });
  assert.equal(firstFresh.status, 200);

  const second = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": freshTimestamp,
    },
    body: rawBody,
  });
  assert.equal(second.status, 200);

  const receiptCount = await prisma.webhookEventReceipt.count({
    where: { provider: "MockProvider", eventId: payload.eventId },
  });
  assert.equal(receiptCount, 1);
  const completedEvent = await prisma.transferEvent.findFirst({
    where: { transferId, type: "PAYOUT_COMPLETED" },
    select: { message: true },
  });
  assert.ok(completedEvent?.message.includes(`ref=${providerPayoutId}`));
});

testIntegration("webhook is idempotent for completed transfers", async () => {
  const { transferId, providerPayoutId } = await createProcessingTransfer();
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "COMPLETED" },
  });
  const secret = process.env.WEBHOOK_SECRET ?? "";
  assert.ok(secret);
  const payload = {
    provider: "MockProvider",
    payoutId: providerPayoutId,
    transferId,
    eventId: `evt_completed_${transferId}`,
    status: "COMPLETED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(secret, rawBody);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const res = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": timestamp,
    },
    body: rawBody,
  });
  assert.equal(res.status, 200);

  const eventCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_COMPLETED" },
  });
  assert.equal(eventCount, 0);
});

testIntegration("webhook upgrades failed transfer when receipt not issued", async () => {
  const { transferId, providerPayoutId } = await createProcessingTransfer();
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "FAILED", receiptUrl: null },
  });
  const secret = process.env.WEBHOOK_SECRET ?? "";
  assert.ok(secret);
  const payload = {
    provider: "MockProvider",
    payoutId: providerPayoutId,
    transferId,
    eventId: `evt_resolve_${transferId}`,
    status: "COMPLETED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(secret, rawBody);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const res = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": timestamp,
    },
    body: rawBody,
  });
  assert.equal(res.status, 200);

  const resolvedEvent = await prisma.transferEvent.findFirst({
    where: { transferId, type: "PAYOUT_RESOLVED_AFTER_FAILURE" },
    select: { message: true },
  });
  assert.ok(resolvedEvent);
  assert.ok(resolvedEvent?.message.includes(`ref=${providerPayoutId}`));
});

testIntegration("webhook completion issues receipt url", async () => {
  const { transferId, providerPayoutId } = await createProcessingTransfer();
  const secret = process.env.WEBHOOK_SECRET ?? "";
  assert.ok(secret);
  const payload = {
    provider: "MockProvider",
    payoutId: providerPayoutId,
    transferId,
    eventId: `evt_receipt_${transferId}`,
    status: "COMPLETED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(secret, rawBody);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const res = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": timestamp,
    },
    body: rawBody,
  });
  assert.equal(res.status, 200);

  const updated = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { receiptUrl: true, receiptIssuedAt: true },
  });
  assert.ok(updated?.receiptUrl);
  assert.ok(updated?.receiptIssuedAt);

  const receiptRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/receipt`, {
    headers: DEV_HEADERS,
  });
  assert.equal(receiptRes.status, 200);
  const receiptPayload = receiptRes.json as { receiptUrl?: string | null };
  assert.equal(receiptPayload.receiptUrl, updated?.receiptUrl);
});

testIntegration("webhook rejects payout mismatch", async () => {
  const { transferId } = await createProcessingTransfer();
  const secret = process.env.WEBHOOK_SECRET ?? "";
  assert.ok(secret);

  const payload = {
    provider: "MockProvider",
    payoutId: "payout_wrong",
    transferId,
    eventId: `evt_${transferId}_mismatch`,
    status: "FAILED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(secret, rawBody);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const res = await fetchJson(`${INTEGRATION_BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": timestamp,
    },
    body: rawBody,
  });
  assert.equal(res.status, 409);
});

// Schema smoke check
const smokeTest = RUN_INTEGRATION ? test : test.skip;
smokeTest("provider payout columns exist", async () => {
  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'Transfer'
      AND column_name IN ('providerPayoutId', 'providerPayoutStatus', 'providerPayoutProvider', 'providerPayoutUpdatedAt')
  `;
  const names = new Set(columns.map((column) => column.column_name));
  assert.equal(names.has("providerPayoutId"), true);
  assert.equal(names.has("providerPayoutStatus"), true);
  assert.equal(names.has("providerPayoutProvider"), true);
  assert.equal(names.has("providerPayoutUpdatedAt"), true);
});
