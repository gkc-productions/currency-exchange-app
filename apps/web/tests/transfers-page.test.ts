import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "app", "[locale]", "transfers", "page.tsx");

test("transfers page includes quick filter chips", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes('data-testid="transfers-filter-chips"'), true);
  assert.equal(source.includes("Pending"), true);
  assert.equal(source.includes("Processing"), true);
  assert.equal(source.includes("Completed"), true);
  assert.equal(source.includes("Failed"), true);
  assert.equal(source.includes("Search by recipient, reference, or destination."), true);
});

test("transfers page action label follows status model", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes("resolveUserStatusModel"), true);
  assert.equal(source.includes("status.actionLabel"), true);
});

test("transfers page includes full empty states", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes('data-testid="transfers-empty-state"'), true);
  assert.equal(source.includes('data-testid="transfers-filter-empty-state"'), true);
  assert.equal(source.includes("Start a transfer"), true);
  assert.equal(source.includes("No transfers match this filter"), true);
});

test("transfers page includes sort dropdown options", () => {
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("Newest first"), true);
  assert.equal(source.includes("Oldest first"), true);
  assert.equal(source.includes("Amount high → low"), true);
  assert.equal(source.includes("Amount low → high"), true);
});
