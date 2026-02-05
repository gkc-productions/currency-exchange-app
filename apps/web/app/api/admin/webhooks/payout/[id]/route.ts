import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { readDevBypassEmail } from "@/src/lib/security";

type SessionLike = { user?: { email?: string | null } | null } | null;

type WebhookDetail = {
  id: string;
  headers: {
    signature: string | null;
    signatureRedacted: boolean;
    timestamp: string | null;
    eventId: string;
  };
  payload: unknown;
  processing: {
    deduped: boolean;
    transferId: string;
    updatedStatus: string;
    receiptIssued: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const resolvedParams = await Promise.resolve(params);
  const eventId = resolvedParams.id?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const event = await prisma.payoutWebhookEvent.findUnique({
    where: { eventId },
    select: {
      eventId: true,
      provider: true,
      transferId: true,
      status: true,
      receivedAt: true,
      signatureTimestamp: true,
      outcome: true,
      rawHash: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: event.transferId },
    select: { status: true, receiptUrl: true },
  });

  const detail: WebhookDetail = {
    id: event.eventId,
    headers: {
      signature: null,
      signatureRedacted: true,
      timestamp: event.signatureTimestamp
        ? event.signatureTimestamp.toISOString()
        : null,
      eventId: event.eventId,
    },
    payload: null,
    processing: {
      deduped: event.outcome === "noop",
      transferId: event.transferId,
      updatedStatus: transfer?.status ?? event.status,
      receiptIssued: Boolean(transfer?.receiptUrl),
    },
    createdAt: event.receivedAt,
    updatedAt: event.receivedAt,
  };

  return NextResponse.json(detail);
}
