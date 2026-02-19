import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "app", "[locale]", "transfers", "page.tsx");

test("transfers page includes status pill and view action", () => {
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes("statusClasses"), true);
  assert.equal(source.includes("<Badge className={statusClasses"), true);
  assert.equal(source.includes("variant=\"secondary\""), true);
  assert.equal(source.includes("View"), true);
});
