import test from "node:test";
import assert from "node:assert/strict";
import { safeError } from "../src/lib/observability";

test("safeError formats Error objects", () => {
  const err = new Error("Boom");
  const payload = safeError(err);
  assert.equal(payload.message, "Boom");
  assert.equal(typeof payload.stack, "string");
});
