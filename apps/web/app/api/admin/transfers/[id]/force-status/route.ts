import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getReadOnlyResponse, readDevBypassEmail } from "@/src/lib/security";
import { ensureReceiptIssued } from "@/src/lib/receipt-issue";

type SessionLike = { user?: { email?: string | null } | null } | null;

type ForceStatusPayload = {
  status: "READY" | "PROCESSING" | "FAILED" | "COMPLETED";
  reason?: string;
};

type ForceStatusResponse = {
  ok: boolean;
  status: string;
  beforeStatus: string;
  deduped?: boolean;
  receiptUrl?: string | null;
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

function isAllowedTransition(fromStatus: TransferStatus, toStatus: TransferStatus) {
  if (fromStatus === TransferStatus.COMPLETED) {
    return false;
  }
  if (fromStatus === TransferStatus.READY) {
    return (
      toStatus === TransferStatus.PROCESSING ||
      toStatus === TransferStatus.FAILED ||
      toStatus === TransferStatus.COMPLETED
    );
  }
  if (fromStatus === TransferStatus.PROCESSING) {
    return toStatus === TransferStatus.FAILED || toStatus === TransferStatus.COMPLETED;
  }
  if (fromStatus === TransferStatus.FAILED) {
    return toStatus === TransferStatus.PROCESSING || toStatus === TransferStatus.COMPLETED;
  }
  return false;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const readOnly = getReadOnlyResponse(req, { isAdmin: true });
  if (readOnly) {
    return readOnly;
  }

  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "invalid_transfer_id" }, { status: 400 });
  }

  let payload: ForceStatusPayload | null = null;
  try {
    payload = (await req.json()) as ForceStatusPayload;
  } catch {
    payload = null;
  }

  const nextStatus = payload?.status;
  if (!nextStatus) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      id: true,
      status: true,
      receiptUrl: true,
      receiptIssuedAt: true,
    },
  });

  if (!transfer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (transfer.status === TransferStatus.COMPLETED) {
    const response: ForceStatusResponse = {
      ok: true,
      status: transfer.status,
      beforeStatus: transfer.status,
      deduped: true,
      receiptUrl: transfer.receiptUrl ?? null,
    };
    return NextResponse.json(response);
  }

  if (transfer.status === nextStatus) {
    const response: ForceStatusResponse = {
      ok: true,
      status: transfer.status,
      beforeStatus: transfer.status,
      deduped: true,
      receiptUrl: transfer.receiptUrl ?? null,
    };
    return NextResponse.json(response);
  }

  if (!isAllowedTransition(transfer.status, nextStatus)) {
    return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
  }

  const updateResult = await prisma.transfer.updateMany({
    where: {
      id: transfer.id,
      status: transfer.status,
    },
    data: {
      status: nextStatus,
    },
  });

  if (updateResult.count !== 1) {
    const current = await prisma.transfer.findUnique({
      where: { id: transfer.id },
      select: { status: true, receiptUrl: true },
    });
    const response: ForceStatusResponse = {
      ok: true,
      status: current?.status ?? transfer.status,
      beforeStatus: transfer.status,
      deduped: true,
      receiptUrl: current?.receiptUrl ?? transfer.receiptUrl ?? null,
    };
    return NextResponse.json(response);
  }

  let receiptUrl = transfer.receiptUrl ?? null;
  if (nextStatus === TransferStatus.COMPLETED) {
    const issuance = await ensureReceiptIssued({ transferId: transfer.id });
    receiptUrl = issuance.receiptUrl ?? receiptUrl;
  }

  const reasonSuffix = payload?.reason?.trim() ? ` reason=${payload.reason.trim()}` : "";
  await prisma.transferEvent.create({
    data: {
      transferId: transfer.id,
      type: "ADMIN_FORCE_STATUS",
      message: `Admin forced status from=${transfer.status} to=${nextStatus}${reasonSuffix}`,
    },
  });

  const response: ForceStatusResponse = {
    ok: true,
    status: nextStatus,
    beforeStatus: transfer.status,
    receiptUrl,
  };
  return NextResponse.json(response);
}
