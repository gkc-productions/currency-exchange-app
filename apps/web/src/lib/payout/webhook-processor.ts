import { Prisma, TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

const validStatuses = new Set(["COMPLETED", "FAILED"]);

type ProcessInput = {
  provider: string;
  payoutId: string;
  transferId: string;
  eventId: string;
  status: string;
  occurredAt: Date;
  signatureTimestamp: Date;
  rawHash: string;
  rawPayload: Prisma.InputJsonValue | null;
};

type ProcessResult = {
  transitioned: boolean;
  outcome: "applied" | "noop";
  deduped: boolean;
};

function mapProviderStatusToTransferStatus(providerStatus: string) {
  if (providerStatus === "COMPLETED") {
    return TransferStatus.COMPLETED;
  }
  if (providerStatus === "FAILED") {
    return TransferStatus.FAILED;
  }
  return TransferStatus.PROCESSING;
}

function getReceiptBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "https://app.clarisend.co";
}

function buildReceiptUrl(transferId: string) {
  return `${getReceiptBaseUrl()}/en/transfer/${transferId}`;
}

export async function processPayoutWebhook(
  input: ProcessInput,
  options?: { skipCreate?: boolean }
): Promise<ProcessResult> {
  const statusRaw = input.status.toUpperCase();
  if (!validStatuses.has(statusRaw)) {
    throw new Error("invalid_status");
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: input.transferId },
    select: { id: true, status: true, providerPayoutId: true, receiptUrl: true },
  });

  if (!transfer) {
    throw new Error("transfer_not_found");
  }

  if (transfer.providerPayoutId !== input.payoutId) {
    throw new Error("payout_mismatch");
  }

  const finalStatus = mapProviderStatusToTransferStatus(statusRaw);
  const receiptUrl = buildReceiptUrl(transfer.id);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (!options?.skipCreate) {
        await tx.payoutWebhookEvent.create({
          data: {
            eventId: input.eventId,
            provider: input.provider,
            providerPayoutId: input.payoutId,
            status: statusRaw,
            outcome: "received",
            rawHash: input.rawHash,
            occurredAt: input.occurredAt,
            signatureTimestamp: input.signatureTimestamp,
            transferId: transfer.id,
          },
        });
      }

      if (transfer.status === TransferStatus.COMPLETED) {
        if (finalStatus === TransferStatus.COMPLETED) {
          await tx.transfer.updateMany({
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
        }
        if (!options?.skipCreate) {
          await tx.payoutWebhookEvent.update({
            where: { eventId: input.eventId },
            data: { outcome: "noop" },
          });
        }
        return { transitioned: false, outcome: "noop" as const };
      }

      if (transfer.status === TransferStatus.FAILED && finalStatus === TransferStatus.FAILED) {
        if (!options?.skipCreate) {
          await tx.payoutWebhookEvent.update({
            where: { eventId: input.eventId },
            data: { outcome: "noop" },
          });
        }
        return { transitioned: false, outcome: "noop" as const };
      }

      if (transfer.status === TransferStatus.FAILED && finalStatus === TransferStatus.COMPLETED) {
        if (transfer.receiptUrl) {
          if (!options?.skipCreate) {
            await tx.payoutWebhookEvent.update({
              where: { eventId: input.eventId },
              data: { outcome: "noop" },
            });
          }
          return { transitioned: false, outcome: "noop" as const };
        }
        const transition = await tx.transfer.updateMany({
          where: {
            id: transfer.id,
            status: TransferStatus.FAILED,
            receiptUrl: null,
          },
          data: {
            status: finalStatus,
            providerPayoutStatus: statusRaw,
            providerPayoutProvider: input.provider,
            providerPayoutUpdatedAt: input.occurredAt,
          },
        });

        if (transition.count !== 1) {
          if (!options?.skipCreate) {
            await tx.payoutWebhookEvent.update({
              where: { eventId: input.eventId },
              data: { outcome: "noop" },
            });
          }
          return { transitioned: false, outcome: "noop" as const };
        }

        await tx.transfer.updateMany({
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

        await tx.transferEvent.create({
          data: {
            transferId: transfer.id,
            type: "PAYOUT_RESOLVED_AFTER_FAILURE",
            message: `Payout resolved after failure. ref=${input.payoutId}`,
          },
        });

        if (!options?.skipCreate) {
          await tx.payoutWebhookEvent.update({
            where: { eventId: input.eventId },
            data: { outcome: "applied" },
          });
        }

        return { transitioned: true, outcome: "applied" as const };
      }

      const transition = await tx.transfer.updateMany({
        where: {
          id: transfer.id,
          status: TransferStatus.PROCESSING,
        },
        data: {
          status: finalStatus,
          providerPayoutStatus: statusRaw,
          providerPayoutProvider: input.provider,
          providerPayoutUpdatedAt: input.occurredAt,
        },
      });

      if (transition.count !== 1) {
        if (!options?.skipCreate) {
          await tx.payoutWebhookEvent.update({
            where: { eventId: input.eventId },
            data: { outcome: "noop" },
          });
        }
        return { transitioned: false, outcome: "noop" as const };
      }

      if (finalStatus === TransferStatus.COMPLETED) {
        await tx.transfer.updateMany({
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
      }

      const attempt = await tx.payoutAttempt.findFirst({
        where: {
          transferId: transfer.id,
          status: "SUBMITTED",
          ...(input.payoutId ? { providerPayoutId: input.payoutId } : {}),
        },
        orderBy: { startedAt: "desc" },
      });
      if (attempt) {
        await tx.payoutAttempt.update({
          where: { id: attempt.id },
          data: {
            status: finalStatus === TransferStatus.COMPLETED ? "SUCCEEDED" : "FAILED",
            finishedAt: new Date(),
            errorCode: finalStatus === TransferStatus.FAILED ? "WEBHOOK_FAILED" : null,
            errorMessage:
              finalStatus === TransferStatus.FAILED ? "Provider reported failure." : null,
          },
        });
      }

      await tx.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: finalStatus === TransferStatus.COMPLETED ? "PAYOUT_COMPLETED" : "PAYOUT_FAILED",
          message:
            finalStatus === TransferStatus.COMPLETED
              ? `Payout completed. ref=${input.payoutId}`
              : `Payout failed. ref=${input.payoutId}`,
        },
      });

      if (!options?.skipCreate) {
        await tx.payoutWebhookEvent.update({
          where: { eventId: input.eventId },
          data: { outcome: "applied" },
        });
      }

      return { transitioned: true, outcome: "applied" as const };
    });

    return { transitioned: updated.transitioned, outcome: updated.outcome, deduped: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { transitioned: false, outcome: "noop", deduped: true };
    }
    throw err;
  }
}
