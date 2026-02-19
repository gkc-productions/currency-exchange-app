import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import MarketingHero from "../components/marketing/MarketingHero";
import QuoteWidget, { calculateQuotePreview } from "../components/marketing/QuoteWidget";

test("marketing hero renders with quote widget container", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MarketingHero,
      { locale: "en", title: "Fast global transfers", subtitle: "Premium clarity." },
      React.createElement("div", null, "Quote widget")
    )
  );

  assert.match(html, /marketing-hero-quote-widget/);
  assert.match(html, /Start a quote/);
  assert.match(html, /Sign in/);
});

test("marketing hero CTA links preserve locale", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MarketingHero,
      { locale: "fr", title: "Transferts rapides", subtitle: "Clair et simple." },
      React.createElement("div", null, "Widget")
    )
  );

  assert.match(html, /href="\/fr#send"/);
  assert.match(html, /href="\/fr\/login"/);
});

test("quote widget estimate updates when send amount changes", () => {
  const low = calculateQuotePreview(100, 14.2);
  const high = calculateQuotePreview(300, 14.2);

  assert.ok(high.totalFee > low.totalFee);
  assert.ok(high.recipientGets > low.recipientGets);
});

test("quote widget renders computed preview value", () => {
  const html = renderToStaticMarkup(
    React.createElement(QuoteWidget, {
      locale: "en",
      sendAmount: "250",
      fromCurrency: "USD",
      toCurrency: "GHS",
      rateLabel: "1 USD = 14.25 GHS",
      feeLabel: "$5.50",
      recipientGetsLabel: "Recipient gets",
      ctaLabel: "Get started",
      currencies: [
        { code: "USD", name: "US Dollar" },
        { code: "GHS", name: "Ghanaian Cedi" },
      ],
      recipientGetsValue: "GHS 3,500.00",
      onSendAmountChange: () => {},
      onFromCurrencyChange: () => {},
      onToCurrencyChange: () => {},
    })
  );

  assert.match(html, /Recipient gets/);
  assert.match(html, /GHS 3,500.00/);
  assert.match(html, /href="\/en\/signup"/);
});

test("marketing landing components use shared card and button primitives", () => {
  const heroPath = path.join(process.cwd(), "components", "marketing", "MarketingHero.tsx");
  const widgetPath = path.join(process.cwd(), "components", "marketing", "QuoteWidget.tsx");
  const heroSource = fs.readFileSync(heroPath, "utf8");
  const widgetSource = fs.readFileSync(widgetPath, "utf8");

  assert.equal(heroSource.includes("@/components/ui/Button"), true);
  assert.equal(widgetSource.includes("@/components/ui/Card"), true);
  assert.equal(widgetSource.includes("@/components/ui/Button"), true);
});
