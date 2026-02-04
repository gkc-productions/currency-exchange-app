import test from "node:test";
import assert from "node:assert/strict";
import { resolveExecutePayoutUi } from "../src/lib/transfer-events-ui";

test("execute payout button shown only when ready", () => {
  const ready = resolveExecutePayoutUi("READY", "idle");
  assert.equal(ready.showButton, true);
  assert.equal(ready.disabled, false);

  const processing = resolveExecutePayoutUi("PROCESSING", "idle");
  assert.equal(processing.showButton, false);

  const completed = resolveExecutePayoutUi("COMPLETED", "idle");
  assert.equal(completed.showButton, false);
});

test("execute payout button disabled when loading or success", () => {
  const loading = resolveExecutePayoutUi("READY", "loading");
  assert.equal(loading.showButton, true);
  assert.equal(loading.disabled, true);

  const success = resolveExecutePayoutUi("READY", "success");
  assert.equal(success.showButton, false);
});
