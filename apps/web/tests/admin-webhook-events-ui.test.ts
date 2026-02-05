import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminWebhookEventsTable, {
  copyToClipboard,
} from "../app/[locale]/admin/webhook-events/AdminWebhookEventsTable";
import { getMessages } from "../src/lib/i18n/messages";

test("admin webhook events details render when expanded", () => {
  const html = renderToStaticMarkup(
    createElement(AdminWebhookEventsTable, {
      locale: "en",
      messages: getMessages("en"),
      disableFetch: true,
      initialExpandedId: "evt_1",
      initialRows: [
        {
          id: "evt_1",
          provider: "mock",
          eventId: "event_123",
          transferId: "tr_1",
          kind: "PAYOUT",
          receivedAt: new Date().toISOString(),
          signatureTimestamp: null,
          isDeduped: false,
          processingResult: "accepted",
          rawPayload: { hash: "abc123", size: 6 },
        },
      ],
    })
  );
  assert.equal(html.includes("event_123"), true);
  assert.equal(html.includes("abc123"), true);
  assert.equal(html.includes("Details"), true);
});

test("copyToClipboard uses navigator clipboard", async () => {
  let copied = "";
  // @ts-expect-error test mock
  global.navigator = {
    clipboard: {
      writeText: async (value: string) => {
        copied = value;
      },
    },
  };
  const success = await copyToClipboard("value_123");
  assert.equal(success, true);
  assert.equal(copied, "value_123");
});
