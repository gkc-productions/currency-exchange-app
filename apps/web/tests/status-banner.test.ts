import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StatusBanner from "../components/shared/StatusBanner";

test("status banner renders when env flag is enabled", () => {
  const previous = process.env.NEXT_PUBLIC_STATUS_BANNER;
  process.env.NEXT_PUBLIC_STATUS_BANNER = "1";
  try {
    const html = renderToStaticMarkup(React.createElement(StatusBanner, { locale: "en" }));
    assert.match(html, /Service update/);
    assert.match(html, /improving reliability/);
    assert.match(html, /href="\/en\/help"/);
  } finally {
    process.env.NEXT_PUBLIC_STATUS_BANNER = previous;
  }
});

test("status banner does not render when env flag is disabled", () => {
  const previous = process.env.NEXT_PUBLIC_STATUS_BANNER;
  process.env.NEXT_PUBLIC_STATUS_BANNER = "0";
  try {
    const html = renderToStaticMarkup(React.createElement(StatusBanner, { locale: "en" }));
    assert.equal(html, "");
  } finally {
    process.env.NEXT_PUBLIC_STATUS_BANNER = previous;
  }
});

test("locale layout includes status banner", () => {
  const filePath = path.join(process.cwd(), "app", "[locale]", "layout.tsx");
  const source = fs.readFileSync(filePath, "utf8");
  assert.equal(source.includes("StatusBanner"), true);
  assert.equal(source.includes("<StatusBanner locale={locale} />"), true);
});
