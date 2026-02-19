import test from "node:test";
import assert from "node:assert/strict";
import { FLOW_STEPS, flowTrustMessage } from "../src/lib/flow-progress";

test("flow progress renders expected labels", () => {
  assert.deepEqual(FLOW_STEPS, ["Quote", "Recipient", "Review", "Status"]);
});

test("flow trust message maps by step", () => {
  assert.equal(flowTrustMessage(0), "See full cost before you send");
  assert.equal(flowTrustMessage(1), "You can edit details before confirming");
  assert.equal(flowTrustMessage(2, "Feb 20, 2026 10:30"), "Rate locked until Feb 20, 2026 10:30");
  assert.equal(flowTrustMessage(3), "Status updates are audit logged");
});
