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

const adminEmails = (process.env.ADMIN_EMAILS ?? "").toLowerCase();
const allowAdminTests =
  RUN_INTEGRATION &&
  process.env.DEV_BYPASS_AUTH === "1" &&
  adminEmails.includes("you@example.com");

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
  const quoteRes = await fetchJson(
    `${INTEGRATION_BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=MOBILE_MONEY&sendAmount=100`
  );
  assert.equal(quoteRes.status, 200);
  const quote = quoteRes.json as { id: string };
  assert.ok(quote.id);

  const lockRes = await fetchJson(`${INTEGRATION_BASE}/api/quote/${quote.id}/lock`, {
    method: "POST",
  });
  assert.equal(lockRes.status, 200);
  return quote.id;
}

async function createTransfer() {
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
  return transferId;
}

const testIntegration = RUN_INTEGRATION ? test : test.skip;
const testAdminIntegration = allowAdminTests ? test : test.skip;

testIntegration("admin force status rejects non-admin requests", async () => {
  const transferId = await createTransfer();
  const res = await fetchJson(
    `${INTEGRATION_BASE}/api/admin/transfers/${transferId}/force-status`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) }
  );
  assert.equal(res.status, 404);
});

testAdminIntegration("force status invalid transition returns 400", async () => {
  const transferId = await createTransfer();
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "PROCESSING" },
  });

  const res = await fetchJson(
    `${INTEGRATION_BASE}/api/admin/transfers/${transferId}/force-status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...DEV_HEADERS },
      body: JSON.stringify({ status: "READY" }),
    }
  );
  assert.equal(res.status, 400);
});

testAdminIntegration("force status completed issues receipt once", async () => {
  const transferId = await createTransfer();
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "PROCESSING" },
  });

  const res = await fetchJson(
    `${INTEGRATION_BASE}/api/admin/transfers/${transferId}/force-status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...DEV_HEADERS },
      body: JSON.stringify({ status: "COMPLETED", reason: "test" }),
    }
  );
  assert.equal(res.status, 200);
  const payload = res.json as { status?: string; receiptUrl?: string | null };
  assert.equal(payload.status, "COMPLETED");

  const row = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { status: true, receiptUrl: true, receiptIssuedAt: true },
  });
  assert.equal(row?.status, "COMPLETED");
  assert.equal(typeof row?.receiptUrl, "string");
  assert.equal(row?.receiptIssuedAt instanceof Date, true);

  const events = await prisma.transferEvent.count({
    where: { transferId, type: "ADMIN_FORCE_STATUS" },
  });
  assert.equal(events, 1);

  const res2 = await fetchJson(
    `${INTEGRATION_BASE}/api/admin/transfers/${transferId}/force-status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...DEV_HEADERS },
      body: JSON.stringify({ status: "COMPLETED" }),
    }
  );
  assert.equal(res2.status, 200);
  const eventsAfter = await prisma.transferEvent.count({
    where: { transferId, type: "ADMIN_FORCE_STATUS" },
  });
  assert.equal(eventsAfter, 1);
});
