import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { readDevBypassEmail } from "@/src/lib/security";

type SessionLike = { user?: { email?: string | null } | null } | null;

type WebhookListRow = {
  id: string;
  receivedAt: Date;
  provider: string;
  transferId: string;
  status: string;
  reason: string | null;
  rawHeaders: {
    signaturePresent: boolean;
    timestamp: string | null;
    eventId: string;
  };
  payloadSummary: {
    eventType: string | null;
    payoutId: string | null;
    reference: string | null;
    amount: number | null;
    currency: string | null;
  };
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

function mapOutcome(outcome: string) {
  if (outcome === "applied") {
    return { status: "processed", reason: null };
  }
  if (outcome === "noop") {
    return { status: "deduped", reason: "deduped" };
  }
  if (outcome === "received") {
    return { status: "processed", reason: null };
  }
  return { status: "processed", reason: null };
}

export async function GET(req: Request) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const cursor = url.searchParams.get("cursor")?.trim();
  const provider = url.searchParams.get("provider")?.trim();
  const statusFilter = url.searchParams.get("status")?.trim();
  const transferId = url.searchParams.get("transferId")?.trim();
  const since = url.searchParams.get("since")?.trim();

  const where: {
    provider?: string;
    transferId?: string;
    receivedAt?: { gte: Date };
  } = {};

  if (provider) {
    where.provider = provider;
  }
  if (transferId) {
    where.transferId = transferId;
  }
  if (since) {
    const sinceDate = new Date(since);
    if (!Number.isNaN(sinceDate.getTime())) {
      where.receivedAt = { gte: sinceDate };
    }
  }

  const events = await prisma.payoutWebhookEvent.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: limit,
    ...(cursor
      ? {
          skip: 1,
          cursor: { eventId: cursor },
        }
      : {}),
    select: {
      eventId: true,
      provider: true,
      transferId: true,
      status: true,
      receivedAt: true,
      signatureTimestamp: true,
      outcome: true,
      rawHash: true,
      providerPayoutId: true,
    },
  });

  const rows = events.reduce<WebhookListRow[]>((acc, event) => {
    const outcome = mapOutcome(event.outcome);
    if (statusFilter && outcome.status !== statusFilter) {
      return acc;
    }
    acc.push({
      id: event.eventId,
      receivedAt: event.receivedAt,
      provider: event.provider,
      transferId: event.transferId,
      status: outcome.status,
      reason: outcome.reason,
      rawHeaders: {
        signaturePresent: false,
        timestamp: event.signatureTimestamp
          ? event.signatureTimestamp.toISOString()
          : null,
        eventId: event.eventId,
      },
      payloadSummary: {
        eventType: event.status ?? null,
        payoutId: event.providerPayoutId ?? (event.rawHash ? event.rawHash.slice(0, 12) : null),
        reference: null,
        amount: null,
        currency: null,
      },
    });
    return acc;
  }, []);

  return NextResponse.json(rows);
}
