import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";

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

async function ensureDevUser(email: string): Promise<{ id: string; email: string }> {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Dev User" },
    select: { id: true },
  });
  return { id: user.id, email };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
  }

  const user = readDevBypassSession(req)
    ? await ensureDevUser(session.user.email)
    : await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      id: true,
      userId: true,
      status: true,
      providerPayoutId: true,
      providerPayoutStatus: true,
      providerPayoutProvider: true,
      providerPayoutUpdatedAt: true,
    },
  });

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    transferId: transfer.id,
    status: transfer.status,
    providerPayoutId: transfer.providerPayoutId ?? null,
    providerPayoutStatus: transfer.providerPayoutStatus ?? null,
    providerPayoutProvider: transfer.providerPayoutProvider ?? null,
    providerPayoutUpdatedAt: transfer.providerPayoutUpdatedAt ?? null,
  });
}
