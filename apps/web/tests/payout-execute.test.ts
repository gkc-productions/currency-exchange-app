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

testIntegration("execute payout transitions to processing and is idempotent", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");
  await prisma.payoutProviderState.upsert({
    where: { providerKey: "mock" },
    update: { isEnabled: true, isHealthy: true },
    create: { providerKey: "mock", isEnabled: true, isHealthy: true },
  });

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
    select: { status: true, providerPayoutId: true, payoutAttemptCount: true, payoutLastAttemptAt: true },
  });
  assert.equal(row?.status, "PROCESSING");
  assert.ok(row?.providerPayoutId);
  assert.equal(row?.payoutAttemptCount, 1);
  assert.ok(row?.payoutLastAttemptAt);
  const attempts = await prisma.payoutAttempt.findMany({
    where: { transferId },
    orderBy: { attemptNumber: "asc" },
  });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0]?.status, "SUBMITTED");

  const startedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_STARTED" },
  });
  assert.equal(startedCount, 1);
  const startedEvent = await prisma.transferEvent.findFirst({
    where: { transferId, type: "PAYOUT_STARTED" },
    select: { message: true },
  });
  assert.ok(startedEvent?.message.includes("ref="));
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
  assert.equal(startedCount, 0);
});

testIntegration("execute payout enforces cooldown", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");
  await prisma.payoutProviderState.upsert({
    where: { providerKey: "mock" },
    update: { isEnabled: true, isHealthy: true },
    create: { providerKey: "mock", isEnabled: true, isHealthy: true },
  });
  await prisma.payoutAttempt.create({
    data: {
      transferId,
      providerKey: "mock",
      attemptNumber: 1,
      status: "FAILED",
      startedAt: new Date(),
    },
  });
  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "FAILED",
      payoutAttemptCount: 1,
      payoutLastAttemptAt: new Date(),
    },
  });

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 429);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { payoutAttemptCount: true },
  });
  assert.equal(row?.payoutAttemptCount, 1);
  const attemptCount = await prisma.payoutAttempt.count({ where: { transferId } });
  assert.equal(attemptCount, 1);
});

testIntegration("execute payout retries after cooldown", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");
  await prisma.payoutProviderState.upsert({
    where: { providerKey: "mock" },
    update: { isEnabled: true, isHealthy: true },
    create: { providerKey: "mock", isEnabled: true, isHealthy: true },
  });
  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "FAILED",
      payoutAttemptCount: 1,
      payoutLastAttemptAt: new Date(Date.now() - 60_000),
    },
  });

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { payoutAttemptCount: true, status: true },
  });
  assert.equal(row?.payoutAttemptCount, 2);
  assert.equal(row?.status, "PROCESSING");
  const attemptCount = await prisma.payoutAttempt.count({ where: { transferId } });
  assert.equal(attemptCount, 1);
});

const allowFailover = RUN_INTEGRATION &&
  (process.env.PAYOUT_PROVIDERS ?? "").split(",").filter(Boolean).length > 1;
const testFailover = allowFailover ? test : test.skip;

testFailover("execute payout failover after max attempts", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");
  await prisma.payoutProviderState.upsert({
    where: { providerKey: "mock" },
    update: { isEnabled: true, isHealthy: false },
    create: { providerKey: "mock", isEnabled: true, isHealthy: false },
  });
  await prisma.payoutProviderState.upsert({
    where: { providerKey: "real" },
    update: { isEnabled: true, isHealthy: true },
    create: { providerKey: "real", isEnabled: true, isHealthy: true },
  });
  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "FAILED",
      payoutAttemptCount: 3,
      payoutProviderCursor: 0,
      payoutLastAttemptAt: new Date(Date.now() - 60_000),
    },
  });

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { payoutProviderCursor: true },
  });
  assert.equal(row?.payoutProviderCursor, 1);
});

testFailover("execute payout exhausted returns 409", async () => {
  const { transferId } = await createReadyTransfer("Test", "A");
  await prisma.payoutProviderState.upsert({
    where: { providerKey: "mock" },
    update: { isEnabled: false, isHealthy: false },
    create: { providerKey: "mock", isEnabled: false, isHealthy: false },
  });
  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "FAILED",
      payoutAttemptCount: 3,
      payoutProviderCursor: 1,
      payoutLastAttemptAt: new Date(Date.now() - 60_000),
    },
  });

  const res = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 409);
});
testIntegration("execute payout still starts when memo requests failure", async () => {
  const { transferId } = await createReadyTransfer("FAIL", "A");
  await prisma.payoutProviderState.upsert({
    where: { providerKey: "mock" },
    update: { isEnabled: true, isHealthy: true },
    create: { providerKey: "mock", isEnabled: true, isHealthy: true },
  });

  const first = await fetchJson(`${INTEGRATION_BASE}/api/transfers/${transferId}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(first.status, 200);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { status: true, providerPayoutId: true },
  });
  assert.equal(row?.status, "FAILED");
  assert.ok(row?.providerPayoutId);
  const attempt = await prisma.payoutAttempt.findFirst({
    where: { transferId },
    orderBy: { attemptNumber: "desc" },
  });
  assert.equal(attempt?.status, "FAILED");

  const startedCount = await prisma.transferEvent.count({
    where: { transferId, type: "PAYOUT_STARTED" },
  });
  assert.equal(startedCount, 1);
  const startedEvent = await prisma.transferEvent.findFirst({
    where: { transferId, type: "PAYOUT_STARTED" },
    select: { message: true },
  });
  assert.ok(startedEvent?.message.includes("ref="));
  assert.ok(startedEvent?.message.includes("code="));
  assert.ok(startedEvent?.message.includes("message="));
});

testIntegration("execute payout returns processing on retry", async () => {
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
  assert.equal(startedCount, 1);
});
