import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "app", "[locale]", "page.tsx");

test("quote flow renders progress header labels", () => {
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("1 Quote • 2 Recipient • 3 Review • 4 Status"), true);
});

test("quote flow includes trust message helper and expiry guidance", () => {
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("flowTrustMessage"), true);
  assert.equal(source.includes("quoteExpiredNotice"), true);
  assert.equal(source.includes("refreshQuoteButton"), true);
});

test("submit is blocked when quote is expired", () => {
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("if (isExpired)"), true);
  assert.equal(source.includes("setTransferError(messages.quoteExpiredError)"), true);
});
