import { NextResponse } from "next/server";
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

function parseDateParam(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toCsvRow(values: Array<string | number | null>) {
  return values
    .map((value) => {
      if (value === null || value === undefined) {
        return "";
      }
      const raw = String(value);
      if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
        return `"${raw.replace(/\"/g, "\"\"")}"`;
      }
      return raw;
    })
    .join(",");
}

export async function GET(req: Request) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = parseDateParam(url.searchParams.get("from"));
  const to = parseDateParam(url.searchParams.get("to"));

  const where: {
    status: "COMPLETED";
    updatedAt?: { gte?: Date; lte?: Date };
  } = { status: "COMPLETED" };

  if (from || to) {
    where.updatedAt = {};
    if (from) {
      where.updatedAt.gte = from;
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.updatedAt.lte = end;
    }
  }

  const transfers = await prisma.transfer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      referenceCode: true,
      status: true,
      providerPayoutId: true,
      providerPayoutStatus: true,
      providerPayoutProvider: true,
      updatedAt: true,
    },
  });

  const header = [
    "transferId",
    "referenceCode",
    "status",
    "providerPayoutId",
    "providerPayoutStatus",
    "providerPayoutProvider",
    "completedAt",
  ];

  const rows = transfers.map((transfer) =>
    toCsvRow([
      transfer.id,
      transfer.referenceCode,
      transfer.status,
      transfer.providerPayoutId ?? "",
      transfer.providerPayoutStatus ?? "",
      transfer.providerPayoutProvider ?? "",
      transfer.updatedAt.toISOString(),
    ])
  );

  const csv = [toCsvRow(header), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"payouts.csv\"",
    },
  });
}
