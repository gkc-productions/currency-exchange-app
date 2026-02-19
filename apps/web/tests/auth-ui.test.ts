import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AuthShell from "../app/[locale]/(app)/_components/AuthShell";
import PasswordRulesPanel from "../app/[locale]/(app)/_components/PasswordRulesPanel";

test("signup password rules panel renders expected policy list", () => {
  const html = renderToStaticMarkup(
    React.createElement(PasswordRulesPanel, {
      password: "short",
      email: "user@example.com",
    })
  );

  assert.match(html, /Password rules/);
  assert.match(html, /10\+ characters/);
  assert.match(html, /uppercase letter/);
  assert.match(html, /lowercase letter/);
  assert.match(html, /at least one number/);
  assert.match(html, /at least one symbol/);
  assert.match(html, /common passwords/);
});

test("password rule indicators change with stronger password", () => {
  const weak = renderToStaticMarkup(
    React.createElement(PasswordRulesPanel, {
      password: "short",
      email: "user@example.com",
    })
  );
  const strong = renderToStaticMarkup(
    React.createElement(PasswordRulesPanel, {
      password: "Password123!",
      email: "user@example.com",
    })
  );

  const weakPassCount = (weak.match(/data-status="pass"/g) ?? []).length;
  const strongPassCount = (strong.match(/data-status="pass"/g) ?? []).length;
  assert.equal(weakPassCount < strongPassCount, true);
});

test("auth shell locale links are correct", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      AuthShell,
      {
        locale: "fr",
        title: "Connexion",
        subtitle: "Subtitle",
      },
      React.createElement("div", null, "content")
    )
  );

  assert.match(html, /href="\/fr"/);
  assert.match(html, /href="\/fr\/help"/);
  assert.match(html, /href="\/fr\/security"/);
  assert.match(html, /Optional 2-step verification/);
});

test("signup page blocks submit for weak passwords and shows guidance", () => {
  const filePath = path.join(
    process.cwd(),
    "app",
    "[locale]",
    "(app)",
    "(auth)",
    "signup",
    "page.tsx"
  );
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes("isWeakPassword"), true);
  assert.equal(source.includes("disabled={isSubmitting || isWeakPassword}"), true);
  assert.equal(source.includes("Follow the checklist above"), true);
});

test("auth UI components are not imported by marketing components", () => {
  const marketingDir = path.join(process.cwd(), "components", "marketing");
  if (!fs.existsSync(marketingDir)) {
    assert.ok(true);
    return;
  }

  const files = fs.readdirSync(marketingDir).filter((file) => file.endsWith(".tsx"));
  for (const file of files) {
    const source = fs.readFileSync(path.join(marketingDir, file), "utf8");
    assert.equal(source.includes("(app)/_components/Auth"), false);
  }
});
