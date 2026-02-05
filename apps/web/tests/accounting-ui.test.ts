import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AccountingPanel from "../src/lib/accounting-ui";
import { getMessages } from "../src/lib/i18n/messages";

test("AccountingPanel renders mismatch warnings", () => {
  const html = renderToStaticMarkup(
    createElement(AccountingPanel, {
      locale: "en",
      messages: getMessages("en"),
      snapshot: {
        sendAmount: 100,
        fixedFee: 1,
        percentFee: 2,
        totalFees: 3.5,
        recipientGets: 190,
        marketRate: 2,
        appliedRate: 2,
        fxMarginPct: 1,
        fromAsset: "USD",
        toAsset: "GHS",
      },
    })
  );
  assert.equal(html.includes("Fee mismatch"), true);
  assert.equal(html.includes("Payout mismatch"), true);
});
