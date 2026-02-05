import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseTimelineMessage } from "../src/lib/transfer-events-ui";
import { getMessages } from "../src/lib/i18n/messages";

test("parseTimelineMessage extracts ref, reason, message", () => {
  const parsed = parseTimelineMessage(
    "Payout failed ref=abc123 code=E_FAIL message=Network error"
  );
  assert.equal(parsed.ref, "abc123");
  assert.equal(parsed.reason, "E_FAIL");
  assert.equal(parsed.text, "Network error");
});

test("parseTimelineMessage falls back to raw text", () => {
  const parsed = parseTimelineMessage("Plain message without metadata");
  assert.equal(parsed.ref, null);
  assert.equal(parsed.reason, null);
  assert.equal(parsed.text, "Plain message without metadata");
});

test("timeline metadata renders ref and reason labels", () => {
  const messages = getMessages("en");
  const parsed = parseTimelineMessage("ref=abc code=E_FAIL message=Failed");
  const html = renderToStaticMarkup(
    createElement("div", null, [
      createElement("span", { key: "msg" }, parsed.text),
      parsed.ref
        ? createElement("span", { key: "ref" }, `${messages.payoutRefLabel} ${parsed.ref}`)
        : null,
      parsed.reason
        ? createElement(
            "span",
            { key: "reason" },
            `${messages.payoutReasonLabel} ${parsed.reason}`
          )
        : null,
    ])
  );
  assert.equal(html.includes("Ref:"), true);
  assert.equal(html.includes("Reason:"), true);
});
