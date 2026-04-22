import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("root layout wires class-based dark mode provider and body classes", () => {
  const layoutPath = path.join(process.cwd(), "app", "layout.tsx");
  const source = fs.readFileSync(layoutPath, "utf8");

  assert.equal(source.includes("suppressHydrationWarning"), true);
  assert.equal(source.includes("<Providers>"), true);
  assert.equal(source.includes('min-h-screen bg-white text-neutral-900'), true);
  assert.equal(source.includes("dark:bg-neutral-950 dark:text-neutral-100"), true);
});
