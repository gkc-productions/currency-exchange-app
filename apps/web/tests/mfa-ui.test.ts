import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MfaSettingsCard from "../app/[locale]/(app)/_components/MfaSettingsCard";

test("mfa settings card renders enable action", () => {
  const html = renderToStaticMarkup(createElement(MfaSettingsCard, { mfaEnabled: false }));
  assert.equal(html.includes("Two-step verification"), true);
  assert.equal(html.includes("Enable"), true);
});

test("login verify page includes resend cooldown and back-to-login controls", () => {
  const source = readFileSync(
    path.join(process.cwd(), "app/[locale]/(app)/(auth)/login/verify/page.tsx"),
    "utf8",
  );

  assert.equal(source.includes("You can request a new code in"), true);
  assert.equal(source.includes("Back to sign in"), true);
  assert.equal(source.includes("cooldownSeconds > 0"), true);
});
