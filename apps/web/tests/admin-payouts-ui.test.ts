import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminPayoutsTable from "../app/[locale]/admin/payouts/AdminPayoutsTable";
import { getMessages } from "../src/lib/i18n/messages";

test("admin payouts table renders reconcile button for processing rows", () => {
  const html = renderToStaticMarkup(
    createElement(AdminPayoutsTable, {
      locale: "en",
      messages: getMessages("en"),
      initialPayouts: [
        {
          id: "t1",
          referenceCode: "FX-123",
          status: "PROCESSING",
          payoutRail: "BANK",
          updatedAt: new Date().toISOString(),
          receiptUrl: null,
          providerPayoutProvider: "MockProvider",
          providerPayoutStatus: "PROCESSING",
          providerPayoutId: "mock_process",
          latestPayoutEvent: null,
        },
      ],
    })
  );
  assert.equal(html.includes("Reconcile payout"), true);
});
