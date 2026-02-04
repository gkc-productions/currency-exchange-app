import test from "node:test";
import assert from "node:assert/strict";
import { resolveReceiptUiState } from "../src/lib/receipt-ui";

test("receipt UI state for completed transfer", () => {
  const state = resolveReceiptUiState("COMPLETED", "https://example.com", "success");
  assert.equal(state.showViewLink, true);
  assert.equal(state.showGetButton, false);
  assert.equal(state.disableGetButton, true);
});

test("receipt UI state for non-completed transfer", () => {
  const state = resolveReceiptUiState("PROCESSING", null, "idle");
  assert.equal(state.showPendingText, true);
  assert.equal(state.showGetButton, false);
});
