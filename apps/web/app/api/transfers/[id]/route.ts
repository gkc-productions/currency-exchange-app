import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getMessages } from "@/src/lib/i18n/messages";
import { sendReceiptEmail } from "@/src/lib/email";

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const allowedTransitions: Record<string, Set<string>> = {
  READY: new Set(["PROCESSING", "CANCELED"]),
  PROCESSING: new Set(["COMPLETED", "FAILED"]),
};

const transferStatusValues = new Set<TransferStatus>(
  Object.values(TransferStatus)
);

function isTransferStatus(value: string): value is TransferStatus {
  return transferStatusValues.has(value as TransferStatus);
}

function quoteSummary(quote: {
  id: string;
  rail: string;
  sendAmount: unknown;
  appliedRate: unknown;
  totalFee: unknown;
  recipientGets: unknown;
  expiresAt: Date;
  createdAt: Date;
  fromAsset: { code: string; name: string; decimals: number };
  toAsset: { code: string; name: string; decimals: number };
}) {
  return {
    id: quote.id,
    rail: quote.rail,
    fromAsset: {
      code: quote.fromAsset.code,
      name: quote.fromAsset.name,
      decimals: quote.fromAsset.decimals,
    },
    toAsset: {
      code: quote.toAsset.code,
      name: quote.toAsset.name,
      decimals: quote.toAsset.decimals,
    },
    sendAmount: Number(quote.sendAmount),
    appliedRate: Number(quote.appliedRate),
    totalFee: Number(quote.totalFee),
    recipientGets: Number(quote.recipientGets),
    expiresAt: quote.expiresAt,
    createdAt: quote.createdAt,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      cryptoPayout: true,
      quote: {
        include: {
          fromAsset: { select: { code: true, name: true, decimals: true } },
          toAsset: { select: { code: true, name: true, decimals: true } },
        },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  if (transfer.status === "EXPIRED") {
    return NextResponse.json(
      { error: "Transfer expired", expired: true },
      { status: 410 }
    );
  }

    return NextResponse.json({
      transfer: {
        id: transfer.id,
        referenceCode: transfer.referenceCode,
        quoteId: transfer.quoteId,
        status: transfer.status,
        payoutRail: transfer.payoutRail,
        recipientName: transfer.recipientName,
        recipientCountry: transfer.recipientCountry,
        recipientPhone: transfer.recipientPhone,
        recipientBankName: transfer.recipientBankName,
        recipientBankAccount: transfer.recipientBankAccount,
        recipientMobileMoneyProvider: transfer.recipientMobileMoneyProvider,
        recipientMobileMoneyNumber: transfer.recipientMobileMoneyNumber,
        recipientLightningInvoice: transfer.recipientLightningInvoice,
        memo: transfer.memo,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
      },
    cryptoPayout: transfer.cryptoPayout
      ? {
          id: transfer.cryptoPayout.id,
          transferId: transfer.cryptoPayout.transferId,
          network: transfer.cryptoPayout.network,
          invoice: transfer.cryptoPayout.invoice,
          paymentHash: transfer.cryptoPayout.paymentHash,
          address: transfer.cryptoPayout.address,
          amountSats: transfer.cryptoPayout.amountSats,
          status: transfer.cryptoPayout.status,
          createdAt: transfer.cryptoPayout.createdAt,
          updatedAt: transfer.cryptoPayout.updatedAt,
        }
      : null,
    quote: quoteSummary(transfer.quote),
    events: transfer.events.map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      createdAt: event.createdAt,
    })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
  }

  let payload: { status?: unknown };
  try {
    payload = (await req.json()) as { status?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const statusInput = readRequiredString(payload.status);
  if (!statusInput) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }
  const nextStatus = statusInput.toUpperCase();
  if (!isTransferStatus(nextStatus)) {
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      quote: {
        include: {
          fromAsset: { select: { code: true } },
          toAsset: { select: { code: true } },
        },
      },
    },
  });

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  if (transfer.status === nextStatus) {
    return NextResponse.json(
      { error: "Invalid status transition" },
      { status: 409 }
    );
  }

  const allowed = allowedTransitions[transfer.status];
  if (!allowed || !allowed.has(nextStatus)) {
    return NextResponse.json(
      { error: "Invalid status transition" },
      { status: 409 }
    );
  }

  if (transfer.status === "READY" && nextStatus === "PROCESSING") {
    if (transfer.quote.expiresAt.getTime() <= Date.now()) {
      const updated = await prisma.transfer.update({
        where: { id: transferId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Quote expired", expired: true, transfer: updated },
        { status: 410 }
      );
    }
  }

  const messages = getMessages("en");
  const statusEventMessage: Partial<Record<TransferStatus, string>> = {
    PROCESSING: messages.transferProcessingEvent,
    COMPLETED: messages.transferCompletedEvent,
    FAILED: messages.transferFailedEvent,
    CANCELED: messages.transferCanceledEvent,
  };
  const eventMessage = statusEventMessage[nextStatus];
  if (!eventMessage) {
    return NextResponse.json(
      { error: messages.transferUpdateError },
      { status: 500 }
    );
  }

  let updated;
  try {
    [updated] = await prisma.$transaction([
      prisma.transfer.update({
        where: { id: transferId },
        data: { status: nextStatus },
      }),
      prisma.transferEvent.create({
        data: {
          transferId,
          type: nextStatus,
          message: eventMessage,
        },
      }),
    ]);
  } catch {
    return NextResponse.json(
      { error: messages.transferUpdateError },
      { status: 500 }
    );
  }

  if (nextStatus === "COMPLETED" && transfer.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: transfer.userId },
        select: { email: true },
      });
      if (user?.email) {
        const receiptUrl = `${process.env.NEXTAUTH_URL ?? "https://app.clarisend.co"}/en/transfer/${transfer.id}`;
        await sendReceiptEmail({
          to: user.email,
          referenceCode: transfer.referenceCode,
          status: nextStatus,
          sendAmount: Number(transfer.quote.sendAmount),
          totalFee: Number(transfer.quote.totalFee),
          recipientGets: Number(transfer.quote.recipientGets),
          fromAsset: transfer.quote.fromAsset.code,
          toAsset: transfer.quote.toAsset.code,
          receiptUrl,
        });
        await prisma.transfer.update({
          where: { id: transferId },
          data: {
            receiptLastSentAt: new Date(),
            receiptSendCount: { increment: 1 },
          },
        });
      }
    } catch {
      // Email failures should not block status updates.
    }
  }

  return NextResponse.json(updated);
}
