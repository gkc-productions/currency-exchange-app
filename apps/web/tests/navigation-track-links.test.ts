import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("marketing navbar includes locale-safe track link", () => {
  const filePath = path.join(process.cwd(), "components", "Navbar.tsx");
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("withLocale(\"/track\", locale)"), true);
  assert.equal(source.includes("label: \"Track\""), true);
});

test("marketing footer includes locale-safe track link", () => {
  const filePath = path.join(process.cwd(), "components", "Footer.tsx");
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("withLocale(\"/track\", locale)"), true);
  assert.equal(source.includes("Track transfer"), true);
});
