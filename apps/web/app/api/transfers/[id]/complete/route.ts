import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { ensureReceiptIssued } from "@/src/lib/receipt-issue";
import { getReadOnlyResponse, readDevBypassEmail } from "@/src/lib/security";

type SessionLike = { user?: { email?: string | null } | null } | null;

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
  const readOnly = getReadOnlyResponse(req);
  if (readOnly) {
    return readOnly;
  }
  const session = readDevBypassSession(req);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: {
      email: session.user.email,
      name: "Dev User",
    },
  });

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transfer.status !== "COMPLETED") {
    await prisma.transfer.update({
      where: { id: transfer.id },
      data: { status: TransferStatus.COMPLETED },
    });
  }

  await prisma.transferEvent.create({
    data: {
      transferId: transfer.id,
      type: "STATUS_UPDATED",
      message: "Transfer marked completed (dev).",
    },
  });

  const issuance = await ensureReceiptIssued({ transferId: transfer.id });
  return NextResponse.json({
    ok: true,
    status: TransferStatus.COMPLETED,
    receiptUrl: issuance.receiptUrl ?? null,
  });
}
