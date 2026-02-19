import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUserStatusTimeline,
  resolveUserStatusModel,
  toUserTransferStatus,
} from "../src/lib/transfer-status-model";

test("status model maps internal statuses to four user states", () => {
  assert.equal(toUserTransferStatus("READY"), "PENDING_PAYMENT");
  assert.equal(toUserTransferStatus("PROCESSING"), "PROCESSING");
  assert.equal(toUserTransferStatus("COMPLETED"), "COMPLETED");
  assert.equal(toUserTransferStatus("FAILED"), "FAILED");
  assert.equal(toUserTransferStatus("EXPIRED"), "FAILED");
});

test("status pill copy matches user-facing labels", () => {
  assert.equal(resolveUserStatusModel("READY").label, "Pending payment");
  assert.equal(resolveUserStatusModel("PROCESSING").label, "Processing");
  assert.equal(resolveUserStatusModel("COMPLETED").label, "Completed");
  assert.equal(resolveUserStatusModel("FAILED").label, "Failed");
});

test("timeline builds four grouped steps with timestamps", () => {
  const timeline = buildUserStatusTimeline("PROCESSING", [
    { type: "CREATED", createdAt: "2026-02-19T10:00:00.000Z" },
    { type: "QUOTE_LOCKED", createdAt: "2026-02-19T10:01:00.000Z" },
    { type: "PROCESSING", createdAt: "2026-02-19T10:02:00.000Z" },
  ]);

  assert.equal(timeline.length, 4);
  assert.equal(timeline[0].label, "Pending payment");
  assert.equal(timeline[1].label, "Processing");
  assert.equal(timeline[1].isActive, true);
  assert.equal(timeline[1].timestamp, "2026-02-19T10:02:00.000Z");
});
