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

const testIntegration = RUN_INTEGRATION ? test : test.skip;

testIntegration("crypto payout rail creates crypto payout record", async () => {
  const quoteRes = await fetchJson(
    `${INTEGRATION_BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=CRYPTO&sendAmount=100`
  );
  assert.equal(quoteRes.status, 200);
  const quote = quoteRes.json as { id: string };
  assert.ok(quote.id);

  const lockRes = await fetchJson(`${INTEGRATION_BASE}/api/quote/${quote.id}/lock`, {
    method: "POST",
  });
  assert.equal(lockRes.status, 200);

  const transferRes = await fetchJson(`${INTEGRATION_BASE}/api/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...DEV_HEADERS,
    },
    body: JSON.stringify({
      quoteId: quote.id,
      payoutRail: "CRYPTO",
      fundingMethod: "CRYPTO",
      recipientName: "Test Recipient",
      recipientCountry: "GH",
      recipientPhone: "+233201234567",
      mobileMoney: { provider: "MTN", number: "+233201234567" },
      crypto: { network: "BTC_LIGHTNING", amountSats: 1000 },
      saveRecipient: false,
    }),
  });

  assert.equal(transferRes.status, 200);
  const transfer = transferRes.json as { id?: string };
  assert.ok(transfer.id);

  const dbTransfer = await prisma.transfer.findUnique({
    where: { id: transfer.id },
    include: { cryptoPayout: true },
  });
  assert.ok(dbTransfer);
  assert.equal(dbTransfer?.payoutRail, "CRYPTO");
  assert.ok(dbTransfer?.cryptoPayout?.invoice);
  assert.equal(dbTransfer?.cryptoPayout?.network, "BTC_LIGHTNING");
});
