import test from "node:test";
import assert from "node:assert/strict";
import { decideNextAction } from "../src/lib/payout/policy";

test("retryable failure returns retry when attempts below limit", () => {
  const action = decideNextAction({
    status: "FAILED",
    failureCode: "timeout",
    attempts: 1,
    provider: "MockProvider",
  });
  assert.equal(action, "RETRY_SAME_PROVIDER");
});

test("retryable failure triggers failover after max attempts for real provider", () => {
  const action = decideNextAction({
    status: "FAILED",
    failureCode: "NETWORK_ERROR",
    attempts: 3,
    provider: "RealProvider",
  });
  assert.equal(action, "FAILOVER_PROVIDER");
});

test("retryable failure stops after max attempts for mock provider", () => {
  const action = decideNextAction({
    status: "FAILED",
    failureCode: "RATE_LIMITED",
    attempts: 3,
    provider: "MockProvider",
  });
  assert.equal(action, "STOP");
});

test("failover code uses failover when available", () => {
  const action = decideNextAction({
    status: "FAILED",
    failureCode: "PROVIDER_DOWN",
    attempts: 1,
    provider: "RealProvider",
  });
  assert.equal(action, "FAILOVER_PROVIDER");
});

test("non failed status stops", () => {
  const action = decideNextAction({
    status: "COMPLETED",
    failureCode: "TIMEOUT",
    attempts: 1,
    provider: "RealProvider",
  });
  assert.equal(action, "STOP");
});
