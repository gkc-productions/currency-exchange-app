import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("web package includes smoke scripts", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.equal(typeof packageJson.scripts?.["smoke:marketing"], "string");
  assert.equal(typeof packageJson.scripts?.["smoke:app"], "string");
});

test("web smoke:marketing script neutralizes app-only env vars", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const script = packageJson.scripts?.["smoke:marketing"] ?? "";

  assert.equal(script.includes("DATABASE_URL="), true);
  assert.equal(script.includes("AUTH_SESSION_SECRET="), true);
});
