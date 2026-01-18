import { createHash } from "crypto";
import { CryptoPayoutStatus, PayoutRail, TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getMessages } from "@/src/lib/i18n/messages";
import { ALLOW_SIMULATED_PAYOUTS, SIMULATED_PAYOUTS } from "@/src/lib/runtime";
import { canTransitionPayout, canTransitionTransfer } from "@/src/lib/transfer-state";
import { alertPayoutFailure } from "@/src/lib/alerts";
import { sendTransferStatusEmail } from "@/src/lib/email";

type PayoutMode = "SIMULATED" | "LIVE";

type PayoutResult = {
  ok: boolean;
  provider: string;
  mode: PayoutMode;
  reason?: string;
};

type PayoutAdapter = {
  rail: PayoutRail;
  provider: string;
  execute: (transfer: { id: string; payoutRail: PayoutRail }) => Promise<PayoutResult>;
};

function deterministicSuccess(seed: string) {
  const hash = createHash("sha256").update(seed).digest("hex");
  const value = parseInt(hash.slice(0, 2), 16);
  return value % 4 !== 0;
}

function simulatedAdapter(rail: PayoutRail, provider: string): PayoutAdapter {
  return {
    rail,
    provider,
    async execute(transfer: { id: string; payoutRail: PayoutRail }) {
      if (!ALLOW_SIMULATED_PAYOUTS) {
        return {
          ok: false,
          provider,
          mode: SIMULATED_PAYOUTS ? "SIMULATED" : "LIVE",
          reason: "Simulated payouts are disabled in this environment.",
        };
      }
      const ok = deterministicSuccess(`${rail}:${transfer.id}`);
      return {
        ok,
        provider,
        mode: "SIMULATED",
        ...(ok ? {} : { reason: "Simulated payout failed" }),
      };
    },
  };
}

const adapters: Record<PayoutRail, PayoutAdapter> = {
  BANK: simulatedAdapter("BANK", "BankSim"),
  MOBILE_MONEY: simulatedAdapter("MOBILE_MONEY", "MTN-Sim"),
  LIGHTNING: simulatedAdapter("LIGHTNING", "LightningSim"),
};

export async function executePayout({
  transferId,
  actor = "system",
}: {
  transferId: string;
  actor?: string;
}) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      cryptoPayout: true,
      quote: {
        include: {
          fromAsset: { select: { code: true } },
          toAsset: { select: { code: true } },
        },
      },
    },
  });

  if (!transfer) {
    return { ok: false, error: "Transfer not found." };
  }

  const adapter = adapters[transfer.payoutRail as PayoutRail];
  if (!adapter) {
    return { ok: false, error: "No payout adapter available." };
  }

  if (
    transfer.status !== TransferStatus.READY &&
    transfer.status !== TransferStatus.PROCESSING
  ) {
    return { ok: false, error: "Transfer not ready for payout." };
  }

  const messages = getMessages("en");
  const result = await adapter.execute({
    id: transfer.id,
    payoutRail: transfer.payoutRail as PayoutRail,
  });
  const finalStatus = result.ok ? TransferStatus.COMPLETED : TransferStatus.FAILED;

  const operations = [];

  let currentStatus = transfer.status;
  if (currentStatus === TransferStatus.READY) {
    if (!canTransitionTransfer(currentStatus, TransferStatus.PROCESSING)) {
      return { ok: false, error: "Invalid status transition." };
    }
    operations.push(
      prisma.transfer.update({
        where: { id: transfer.id },
        data: { status: TransferStatus.PROCESSING },
      })
    );
    operations.push(
      prisma.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: TransferStatus.PROCESSING,
          message: messages.transferProcessingEvent,
        },
      })
    );
    currentStatus = TransferStatus.PROCESSING;
  }

  if (!canTransitionTransfer(currentStatus, finalStatus)) {
    return { ok: false, error: "Invalid status transition." };
  }

  if (transfer.payoutRail === "LIGHTNING" && transfer.cryptoPayout) {
    const payoutNextStatus = result.ok
      ? CryptoPayoutStatus.PAID
      : CryptoPayoutStatus.FAILED;
    if (canTransitionPayout(transfer.cryptoPayout.status, payoutNextStatus)) {
      operations.push(
        prisma.cryptoPayout.update({
          where: { id: transfer.cryptoPayout.id },
          data: { status: payoutNextStatus },
        })
      );
    }
  }

  operations.push(
    prisma.transfer.update({
      where: { id: transfer.id },
      data: { status: finalStatus },
    })
  );

  if (result.ok) {
    operations.push(
      prisma.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: "PAID",
          message: messages.transferPaidEvent,
        },
      })
    );
    operations.push(
      prisma.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: TransferStatus.COMPLETED,
          message: messages.transferCompletedEvent,
        },
      })
    );
  } else {
    operations.push(
      prisma.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: TransferStatus.FAILED,
          message: messages.transferFailedEvent,
        },
      })
    );
  }

  operations.push(
    prisma.auditLog.create({
      data: {
        actor,
        action: "PAYOUT_EXECUTED",
        entityType: "Transfer",
        entityId: transfer.id,
        metadata: {
          rail: transfer.payoutRail,
          provider: result.provider,
          mode: result.mode,
          ok: result.ok,
          ...(result.reason ? { reason: result.reason } : {}),
        },
      },
    })
  );

  try {
    await prisma.$transaction(operations);
  } catch {
    return { ok: false, error: "Unable to record payout status." };
  }

  if (transfer.userId && (finalStatus === TransferStatus.COMPLETED || finalStatus === TransferStatus.FAILED)) {
    const user = await prisma.user.findUnique({
      where: { id: transfer.userId },
      select: { email: true },
    });
    if (user?.email) {
      const receiptUrl = `${process.env.NEXTAUTH_URL ?? "https://app.clarisend.co"}/en/transfer/${transfer.id}`;
      sendTransferStatusEmail({
        to: user.email,
        type: finalStatus as "COMPLETED" | "FAILED",
        referenceCode: transfer.referenceCode,
        sendAmount: Number(transfer.quote.sendAmount),
        totalFee: Number(transfer.quote.totalFee),
        recipientGets: Number(transfer.quote.recipientGets),
        fromAsset: transfer.quote.fromAsset.code,
        toAsset: transfer.quote.toAsset.code,
        recipientName: transfer.recipientName,
        receiptUrl,
        transferId: transfer.id,
        timestamp: new Date(),
      }).then(() => {
        return prisma.transfer.update({
          where: { id: transfer.id },
          data: {
            receiptLastSentAt: new Date(),
            receiptSendCount: { increment: 1 },
          },
        });
      }).catch(() => {
        // Email failure is handled in the email layer.
      });
    }
  }

  if (!result.ok) {
    alertPayoutFailure({
      transferId: transfer.id,
      context: {
        rail: transfer.payoutRail,
        provider: result.provider,
        mode: result.mode,
        reason: result.reason,
      },
    });
  }

  return { ok: result.ok, transfer, payout: result };
}
