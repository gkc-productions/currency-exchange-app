import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import { readDevBypassEmail } from "@/src/lib/security";

type SessionLike = { user?: { email?: string | null } | null } | null;

type EventRow = {
  type: string;
  message: string;
  createdAt: Date;
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
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

function mapEvent(event: EventRow) {
  return {
    type: event.type,
    message: event.message,
    createdAt: event.createdAt,
  };
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
    select: { id: true, userId: true },
  });

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await prisma.transferEvent.findMany({
    where: { transferId },
    orderBy: { createdAt: "asc" },
    select: { type: true, message: true, createdAt: true },
  });

  return NextResponse.json(events.map(mapEvent));
}
