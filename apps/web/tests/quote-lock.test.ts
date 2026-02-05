import test, { after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";

const BASE = process.env.TEST_BASE_URL;
const RUN_INTEGRATION = Boolean(BASE && BASE.trim());
const INTEGRATION_BASE = BASE && BASE.trim() ? BASE.trim() : "http://localhost:3000";

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

testIntegration("quote expires -> lock returns QUOTE_EXPIRED", async () => {
  const quoteRes = await fetchJson(
    `${INTEGRATION_BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=MOBILE_MONEY&sendAmount=100`
  );
  assert.equal(quoteRes.status, 200);
  const quote = quoteRes.json as { id: string };
  assert.ok(quote.id);

  await prisma.quote.update({
    where: { id: quote.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });

  const lockRes = await fetchJson(`${INTEGRATION_BASE}/api/quote/${quote.id}/lock`, {
    method: "POST",
  });
  assert.equal(lockRes.status, 400);
  const payload = lockRes.json as { errorCode?: string };
  assert.equal(payload.errorCode, "QUOTE_EXPIRED");
});
