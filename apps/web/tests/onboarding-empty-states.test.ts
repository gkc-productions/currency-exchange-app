import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FirstTransferChecklist from "../app/[locale]/(app)/_components/FirstTransferChecklist";

test("transfers empty state renders CTA and help link", () => {
  const filePath = path.join(process.cwd(), "app", "[locale]", "transfers", "page.tsx");
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes('data-testid="transfers-empty-state"'), true);
  assert.equal(source.includes("Start transfer"), true);
  assert.equal(source.includes("/help"), true);
});

test("recipients empty state renders CTA and help link", () => {
  const filePath = path.join(process.cwd(), "app", "[locale]", "recipients", "page.tsx");
  const source = fs.readFileSync(filePath, "utf8");

  assert.equal(source.includes('data-testid="recipients-empty-state"'), true);
  assert.equal(source.includes("Create transfer"), true);
  assert.equal(source.includes("/help"), true);
});

test("onboarding checklist renders when transfers or recipients are missing", () => {
  const html = renderToStaticMarkup(
    React.createElement(FirstTransferChecklist, {
      locale: "en",
      hasTransfers: false,
      hasRecipients: false,
    })
  );

  assert.match(html, /First transfer checklist/);
  assert.match(html, /Create a transfer/);
  assert.match(html, /href="\/en"/);
  assert.match(html, /href="\/en\/help"/);
});

test("onboarding checklist hides when transfers and recipients both exist", () => {
  const html = renderToStaticMarkup(
    React.createElement(FirstTransferChecklist, {
      locale: "en",
      hasTransfers: true,
      hasRecipients: true,
    })
  );

  assert.equal(html, "");
});
