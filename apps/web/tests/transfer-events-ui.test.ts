import test from "node:test";
import assert from "node:assert/strict";
import { resolveExecutePayoutUi } from "../src/lib/transfer-events-ui";

test("execute payout button shown only when ready", () => {
  const ready = resolveExecutePayoutUi("READY", "idle");
  assert.equal(ready.showButton, true);
  assert.equal(ready.disabled, false);
  assert.equal(ready.message, null);

  const processing = resolveExecutePayoutUi("PROCESSING", "idle");
  assert.equal(processing.showButton, false);
  assert.equal(processing.message, "processing");

  const completed = resolveExecutePayoutUi("COMPLETED", "idle");
  assert.equal(completed.showButton, false);
  assert.equal(completed.message, null);
});

test("execute payout button disabled when loading or success", () => {
  const loading = resolveExecutePayoutUi("READY", "loading");
  assert.equal(loading.showButton, true);
  assert.equal(loading.disabled, true);
  assert.equal(loading.message, null);

  const success = resolveExecutePayoutUi("READY", "success");
  assert.equal(success.showButton, false);
  assert.equal(success.message, null);

  const failed = resolveExecutePayoutUi("FAILED", "idle");
  assert.equal(failed.showButton, false);
  assert.equal(failed.message, "failed");
});
