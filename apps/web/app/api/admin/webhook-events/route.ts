import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { readDevBypassEmail } from "@/src/lib/security";

type SessionLike = { user?: { email?: string | null } | null } | null;

type AdminWebhookRow = {
  id: string;
  provider: string;
  eventId: string;
  transferId: string;
  kind: string;
  receivedAt: Date;
  signatureTimestamp: Date | null;
  isDeduped: boolean;
  processingResult: string;
  rawPayload: { hash: string; size: number };
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

export async function GET(req: Request) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider")?.trim();
  const kind = url.searchParams.get("kind")?.trim();
  const transferId = url.searchParams.get("transferId")?.trim();
  const since = url.searchParams.get("since")?.trim();

  const where: {
    provider?: string;
    status?: string;
    transferId?: string;
    receivedAt?: { gte: Date };
  } = {};

  if (provider) {
    where.provider = provider;
  }
  if (kind) {
    where.status = kind;
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
    take: 50,
    select: {
      id: true,
      provider: true,
      eventId: true,
      transferId: true,
      status: true,
      receivedAt: true,
      signatureTimestamp: true,
      outcome: true,
      rawHash: true,
    },
  });

  const rows: AdminWebhookRow[] = events.map((event) => ({
    id: event.id,
    provider: event.provider,
    eventId: event.eventId,
    transferId: event.transferId,
    kind: event.status,
    receivedAt: event.receivedAt,
    signatureTimestamp: event.signatureTimestamp ?? null,
    isDeduped: event.outcome === "deduped",
    processingResult: event.outcome,
    rawPayload: { hash: event.rawHash, size: event.rawHash.length },
  }));

  return NextResponse.json(rows);
}
