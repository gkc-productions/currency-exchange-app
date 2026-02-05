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

async function createReadyTransfer() {
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

  return { transferId };
}

const testIntegration = RUN_INTEGRATION ? test : test.skip;

testIntegration("retry payout resets failed transfer", async () => {
  const { transferId } = await createReadyTransfer();
  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "FAILED",
      providerPayoutId: "payout_test",
      providerPayoutStatus: "FAILED",
      providerPayoutProvider: "mock",
      providerPayoutUpdatedAt: new Date(),
    },
  });

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/retry-payout`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      status: true,
      providerPayoutId: true,
      providerPayoutStatus: true,
      providerPayoutProvider: true,
      providerPayoutUpdatedAt: true,
    },
  });
  assert.equal(row?.status, "READY");
  assert.equal(row?.providerPayoutId, null);
  assert.equal(row?.providerPayoutStatus, null);
  assert.equal(row?.providerPayoutProvider, null);
  assert.equal(row?.providerPayoutUpdatedAt, null);
});

testIntegration("cancel payout marks processing failed", async () => {
  const { transferId } = await createReadyTransfer();
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "PROCESSING" },
  });

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/cancel-payout`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { status: true },
  });
  assert.equal(row?.status, "FAILED");

  const eventCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_CANCELED" },
  });
  assert.equal(eventCount, 1);
});

testIntegration("retry payout rejects ready transfer", async () => {
  const { transferId } = await createReadyTransfer();

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/retry-payout`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 400);
});

testIntegration("retry/cancel idempotent for completed", async () => {
  const { transferId } = await createReadyTransfer();
  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "COMPLETED",
      providerPayoutId: "payout_done",
      providerPayoutStatus: "COMPLETED",
      providerPayoutProvider: "mock",
      providerPayoutUpdatedAt: new Date(),
    },
  });

  const retryRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/retry-payout`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(retryRes.status, 200);

  const cancelRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/cancel-payout`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(cancelRes.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      status: true,
      providerPayoutId: true,
      providerPayoutStatus: true,
      providerPayoutProvider: true,
    },
  });
  assert.equal(row?.status, "COMPLETED");
  assert.equal(row?.providerPayoutId, "payout_done");
  assert.equal(row?.providerPayoutStatus, "COMPLETED");
  assert.equal(row?.providerPayoutProvider, "mock");
});
