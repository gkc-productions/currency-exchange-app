import test from "node:test";
import assert from "node:assert/strict";
import { copyText } from "../src/lib/clipboard";

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
