import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "app", "[locale]", "track", "page.tsx");

test("track page renders input and call to action", () => {
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes('data-testid="track-transfer-form"'), true);
  assert.equal(source.includes("Reference / Transfer ID"), true);
  assert.equal(source.includes("Track transfer"), true);
});

test("track page routes unauthenticated users to login with next param", () => {
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("withLocale(\"/login\", locale)}?next="), true);
  assert.equal(source.includes("encodeURIComponent(nextPath)"), true);
  assert.equal(source.includes("status === \"authenticated\""), true);
});
