import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getReadOnlyResponse, readDevBypassEmail } from "@/src/lib/security";
import { getPayoutStatus } from "@/src/lib/payout";

type SessionLike = { user?: { email?: string | null } | null } | null;

type ReconcileResponse = {
  ok: boolean;
  beforeStatus: string;
  afterStatus: string;
  providerStatus: string;
  providerPayoutId: string;
  provider: string;
  receiptIssued: boolean;
  receiptUrl?: string | null;
  noop?: boolean;
  deduped?: boolean;
};

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

function getReceiptBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "https://app.clarisend.co";
}

function buildReceiptUrl(transferId: string) {
  return `${getReceiptBaseUrl()}/en/transfer/${transferId}`;
}

async function issueReceiptAtomically(transferId: string, userId: string, receiptUrl: string) {
  const issuedAt = new Date();
  const result = await prisma.transfer.updateMany({
    where: {
      id: transferId,
      userId,
      status: TransferStatus.COMPLETED,
      receiptIssuedAt: null,
      receiptUrl: null,
    },
    data: {
      receiptUrl,
      receiptIssuedAt: issuedAt,
    },
  });

  return { issued: result.count === 1, issuedAt };
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      id: true,
      status: true,
      userId: true,
      providerPayoutId: true,
      providerPayoutStatus: true,
      providerPayoutProvider: true,
      receiptUrl: true,
      receiptIssuedAt: true,
    },
  });

  if (!transfer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (transfer.status === TransferStatus.COMPLETED) {
    const response: ReconcileResponse = {
      ok: true,
      beforeStatus: transfer.status,
      afterStatus: transfer.status,
      providerStatus: transfer.providerPayoutStatus ?? "COMPLETED",
      providerPayoutId: transfer.providerPayoutId ?? "",
      provider: transfer.providerPayoutProvider ?? "",
      receiptIssued: Boolean(transfer.receiptUrl ?? transfer.receiptIssuedAt),
      receiptUrl: transfer.receiptUrl ?? null,
      noop: true,
      deduped: true,
    };
    return NextResponse.json(response);
  }

  if (transfer.status === TransferStatus.READY) {
    return NextResponse.json({ error: "not_processing" }, { status: 400 });
  }

  if (!transfer.providerPayoutId) {
    return NextResponse.json(
      { error: "missing_provider_metadata" },
      { status: 409 }
    );
  }

  if (!transfer.providerPayoutProvider) {
    return NextResponse.json({ error: "missing_provider_metadata" }, { status: 409 });
  }

  let providerStatus: string;
  try {
    const providerResult = await getPayoutStatus({
      provider: transfer.providerPayoutProvider,
      providerPayoutId: transfer.providerPayoutId,
    });
    providerStatus = providerResult.status;
  } catch (err) {
    console.error("reconcile_status_failed", err);
    return NextResponse.json({ error: "status_unavailable" }, { status: 502 });
  }

  const normalizedStatus = providerStatus.toUpperCase();
  const nextStatus =
    normalizedStatus === "COMPLETED"
      ? TransferStatus.COMPLETED
      : normalizedStatus === "FAILED"
        ? TransferStatus.FAILED
        : TransferStatus.PROCESSING;

  const previousProviderStatus = (transfer.providerPayoutStatus ?? "").toUpperCase();
  if (transfer.status === nextStatus && previousProviderStatus === normalizedStatus) {
    const response: ReconcileResponse = {
      ok: true,
      beforeStatus: transfer.status,
      afterStatus: transfer.status,
      providerStatus: normalizedStatus,
      providerPayoutId: transfer.providerPayoutId,
      provider: transfer.providerPayoutProvider,
      receiptIssued: Boolean(transfer.receiptUrl ?? transfer.receiptIssuedAt),
      receiptUrl: transfer.receiptUrl ?? null,
      noop: true,
      deduped: true,
    };
    return NextResponse.json(response);
  }

  const now = new Date();
  const updateResult = await prisma.transfer.updateMany({
    where: {
      id: transfer.id,
      status: { in: [TransferStatus.PROCESSING, TransferStatus.FAILED] },
      providerPayoutId: transfer.providerPayoutId,
    },
    data: {
      status: nextStatus,
      providerPayoutStatus: normalizedStatus,
      providerPayoutUpdatedAt: now,
    },
  });

  if (updateResult.count !== 1) {
    const current = await prisma.transfer.findUnique({
      where: { id: transfer.id },
      select: {
        status: true,
        providerPayoutStatus: true,
        providerPayoutProvider: true,
        providerPayoutId: true,
        receiptUrl: true,
        receiptIssuedAt: true,
      },
    });
    const response: ReconcileResponse = {
      ok: true,
      beforeStatus: transfer.status,
      afterStatus: current?.status ?? transfer.status,
      providerStatus: (current?.providerPayoutStatus ?? normalizedStatus).toUpperCase(),
      providerPayoutId: current?.providerPayoutId ?? transfer.providerPayoutId,
      provider: current?.providerPayoutProvider ?? transfer.providerPayoutProvider,
      receiptIssued: Boolean(current?.receiptUrl ?? current?.receiptIssuedAt),
      receiptUrl: current?.receiptUrl ?? null,
      noop: true,
      deduped: true,
    };
    return NextResponse.json(response);
  }

  let receiptIssued = false;
  let receiptUrl: string | null = transfer.receiptUrl ?? null;
  if (nextStatus === TransferStatus.COMPLETED && transfer.userId) {
    const nextReceiptUrl = transfer.receiptUrl ?? buildReceiptUrl(transfer.id);
    const issuance = await issueReceiptAtomically(
      transfer.id,
      transfer.userId,
      nextReceiptUrl
    );
    receiptIssued = issuance.issued || Boolean(transfer.receiptUrl);
    receiptUrl = nextReceiptUrl;
  }

  await prisma.transferEvent.create({
    data: {
      transferId: transfer.id,
      type: "PAYOUT_RECONCILED",
      message: `Payout reconciled. provider=${transfer.providerPayoutProvider} ref=${transfer.providerPayoutId} providerStatus=${normalizedStatus} after=${nextStatus}`,
    },
  });

  const response: ReconcileResponse = {
    ok: true,
    beforeStatus: transfer.status,
    afterStatus: nextStatus,
    providerStatus: normalizedStatus,
    providerPayoutId: transfer.providerPayoutId,
    provider: transfer.providerPayoutProvider,
    receiptIssued,
    receiptUrl,
    noop: false,
  };
  return NextResponse.json(response);
}
