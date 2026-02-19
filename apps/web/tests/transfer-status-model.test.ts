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
  assert.equal(resolveUserStatusModel("READY").substatus, "Waiting for payment");
  assert.equal(resolveUserStatusModel("READY").actionLabel, "Finish payment");

  assert.equal(resolveUserStatusModel("PROCESSING").label, "Processing");
  assert.equal(resolveUserStatusModel("PROCESSING", "QUEUED").substatus, "Queued");
  assert.equal(resolveUserStatusModel("PROCESSING", "SENDING").substatus, "Sending");
  assert.equal(
    resolveUserStatusModel("PROCESSING", "CONFIRMING").substatus,
    "Confirming delivery"
  );
  assert.equal(resolveUserStatusModel("PROCESSING").actionLabel, "Track transfer");

  assert.equal(resolveUserStatusModel("COMPLETED").label, "Completed");
  assert.equal(resolveUserStatusModel("COMPLETED").substatus, "Delivered");
  assert.equal(resolveUserStatusModel("COMPLETED").actionLabel, "View receipt");

  assert.equal(resolveUserStatusModel("FAILED").label, "Failed");
  assert.equal(resolveUserStatusModel("FAILED").substatus, "Action required");
  assert.equal(resolveUserStatusModel("FAILED").actionLabel, "Fix issue");
});

test("status model returns what happens next copy", () => {
  assert.match(resolveUserStatusModel("READY").nextStep, /Complete payment/);
  assert.match(resolveUserStatusModel("PROCESSING").nextStep, /Tracking updates/);
  assert.match(resolveUserStatusModel("COMPLETED").nextStep, /receipt/i);
  assert.match(resolveUserStatusModel("FAILED").nextStep, /attention/i);
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
