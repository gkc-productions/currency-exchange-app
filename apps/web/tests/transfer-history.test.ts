import test from "node:test";
import assert from "node:assert/strict";
import {
  filterAndSortTransfers,
  filterTransfers,
  resolveProviderLabel,
} from "../src/lib/transfer-history";

const sample = [
  {
    id: "1",
    referenceCode: "FX-ABC123",
    status: "READY",
    payoutRail: "BANK",
    recipientName: "Alice",
    providerPayoutProvider: null,
    createdAt: "2026-02-01T10:00:00.000Z",
  },
  {
    id: "2",
    referenceCode: "FX-DEF456",
    status: "COMPLETED",
    payoutRail: "MOBILE_MONEY",
    recipientName: "Bob",
    recipientCountry: "GH",
    providerPayoutProvider: "MockProvider",
    sendAmount: 300,
    createdAt: "2026-02-02T10:00:00.000Z",
  },
];

test("filterTransfers returns list and sorts newest first", () => {
  const result = filterTransfers(sample, "ALL", "");
  assert.equal(result.length, 2);
  assert.equal(result[0]?.id, "2");
});

test("filterTransfers filters by status", () => {
  const result = filterTransfers(sample, "READY", "");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "1");
});

test("filterTransfers matches search query", () => {
  const result = filterTransfers(sample, "ALL", "bob");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "2");
});

test("resolveProviderLabel returns fallback for missing provider", () => {
  assert.equal(resolveProviderLabel(null), "—");
  assert.equal(resolveProviderLabel("MockProvider"), "MockProvider");
});

test("search matches recipient and corridor", () => {
  const byRecipient = filterAndSortTransfers(sample, "ALL", "bob", "NEWEST");
  const byCountry = filterAndSortTransfers(sample, "ALL", "gh", "NEWEST");
  assert.equal(byRecipient.length, 1);
  assert.equal(byCountry.length, 1);
  assert.equal(byRecipient[0]?.id, "2");
  assert.equal(byCountry[0]?.id, "2");
});

test("sort supports newest and oldest ordering", () => {
  const newest = filterAndSortTransfers(sample, "ALL", "", "NEWEST");
  const oldest = filterAndSortTransfers(sample, "ALL", "", "OLDEST");
  assert.equal(newest[0]?.id, "2");
  assert.equal(oldest[0]?.id, "1");
});
