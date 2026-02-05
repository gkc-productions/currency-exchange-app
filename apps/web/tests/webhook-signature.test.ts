import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "../src/lib/payout/webhook-processor";

function sign(secret: string, base: string) {
  return createHmac("sha256", secret).update(base).digest("hex");
}

test("verifyWebhookSignature uses raw body by default", () => {
  const secret = "test_secret";
  const rawBody = JSON.stringify({ ok: true });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign(secret, rawBody);
  const prev = process.env.WEBHOOK_SIGNATURE_MODE;
  delete process.env.WEBHOOK_SIGNATURE_MODE;
  try {
    const valid = verifyWebhookSignature({
      secret,
      rawBody,
      signatureHeader: signature,
      timestampHeader: timestamp,
    });
    assert.equal(valid, true);
  } finally {
    if (prev === undefined) {
      delete process.env.WEBHOOK_SIGNATURE_MODE;
    } else {
      process.env.WEBHOOK_SIGNATURE_MODE = prev;
    }
  }
});

test("verifyWebhookSignature supports provider_v1 mode", () => {
  const secret = "test_secret";
  const rawBody = JSON.stringify({ ok: true });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign(secret, `${timestamp}.${rawBody}`);
  const prev = process.env.WEBHOOK_SIGNATURE_MODE;
  process.env.WEBHOOK_SIGNATURE_MODE = "provider_v1";
  try {
    const valid = verifyWebhookSignature({
      secret,
      rawBody,
      signatureHeader: signature,
      timestampHeader: timestamp,
    });
    assert.equal(valid, true);
  } finally {
    if (prev === undefined) {
      delete process.env.WEBHOOK_SIGNATURE_MODE;
    } else {
      process.env.WEBHOOK_SIGNATURE_MODE = prev;
    }
  }
});
