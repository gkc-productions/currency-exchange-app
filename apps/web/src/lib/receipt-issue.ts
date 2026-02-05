import { prisma } from "@/src/lib/prisma";
import { TransferStatus } from "@prisma/client";

function getReceiptBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "https://app.clarisend.co";
}

function buildReceiptUrl(transferId: string, locale: string) {
  return `${getReceiptBaseUrl()}/${locale}/transfer/${transferId}`;
}

export async function ensureReceiptIssued(params: {
  transferId: string;
  locale?: string;
}) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: params.transferId },
    select: {
      id: true,
      status: true,
      receiptUrl: true,
      receiptIssuedAt: true,
    },
  });

  if (!transfer) {
    return { issued: false, receiptUrl: null as string | null };
  }

  if (transfer.status !== TransferStatus.COMPLETED) {
    return { issued: false, receiptUrl: transfer.receiptUrl ?? null };
  }

  if (transfer.receiptUrl || transfer.receiptIssuedAt) {
    return { issued: false, receiptUrl: transfer.receiptUrl ?? null };
  }

  const locale = params.locale ?? "en";
  const receiptUrl = buildReceiptUrl(transfer.id, locale);
  const update = await prisma.transfer.updateMany({
    where: {
      id: transfer.id,
      status: TransferStatus.COMPLETED,
      receiptUrl: null,
      receiptIssuedAt: null,
    },
    data: {
      receiptUrl,
      receiptIssuedAt: new Date(),
    },
  });

  if (update.count === 1) {
    return { issued: true, receiptUrl };
  }

  const refreshed = await prisma.transfer.findUnique({
    where: { id: transfer.id },
    select: { receiptUrl: true },
  });

  return { issued: false, receiptUrl: refreshed?.receiptUrl ?? null };
}
