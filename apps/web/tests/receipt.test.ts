import test, { after } from "node:test";
import assert from "node:assert/strict";
import { getPrisma } from "../scripts/prismaClient";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const DEV_HEADERS = {
  "x-dev-bypass-auth": "1",
  "x-dev-user-email": "you@example.com",
};

const prisma = getPrisma();

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

async function createCompletedTransfer() {
  const quoteRes = await fetchJson(
    `${BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=MOBILE_MONEY&sendAmount=100`
  );
  assert.equal(quoteRes.status, 200);
  const quoteId = (quoteRes.json as { id: string }).id;
  assert.ok(quoteId);

  const lockRes = await fetchJson(`${BASE}/api/quote/${quoteId}/lock`, {
    method: "POST",
  });
  assert.equal(lockRes.status, 200);

  const transferRes = await fetchJson(`${BASE}/api/transfers`, {
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

  const completeRes = await fetchJson(`${BASE}/api/transfers/${transferId}/complete`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(completeRes.status, 200);

  return { transferId };
}

async function createReadyTransfer() {
  const quoteRes = await fetchJson(
    `${BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=MOBILE_MONEY&sendAmount=100`
  );
  assert.equal(quoteRes.status, 200);
  const quoteId = (quoteRes.json as { id: string }).id;
  assert.ok(quoteId);

  const lockRes = await fetchJson(`${BASE}/api/quote/${quoteId}/lock`, {
    method: "POST",
  });
  assert.equal(lockRes.status, 200);

  const transferRes = await fetchJson(`${BASE}/api/transfers`, {
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

test("POST receipt persists once", async () => {
  const { transferId } = await createCompletedTransfer();

  const before = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { receiptUrl: true, receiptIssuedAt: true },
  });
  assert.equal(before?.receiptUrl ?? null, null);
  assert.equal(before?.receiptIssuedAt ?? null, null);

  const first = await fetchJson(`${BASE}/api/transfers/${transferId}/receipt`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(first.status, 200);
  const firstUrl = (first.json as { receiptUrl: string }).receiptUrl;
  assert.ok(firstUrl);

  const afterFirst = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { receiptUrl: true, receiptIssuedAt: true, receiptSendCount: true, receiptLastSentAt: true },
  });
  assert.equal(afterFirst?.receiptUrl, firstUrl);
  assert.ok(afterFirst?.receiptIssuedAt);

  const sendCountFirst = afterFirst?.receiptSendCount ?? 0;
  const lastSentFirst = afterFirst?.receiptLastSentAt?.toISOString() ?? null;

  const second = await fetchJson(`${BASE}/api/transfers/${transferId}/receipt`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(second.status, 200);
  const secondUrl = (second.json as { receiptUrl: string }).receiptUrl;
  assert.equal(secondUrl, firstUrl);

  const afterSecond = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { receiptUrl: true, receiptIssuedAt: true, receiptSendCount: true, receiptLastSentAt: true },
  });
  assert.equal(afterSecond?.receiptUrl, firstUrl);
  assert.equal(afterSecond?.receiptIssuedAt?.toISOString(), afterFirst?.receiptIssuedAt?.toISOString());
  assert.equal(afterSecond?.receiptSendCount ?? 0, sendCountFirst);
  assert.equal(afterSecond?.receiptLastSentAt?.toISOString() ?? null, lastSentFirst);
});

test("POST receipt rejected pre-completion", async () => {
  const { transferId } = await createReadyTransfer();

  const res = await fetchJson(`${BASE}/api/transfers/${transferId}/receipt`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  assert.equal(res.status, 400);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { receiptUrl: true, receiptIssuedAt: true },
  });
  assert.equal(row?.receiptUrl ?? null, null);
  assert.equal(row?.receiptIssuedAt ?? null, null);
});

test("Concurrent POST receipt", async () => {
  const { transferId } = await createCompletedTransfer();

  const [a, b] = await Promise.all([
    fetchJson(`${BASE}/api/transfers/${transferId}/receipt`, {
      method: "POST",
      headers: DEV_HEADERS,
    }),
    fetchJson(`${BASE}/api/transfers/${transferId}/receipt`, {
      method: "POST",
      headers: DEV_HEADERS,
    }),
  ]);

  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  const urlA = (a.json as { receiptUrl: string }).receiptUrl;
  const urlB = (b.json as { receiptUrl: string }).receiptUrl;
  assert.equal(urlA, urlB);

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { receiptUrl: true, receiptIssuedAt: true },
  });
  assert.equal(row?.receiptUrl, urlA);
  assert.ok(row?.receiptIssuedAt);
});
