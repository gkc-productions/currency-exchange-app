import { NextResponse } from "next/server";
import { Prisma, TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";

const DEV_BYPASS_HEADER = "x-dev-bypass-auth";
const DEV_EMAIL_HEADER = "x-dev-user-email";

type SessionLike = { user?: { email?: string | null } | null } | null;

function readDevBypassSession(req: Request): SessionLike {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  if (process.env.DEV_BYPASS_AUTH !== "1") {
    return null;
  }
  const bypass = req.headers.get(DEV_BYPASS_HEADER);
  const email = req.headers.get(DEV_EMAIL_HEADER);
  if (bypass !== "1") {
    return null;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

function parseLimit(value: string | null) {
  const fallback = 50;
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, 200);
}

function parseStatus(value: string | null): TransferStatus | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "ALL") {
    return null;
  }
  if (["PROCESSING", "COMPLETED", "FAILED"].includes(normalized)) {
    return normalized as TransferStatus;
  }
  return null;
}

function parseProvider(value: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase() === "ALL") {
    return null;
  }
  return trimmed;
}

export async function GET(req: Request) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseLimit(searchParams.get("limit"));
  const statusFilter = parseStatus(searchParams.get("status"));
  const providerFilter = parseProvider(searchParams.get("provider"));
  const whereClause: Prisma.TransferWhereInput = {};
  if (statusFilter) {
    whereClause.status = statusFilter;
  }
  if (providerFilter) {
    whereClause.providerPayoutProvider = providerFilter;
  }

  const transfers = await prisma.transfer.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      referenceCode: true,
      status: true,
      payoutRail: true,
      updatedAt: true,
      receiptUrl: true,
      providerPayoutProvider: true,
      events: {
        where: { type: { startsWith: "PAYOUT_" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          type: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });

  const response = transfers.map((transfer) => {
    const latestEvent = transfer.events[0] ?? null;
    return {
      id: transfer.id,
      referenceCode: transfer.referenceCode,
      status: transfer.status,
      payoutRail: transfer.payoutRail,
      updatedAt: transfer.updatedAt,
      receiptUrl: transfer.receiptUrl,
      providerPayoutProvider: transfer.providerPayoutProvider ?? null,
      latestPayoutEvent: latestEvent
        ? {
            type: latestEvent.type,
            message: latestEvent.message,
            createdAt: latestEvent.createdAt,
          }
        : null,
    };
  });

  return NextResponse.json(response);
}
