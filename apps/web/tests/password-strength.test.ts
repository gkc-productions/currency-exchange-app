import test from "node:test";
import assert from "node:assert/strict";
import { checkPasswordRules, passwordStrength } from "../src/lib/password-strength";

test("password rules validate all policy checks", () => {
  const rules = checkPasswordRules("Password123!", "user@example.com");
  assert.equal(rules.lengthOk, true);
  assert.equal(rules.hasLetter, true);
  assert.equal(rules.hasNumber, true);
  assert.equal(rules.notCommon, true);
  assert.equal(rules.notEmailPart, true);
});

test("password rules fail for common and email-local-part passwords", () => {
  const rules = checkPasswordRules("password", "pass@example.com");
  assert.equal(rules.notCommon, false);
  assert.equal(rules.notEmailPart, false);
});

test("password strength labels change by complexity", () => {
  assert.equal(passwordStrength("short").label, "Weak");
  assert.equal(passwordStrength("Password10").label, "Strong");
  assert.equal(passwordStrength("Password10!").label, "Strong");
});
