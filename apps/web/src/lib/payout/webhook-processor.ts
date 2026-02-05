import { Prisma, TransferStatus } from "@prisma/client";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/src/lib/prisma";
import { mapProviderStatus } from "@/src/lib/payout/provider-state";
import { ensureReceiptIssued } from "@/src/lib/receipt-issue";

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

export function verifyWebhookSignature(options: {
  secret: string;
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
}) {
  const { secret, rawBody, signatureHeader, timestampHeader } = options;
  if (!signatureHeader || !secret) {
    return false;
  }
  const mode = (process.env.WEBHOOK_SIGNATURE_MODE ?? "").toLowerCase();
  const base =
    mode === "provider_v1" ? `${timestampHeader ?? ""}.${rawBody}` : rawBody;
  const expected = createHmac("sha256", secret).update(base).digest("hex");
  if (expected.length !== signatureHeader.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHeader, "hex"));
  } catch {
    return false;
  }
}

export async function processPayoutWebhook(
  input: ProcessInput,
  options?: { skipCreate?: boolean }
): Promise<ProcessResult> {
  const statusRaw = input.status.toUpperCase();
  const mapping = mapProviderStatus(statusRaw);

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

  if (!mapping) {
    if (!options?.skipCreate) {
      await prisma.payoutWebhookEvent.create({
        data: {
          eventId: input.eventId,
          provider: input.provider,
          providerPayoutId: input.payoutId,
          status: statusRaw,
          outcome: "noop",
          rawHash: input.rawHash,
          occurredAt: input.occurredAt,
          signatureTimestamp: input.signatureTimestamp,
          transferId: transfer.id,
        },
      });
    }
    return { transitioned: false, outcome: "noop" as const, deduped: false };
  }

  const finalStatus = mapping.transferStatus;

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
          await ensureReceiptIssued({ transferId: transfer.id });
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

        await ensureReceiptIssued({ transferId: transfer.id });

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
        await ensureReceiptIssued({ transferId: transfer.id });
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

      if (mapping.eventType) {
        await tx.transferEvent.create({
          data: {
            transferId: transfer.id,
            type: mapping.eventType,
            message:
              mapping.eventType === "PAYOUT_COMPLETED"
                ? `Payout completed. ref=${input.payoutId}`
                : `Payout failed. ref=${input.payoutId}`,
          },
        });
      }

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
