import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getReadOnlyResponse, readDevBypassEmail } from "@/src/lib/security";
import { processPayoutWebhook } from "@/src/lib/payout/webhook-processor";

type SessionLike = { user?: { email?: string | null } | null } | null;

type ReplayResponse = {
  ok: boolean;
  replayed: boolean;
  deduped: boolean;
  reason?: string;
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const devSession = readDevBypassSession(req);
  if (!devSession || !isAdminSession(devSession)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const readOnly = getReadOnlyResponse(req, { isAdmin: true });
  if (readOnly) {
    return readOnly;
  }

  const resolvedParams = await Promise.resolve(params);
  const recordId = resolvedParams.id?.trim();
  if (!recordId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const event = await prisma.payoutWebhookEvent.findUnique({
    where: { id: recordId },
    select: {
      id: true,
      eventId: true,
      provider: true,
      providerPayoutId: true,
      status: true,
      transferId: true,
      occurredAt: true,
      signatureTimestamp: true,
      rawHash: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!event.providerPayoutId || !event.status || !event.transferId) {
    return NextResponse.json({ error: "replay_unavailable" }, { status: 409 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: event.transferId },
    select: { id: true, status: true },
  });

  if (!transfer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (transfer.status === "COMPLETED" || transfer.status === "FAILED") {
    const response: ReplayResponse = { ok: true, replayed: false, deduped: true };
    return NextResponse.json(response);
  }

  try {
    const result = await processPayoutWebhook(
      {
        provider: event.provider,
        payoutId: event.providerPayoutId,
        transferId: event.transferId,
        eventId: event.eventId,
        status: event.status,
        occurredAt: event.occurredAt ?? new Date(),
        signatureTimestamp: event.signatureTimestamp ?? new Date(),
        rawHash: event.rawHash,
        rawPayload: null,
      },
      { skipCreate: true }
    );

    const response: ReplayResponse = {
      ok: true,
      replayed: result.transitioned,
      deduped: result.deduped,
    };
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "payout_mismatch") {
        return NextResponse.json({ error: "payout_mismatch" }, { status: 409 });
      }
      if (err.message === "transfer_not_found") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      if (err.message === "invalid_status") {
        return NextResponse.json({ error: "replay_unavailable" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "replay_unavailable" }, { status: 409 });
  }
}
