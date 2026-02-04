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

async function normalizeReferenceCode(transferId: string, suffix: string) {
  const code = `FX-TST-${transferId.slice(0, 8).toUpperCase()}${suffix}`;
  await prisma.transfer.update({
    where: { id: transferId },
    data: { referenceCode: code },
  });
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
    await normalizeReferenceCode(transferId, referenceSuffix);
  }

  return { transferId };
}

const testIntegration = RUN_INTEGRATION ? test : test.skip;

testIntegration("execute payout completes and is idempotent", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");

  const first = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(first.status, 200);

  const second = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(second.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { status: true },
  });
  assert.equal(row?.status, "COMPLETED");

  const startedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_STARTED" },
  });
  const completedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_COMPLETED" },
  });
  assert.equal(startedCount, 1);
  assert.equal(completedCount, 1);
});

testIntegration("execute payout rejects non-ready", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");

  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "PROCESSING" },
  });

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 400);

  const startedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_STARTED" },
  });
  const completedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_COMPLETED" },
  });
  assert.equal(startedCount, 0);
  assert.equal(completedCount, 0);
});

testIntegration("execute payout fails when memo requests failure and is idempotent", async () => {
  const { transferId } = await createReadyTransfer("FAIL", "A");

  const first = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(first.status, 200);

  const second = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(second.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { status: true },
  });
  assert.equal(row?.status, "FAILED");

  const startedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_STARTED" },
  });
  const failedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_FAILED" },
  });
  const completedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_COMPLETED" },
  });
  assert.equal(startedCount, 1);
  assert.equal(failedCount, 1);
  assert.equal(completedCount, 0);
});

testIntegration("concurrent execute payout", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");

  const [a, b] = await Promise.all([
    fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
      method: "POST",
      headers: DEV_HEADERS,
    }),
    fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
      method: "POST",
      headers: DEV_HEADERS,
    }),
  ]);

  assert.equal(a.status, 200);
  assert.equal(b.status, 200);

  const startedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_STARTED" },
  });
  const completedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_COMPLETED" },
  });
  assert.equal(startedCount, 1);
  assert.equal(completedCount, 1);
});
