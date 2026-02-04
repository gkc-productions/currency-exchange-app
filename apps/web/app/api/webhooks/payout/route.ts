import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Prisma, TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { logEvent, safeError } from "@/src/lib/observability";

export const runtime = "nodejs";

const validStatuses = new Set(["COMPLETED", "FAILED"]);

function mapProviderStatusToTransferStatus(providerStatus: string) {
  if (providerStatus === "COMPLETED") {
    return TransferStatus.COMPLETED;
  }
  if (providerStatus === "FAILED") {
    return TransferStatus.FAILED;
  }
  return TransferStatus.PROCESSING;
}

function getReceiptBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "https://app.clarisend.co";
}

function buildReceiptUrl(transferId: string) {
  return `${getReceiptBaseUrl()}/en/transfer/${transferId}`;
}

type WebhookPayload = {
  provider?: unknown;
  payoutId?: unknown;
  transferId?: unknown;
  eventId?: unknown;
  status?: unknown;
  occurredAt?: unknown;
};

function formatEventMessage(base: string, meta: { ref?: string }) {
  const parts = [base];
  if (meta.ref) {
    parts.push(`ref=${meta.ref}`);
  }
  return parts.join(" ");
}

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
  const secret = process.env.WEBHOOK_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const requestId = req.headers.get("x-request-id") ?? undefined;
  // Required headers:
  // - x-webhook-signature: HMAC SHA256 hex over the raw request body bytes
  // - x-payout-timestamp: Unix epoch seconds; requests older than 5 minutes are rejected
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-webhook-signature");
  const timestampHeader = req.headers.get("x-payout-timestamp");
  const timestamp = parseTimestamp(timestampHeader);
  if (timestamp === null || !isTimestampFresh(timestamp)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!verifySignature(secret, rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: WebhookPayload;
  let payloadJson = {} as unknown as Prisma.InputJsonValue;
  try {
    const body = rawBody ? JSON.parse(rawBody) : null;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    payload = body as WebhookPayload;
    payloadJson = body as unknown as Prisma.InputJsonValue;
  } catch (err) {
    logEvent("webhook_payout_invalid_json", { requestId, error: safeError(err) });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!validStatuses.has(statusRaw)) {
    logEvent("webhook_payout_invalid_status", { requestId, status: statusRaw });
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existingReceipt = await prisma.webhookEventReceipt.findUnique({
    where: {
      provider_eventId: {
        provider,
        eventId,
      },
    },
  });
  if (existingReceipt) {
    logEvent("webhook_payout_deduped", { requestId, provider, eventId, transferId });
    return NextResponse.json({ ok: true, deduped: true });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { id: true, status: true, providerPayoutId: true, receiptUrl: true },
  });

  if (!transfer) {
    logEvent("webhook_payout_transfer_missing", { requestId, transferId, payoutId });
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  if (transfer.providerPayoutId !== payoutId) {
    logEvent("webhook_payout_mismatch", {
      requestId,
      transferId,
      payoutId,
      expected: transfer.providerPayoutId,
    });
    return NextResponse.json({ error: "Payout mismatch" }, { status: 409 });
  }

  const finalStatus = mapProviderStatusToTransferStatus(statusRaw);

  const receiptUrl = buildReceiptUrl(transfer.id);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.webhookEventReceipt.create({
      data: {
        provider,
        eventId,
        payload: payloadJson,
        signature: signatureHeader ?? null,
      },
    });

    if (transfer.status === TransferStatus.COMPLETED) {
      if (finalStatus === TransferStatus.COMPLETED) {
        await tx.transfer.updateMany({
          where: {
            id: transfer.id,
            status: TransferStatus.COMPLETED,
            receiptUrl: null,
            receiptIssuedAt: null,
          },
          data: {
            receiptUrl,
            receiptIssuedAt: new Date(),
          },
        });
      }
      return { transitioned: false };
    }

    if (transfer.status === TransferStatus.FAILED && finalStatus === TransferStatus.FAILED) {
      return { transitioned: false };
    }

    if (transfer.status === TransferStatus.FAILED && finalStatus === TransferStatus.COMPLETED) {
      if (transfer.receiptUrl) {
        return { transitioned: false };
      }
      const transition = await tx.transfer.updateMany({
        where: {
          id: transfer.id,
          status: TransferStatus.FAILED,
          receiptUrl: null,
        },
        data: {
          status: finalStatus,
          providerPayoutStatus: statusRaw,
          providerPayoutProvider: provider,
          providerPayoutUpdatedAt: new Date(occurredAt),
        },
      });

      if (transition.count !== 1) {
        return { transitioned: false };
      }

      await tx.transfer.updateMany({
        where: {
          id: transfer.id,
          status: TransferStatus.COMPLETED,
          receiptUrl: null,
          receiptIssuedAt: null,
        },
        data: {
          receiptUrl,
          receiptIssuedAt: new Date(),
        },
      });

      await tx.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: "PAYOUT_RESOLVED_AFTER_FAILURE",
          message: formatEventMessage("Payout resolved after failure.", { ref: payoutId }),
        },
      });

      return { transitioned: true };
    }

    const transition = await tx.transfer.updateMany({
      where: {
        id: transfer.id,
        status: TransferStatus.PROCESSING,
      },
      data: {
        status: finalStatus,
        providerPayoutStatus: statusRaw,
        providerPayoutProvider: provider,
        providerPayoutUpdatedAt: new Date(occurredAt),
      },
    });

    if (transition.count !== 1) {
      return { transitioned: false };
    }

    if (finalStatus === TransferStatus.COMPLETED) {
      await tx.transfer.updateMany({
        where: {
          id: transfer.id,
          status: TransferStatus.COMPLETED,
          receiptUrl: null,
          receiptIssuedAt: null,
        },
        data: {
          receiptUrl,
          receiptIssuedAt: new Date(),
        },
      });
    }

    await tx.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: finalStatus === TransferStatus.COMPLETED ? "PAYOUT_COMPLETED" : "PAYOUT_FAILED",
        message: formatEventMessage(
          finalStatus === TransferStatus.COMPLETED ? "Payout completed." : "Payout failed.",
          { ref: payoutId }
        ),
      },
    });

    return { transitioned: true };
  });

  logEvent("webhook_payout_processed", {
    requestId,
    transferId,
    provider,
    payoutId,
    status: finalStatus,
    transitioned: updated.transitioned,
  });
  return NextResponse.json({ ok: true, transitioned: updated.transitioned });
}
