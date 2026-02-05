import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getReadOnlyResponse, readDevBypassEmail } from "@/src/lib/security";

const validStatuses = new Set(["COMPLETED", "FAILED"]);

type SessionLike = { user?: { email?: string | null } | null } | null;

type ReplayResponse = {
  ok: boolean;
  transitioned: boolean;
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

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

export async function POST(req: Request) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const readOnly = getReadOnlyResponse(req, { isAdmin: true });
  if (readOnly) {
    return readOnly;
  }

  let payload: { eventId?: unknown };
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    payload = body as { eventId?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const eventId = typeof payload.eventId === "string" ? payload.eventId.trim() : "";
  if (!eventId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const event = await prisma.payoutWebhookEvent.findUnique({
    where: { eventId },
    select: {
      eventId: true,
      provider: true,
      providerPayoutId: true,
      status: true,
      transferId: true,
      occurredAt: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!event.transferId || !event.providerPayoutId || !event.status) {
    return NextResponse.json({ error: "replay_unavailable" }, { status: 409 });
  }

  const statusRaw = event.status.toUpperCase();
  if (!validStatuses.has(statusRaw)) {
    return NextResponse.json({ error: "replay_unavailable" }, { status: 409 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: event.transferId },
    select: { id: true, status: true, providerPayoutId: true, receiptUrl: true },
  });

  if (!transfer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (transfer.providerPayoutId !== event.providerPayoutId) {
    return NextResponse.json({ error: "payout_mismatch" }, { status: 409 });
  }

  if (transfer.status === TransferStatus.COMPLETED || transfer.status === TransferStatus.FAILED) {
    const response: ReplayResponse = { ok: true, transitioned: false };
    return NextResponse.json(response);
  }

  const finalStatus = mapProviderStatusToTransferStatus(statusRaw);
  const receiptUrl = buildReceiptUrl(transfer.id);
  const updated = await prisma.$transaction(async (tx) => {
    const transition = await tx.transfer.updateMany({
      where: {
        id: transfer.id,
        status: TransferStatus.PROCESSING,
      },
      data: {
        status: finalStatus,
        providerPayoutStatus: statusRaw,
        providerPayoutProvider: event.provider,
        providerPayoutUpdatedAt: event.occurredAt ?? new Date(),
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

    const attempt = await tx.payoutAttempt.findFirst({
      where: {
        transferId: transfer.id,
        status: "SUBMITTED",
        ...(event.providerPayoutId ? { providerPayoutId: event.providerPayoutId } : {}),
      },
      orderBy: { startedAt: "desc" },
    });
    if (attempt) {
      await tx.payoutAttempt.update({
        where: { id: attempt.id },
        data: {
          status: finalStatus === TransferStatus.COMPLETED ? "SUCCEEDED" : "FAILED",
          finishedAt: new Date(),
          errorCode: finalStatus === TransferStatus.FAILED ? "WEBHOOK_FAILED" : null,
          errorMessage:
            finalStatus === TransferStatus.FAILED ? "Provider reported failure." : null,
        },
      });
    }

    await tx.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: finalStatus === TransferStatus.COMPLETED ? "PAYOUT_COMPLETED" : "PAYOUT_FAILED",
        message:
          finalStatus === TransferStatus.COMPLETED
            ? `Payout completed. ref=${event.providerPayoutId}`
            : `Payout failed. ref=${event.providerPayoutId}`,
      },
    });

    return { transitioned: true };
  });

  const response: ReplayResponse = { ok: true, transitioned: updated.transitioned };
  return NextResponse.json(response);
}
