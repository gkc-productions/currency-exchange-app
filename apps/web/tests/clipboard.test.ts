import test from "node:test";
import assert from "node:assert/strict";
import { copyText, shareOrCopyReceiptLink } from "../src/lib/clipboard";

test("copyText uses navigator clipboard when available", async () => {
  let copied = "";
  // @ts-expect-error test mock
  global.navigator = {
    clipboard: {
      writeText: async (value: string) => {
        copied = value;
      },
    },
  };

  const success = await copyText("ref_123");
  assert.equal(success, true);
  assert.equal(copied, "ref_123");
});

test("shareOrCopyReceiptLink falls back to copying expected receipt url", async () => {
  let copied = "";
  // @ts-expect-error test mock
  global.window = { location: { origin: "https://app.clarisend.co" } };
  // @ts-expect-error test mock
  global.navigator = {
    clipboard: {
      writeText: async (value: string) => {
        copied = value;
      },
    },
  };

  const result = await shareOrCopyReceiptLink({
    locale: "en",
    transferId: "tr_123",
  });

  assert.equal(result.shared, false);
  assert.equal(result.copied, true);
  assert.equal(copied, "https://app.clarisend.co/en/transfer/tr_123?receipt=1");
});
