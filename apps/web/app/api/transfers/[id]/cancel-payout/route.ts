import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import {
  getReadOnlyResponse,
  isSameOrigin,
  isDevBypassRequest,
  readDevBypassEmail,
} from "@/src/lib/security";
import { ALLOW_SIMULATED_PAYOUTS } from "@/src/lib/runtime";

type SessionLike = { user?: { email?: string | null } | null } | null;

type CancelResponse = {
  ok: boolean;
  status: string;
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

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const readOnly = getReadOnlyResponse(req);
  if (readOnly) {
    return readOnly;
  }
  if (!ALLOW_SIMULATED_PAYOUTS) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devBypassActive = isDevBypassRequest(req);
  if (!devBypassActive && !isSameOrigin(req)) {
    return NextResponse.json(
      { error: "This action is only available from the ClariSend app." },
      { status: 403 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
  }

  const user = devBypassActive
    ? await ensureDevUser(session.user.email)
    : await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { id: true, userId: true, status: true },
  });

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transfer.status === TransferStatus.COMPLETED) {
    const response: CancelResponse = { ok: true, status: transfer.status };
    return NextResponse.json(response);
  }

  if (transfer.status === TransferStatus.FAILED) {
    const response: CancelResponse = { ok: true, status: transfer.status };
    return NextResponse.json(response);
  }

  if (transfer.status !== TransferStatus.PROCESSING) {
    return NextResponse.json({ error: "Nothing to cancel." }, { status: 400 });
  }

  const updated = await prisma.transfer.updateMany({
    where: { id: transfer.id, userId: user.id, status: TransferStatus.PROCESSING },
    data: { status: TransferStatus.FAILED },
  });

  if (updated.count === 1) {
    await prisma.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: "PAYOUT_CANCELED",
        message: "Payout canceled. reason=manual_cancel",
      },
    });
  }

  const response: CancelResponse = {
    ok: true,
    status: updated.count === 1 ? TransferStatus.FAILED : transfer.status,
  };
  return NextResponse.json(response);
}
