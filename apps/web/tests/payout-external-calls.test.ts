import test from "node:test";
import assert from "node:assert/strict";
import { realExecutor } from "../src/lib/payout/executors/real";

test("real executor returns payout_disabled when external calls disabled", async () => {
  const prev = process.env.PAYOUT_EXTERNAL_CALLS;
  process.env.PAYOUT_EXTERNAL_CALLS = "0";
  try {
    const result = await realExecutor.execute({
      transferId: "t1",
      referenceCode: "FX-TEST",
      memo: "Test",
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, "PAYOUT_DISABLED");
  } finally {
    if (prev === undefined) {
      delete process.env.PAYOUT_EXTERNAL_CALLS;
    } else {
      process.env.PAYOUT_EXTERNAL_CALLS = prev;
    }
  }
});
