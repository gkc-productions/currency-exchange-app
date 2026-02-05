import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { logEvent, safeError } from "@/src/lib/observability";
import { getReadOnlyResponse } from "@/src/lib/security";
import { processPayoutWebhook } from "@/src/lib/payout/webhook-processor";

export const runtime = "nodejs";

type WebhookPayload = {
  provider?: unknown;
  payoutId?: unknown;
  transferId?: unknown;
  eventId?: unknown;
  status?: unknown;
  occurredAt?: unknown;
};

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function verifySignature(secret: string, rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHeader, "hex"));
  } catch {
    return false;
  }
}

function hashRawBody(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function parseTimestamp(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }
  const parsed = Number.parseInt(headerValue, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function isTimestampFresh(timestampSeconds: number) {
  const nowMs = Date.now();
  const tsMs = timestampSeconds * 1000;
  return Math.abs(nowMs - tsMs) <= 5 * 60 * 1000;
}

export async function POST(req: Request) {
  const readOnly = getReadOnlyResponse(req);
  if (readOnly) {
    return readOnly;
  }
  const secret = process.env.WEBHOOK_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const requestId = req.headers.get("x-request-id") ?? undefined;
  // Required headers:
  // - x-webhook-signature: HMAC SHA256 hex over the raw request body bytes
  // - x-payout-timestamp: Unix epoch seconds; requests older than 5 minutes are rejected
  // - x-webhook-event-id: unique provider event id
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-webhook-signature");
  const timestampHeader = req.headers.get("x-payout-timestamp");
  const eventIdHeader = req.headers.get("x-webhook-event-id");
  if (!signatureHeader || !timestampHeader || !eventIdHeader) {
    return NextResponse.json(
      { error: "invalid_webhook", errorCode: "MISSING_HEADER" },
      { status: 400 }
    );
  }
  const timestamp = parseTimestamp(timestampHeader);
  if (timestamp === null || !isTimestampFresh(timestamp)) {
    return NextResponse.json(
      { error: "stale_webhook", errorCode: "STALE_TIMESTAMP" },
      { status: 401 }
    );
  }
  if (!verifySignature(secret, rawBody, signatureHeader)) {
    return NextResponse.json(
      { error: "invalid_signature", errorCode: "INVALID_SIGNATURE" },
      { status: 401 }
    );
  }

  let payload: WebhookPayload;
  let payloadJson = null as Prisma.InputJsonValue | null;
  try {
    const body = rawBody ? JSON.parse(rawBody) : null;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "invalid_webhook", errorCode: "INVALID_BODY" },
        { status: 400 }
      );
    }
    payload = body as WebhookPayload;
    payloadJson = body as unknown as Prisma.InputJsonValue;
  } catch (err) {
    logEvent("webhook_payout_invalid_json", { requestId, error: safeError(err) });
    return NextResponse.json(
      { error: "invalid_webhook", errorCode: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const provider = readRequiredString(payload.provider);
  const payoutId = readRequiredString(payload.payoutId);
  const transferId = readRequiredString(payload.transferId);
  const eventId = readRequiredString(payload.eventId);
  const statusRaw = readRequiredString(payload.status)?.toUpperCase() ?? null;
  const occurredAt = readRequiredString(payload.occurredAt);

  if (!provider || !payoutId || !transferId || !eventId || !statusRaw || !occurredAt) {
    logEvent("webhook_payout_missing_fields", {
      requestId,
      provider,
      payoutId,
      transferId,
      eventId,
      status: statusRaw,
    });
    return NextResponse.json(
      { error: "invalid_webhook", errorCode: "MISSING_FIELD" },
      { status: 400 }
    );
  }
  if (eventIdHeader.trim() !== eventId) {
    return NextResponse.json(
      { error: "invalid_webhook", errorCode: "EVENT_ID_MISMATCH" },
      { status: 400 }
    );
  }
  const occurredAtDate = new Date(occurredAt);
  if (Number.isNaN(occurredAtDate.getTime())) {
    return NextResponse.json(
      { error: "invalid_webhook", errorCode: "INVALID_OCCURRED_AT" },
      { status: 400 }
    );
  }
  const signatureDate = new Date(timestamp * 1000);
  const rawHash = hashRawBody(rawBody);
  const existing = await prisma.payoutWebhookEvent.findUnique({
    where: { eventId },
  });
  if (existing) {
    logEvent("webhook_payout_deduped", { requestId, provider, eventId, transferId });
    return NextResponse.json({ ok: true, deduped: true });
  }

  await prisma.webhookEventReceipt.create({
    data: {
      provider,
      eventId,
      payload: payloadJson ?? undefined,
      signature: signatureHeader ? `${signatureHeader.slice(0, 6)}...` : null,
      receivedAt: new Date(),
    },
  }).catch(() => {
    // Ignore receipt log failures to avoid blocking processing.
  });
  let updated: { transitioned: boolean; outcome: string; deduped: boolean };
  try {
    updated = await processPayoutWebhook(
      {
        provider,
        payoutId,
        transferId,
        eventId,
        status: statusRaw,
        occurredAt: occurredAtDate,
        signatureTimestamp: signatureDate,
        rawHash,
        rawPayload: payloadJson,
      },
      { skipCreate: false }
    );
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "transfer_not_found") {
        return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
      }
      if (err.message === "payout_mismatch") {
        return NextResponse.json({ error: "Payout mismatch" }, { status: 409 });
      }
      if (err.message === "invalid_status") {
        return NextResponse.json({ error: "invalid_webhook" }, { status: 400 });
      }
    }
    throw err;
  }

  logEvent("webhook_payout_processed", {
    requestId,
    transferId,
    provider,
    payoutId,
    status: statusRaw,
    transitioned: updated.transitioned,
    outcome: updated.outcome,
  });
  if (updated.deduped) {
    return NextResponse.json({ ok: true, deduped: true });
  }
  return NextResponse.json({ ok: true, transitioned: updated.transitioned });
}
