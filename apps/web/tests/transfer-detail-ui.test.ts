import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "app",
  "[locale]",
  "transfer",
  "[id]",
  "page.tsx"
);

test("transfer detail page includes premium section layout", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes('data-testid="transfer-detail-header"'), true);
  assert.equal(source.includes('data-testid="transfer-detail-what-next"'), true);
  assert.equal(source.includes('data-testid="transfer-detail-timeline"'), true);
  assert.equal(source.includes('data-testid="transfer-detail-receipt"'), true);
  assert.equal(source.includes('data-testid="transfer-detail-support"'), true);
});

test("transfer detail receipt panel exposes download and copy reference actions", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes("Download receipt"), true);
  assert.equal(source.includes("Copy reference"), true);
});

test("transfer detail page does not import marketing components", () => {
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("@/components/marketing"), false);
});
