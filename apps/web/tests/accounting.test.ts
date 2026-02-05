import test from "node:test";
import assert from "node:assert/strict";
import { computeAccountingCheck } from "../src/lib/accounting";

test("computeAccountingCheck flags mismatches", () => {
  const snapshot = {
    sendAmount: 100,
    fixedFee: 1,
    percentFee: 2,
    totalFees: 3.5,
    recipientGets: 190,
    marketRate: 2,
    appliedRate: 2,
    fxMarginPct: 1,
    fromAsset: "USD",
    toAsset: "GHS",
  };
  const result = computeAccountingCheck(snapshot, 0.01);
  assert.equal(result.feeMismatch, true);
  assert.equal(result.payoutMismatch, true);
});

test("computeAccountingCheck accepts expected math within tolerance", () => {
  const snapshot = {
    sendAmount: 100,
    fixedFee: 1,
    percentFee: 2,
    totalFees: 3,
    recipientGets: 194,
    marketRate: 2,
    appliedRate: 2,
    fxMarginPct: 1,
    fromAsset: "USD",
    toAsset: "GHS",
  };
  const result = computeAccountingCheck(snapshot, 0.01);
  assert.equal(result.feeMismatch, false);
  assert.equal(result.payoutMismatch, false);
});
