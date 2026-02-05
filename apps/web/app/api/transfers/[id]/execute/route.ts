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
import { getPayoutExecutorByName, getPayoutProviders } from "@/src/lib/payout";
import { getProviderStates, updateProviderHealth } from "@/src/lib/payout/provider-state";

type SessionLike = { user?: { email?: string | null } | null } | null;

type ExecuteResponse = {
  ok: boolean;
  status: string;
  providerPayoutId?: string | null;
  errorCode?: string;
  retryAfterSeconds?: number;
};

function formatEventMessage(
  base: string,
  meta: { ref?: string; code?: string; message?: string; provider?: string; attempt?: number }
) {
  const parts = [base];
  if (meta.provider) {
    parts.push(`provider=${meta.provider}`);
  }
  if (typeof meta.attempt === "number") {
    parts.push(`attempt=${meta.attempt}`);
  }
  if (meta.ref) {
    parts.push(`ref=${meta.ref}`);
  }
  if (meta.code) {
    parts.push(`code=${meta.code}`);
  }
  if (meta.message) {
    parts.push(`message=${meta.message}`);
  }
  return parts.join(" ");
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function jsonError(
  message: string,
  errorCode: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: message, errorCode, message, ...(extra ?? {}) },
    { status }
  );
}

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
    return jsonError("Not available", "NOT_AVAILABLE", 404);
  }

  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!session?.user?.email) {
    return jsonError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const devBypassActive = isDevBypassRequest(req);
  if (!devBypassActive && !isSameOrigin(req)) {
    return jsonError(
      "This action is only available from the ClariSend app.",
      "FORBIDDEN_ORIGIN",
      403
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return jsonError("Invalid transfer id", "INVALID_TRANSFER_ID", 400);
  }

  const user = devBypassActive
    ? await ensureDevUser(session.user.email)
    : await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });

  if (!user?.id) {
    return jsonError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      id: true,
      status: true,
      userId: true,
      referenceCode: true,
      memo: true,
      providerPayoutId: true,
      payoutAttemptCount: true,
      payoutLastAttemptAt: true,
      payoutProviderCursor: true,
      payoutLastErrorCode: true,
      payoutLastErrorMessage: true,
    },
  });

  if (!transfer || transfer.userId !== user.id) {
    return jsonError("Not found", "NOT_FOUND", 404);
  }

  if (transfer.status === "COMPLETED") {
    const response: ExecuteResponse = {
      ok: true,
      status: transfer.status,
      providerPayoutId: transfer.providerPayoutId ?? null,
    };
    return NextResponse.json(response);
  }

  if (transfer.status === "PROCESSING") {
    const response: ExecuteResponse = {
      ok: true,
      status: transfer.status,
      providerPayoutId: transfer.providerPayoutId ?? null,
    };
    return NextResponse.json(response);
  }
  const maxAttempts = parseNumber(process.env.PAYOUT_MAX_ATTEMPTS, 3);
  const cooldownMs = parseNumber(process.env.PAYOUT_RETRY_COOLDOWN_MS, 30_000);
  const providers = getPayoutProviders();
  if (providers.length === 0) {
    return jsonError("No payout providers available.", "NO_PAYOUT_PROVIDERS", 500);
  }

  const providerStates = await getProviderStates(providers.map((provider) => provider.name));
  const isEligibleProvider = (index: number) => {
    const provider = providers[index];
    if (!provider) {
      return false;
    }
    const state = providerStates.get(provider.name);
    return state ? state.isEnabled && state.isHealthy : true;
  };

  let providerIndex = transfer.payoutProviderCursor ?? 0;
  if (!isEligibleProvider(providerIndex)) {
    let cursor = providerIndex + 1;
    while (cursor < providers.length && !isEligibleProvider(cursor)) {
      cursor += 1;
    }
    if (cursor >= providers.length) {
      return jsonError(
        "No eligible payout providers.",
        "PAYOUT_NO_ELIGIBLE_PROVIDERS",
        409
      );
    }
    providerIndex = cursor;
  }

  if (transfer.status !== "READY" && transfer.status !== "FAILED") {
    return jsonError("not_executable", "NOT_EXECUTABLE", 400);
  }

  const resolveExecutor = (index: number) =>
    getPayoutExecutorByName(providers[index]?.name ?? "mock") ?? providers[index];

  if (transfer.status === "FAILED") {
    const lastAttemptAt = transfer.payoutLastAttemptAt?.getTime() ?? 0;
    const now = Date.now();
    if (lastAttemptAt && now - lastAttemptAt < cooldownMs) {
      const retryAfterSeconds = Math.ceil((cooldownMs - (now - lastAttemptAt)) / 1000);
      return jsonError("Retry later.", "RETRY_LATER", 429, { retryAfterSeconds });
    }

    if (transfer.payoutAttemptCount >= maxAttempts) {
      const nextIndex = providerIndex + 1;
      if (nextIndex >= providers.length) {
        return NextResponse.json(
          { error: "Payout attempts exhausted.", errorCode: "PAYOUT_EXHAUSTED" },
          { status: 409 }
        );
      }

      const failover = await prisma.$transaction(async (tx) => {
        const updated = await tx.transfer.updateMany({
          where: {
            id: transfer.id,
            userId: user.id,
            status: TransferStatus.FAILED,
            payoutProviderCursor: providerIndex,
            payoutAttemptCount: transfer.payoutAttemptCount,
          },
          data: {
            payoutProviderCursor: nextIndex,
            payoutAttemptCount: 0,
            payoutLastAttemptAt: null,
            payoutLastErrorCode: null,
            payoutLastErrorMessage: null,
          },
        });
        if (updated.count !== 1) {
          return false;
        }
        await tx.transferEvent.create({
          data: {
            transferId: transfer.id,
            type: "PAYOUT_FAILOVER",
            message: formatEventMessage("Payout failover.", {
              provider: providers[providerIndex]?.name,
              message: `next=${providers[nextIndex]?.name ?? "unknown"}`,
            }),
          },
        });
        return true;
      });

      if (!failover) {
        const current = await prisma.transfer.findUnique({
          where: { id: transfer.id },
          select: { status: true, providerPayoutId: true },
        });
        return NextResponse.json({
          ok: true,
          status: current?.status ?? transfer.status,
          providerPayoutId: current?.providerPayoutId ?? null,
        });
      }

      providerIndex = nextIndex;
      transfer.payoutAttemptCount = 0;
    }

    const retryExecutor = resolveExecutor(providerIndex);
    if (!transfer.providerPayoutId && !retryExecutor.supportsNewPayoutOnRetry) {
      return jsonError("not_executable", "NOT_EXECUTABLE", 400);
    }
  }

  const executor = resolveExecutor(providerIndex);
  if (executor.name === "real" && process.env.PAYOUT_EXTERNAL_CALLS === "0") {
    return jsonError("payout_disabled", "PAYOUT_DISABLED", 503);
  }
  const attemptNumber = transfer.payoutAttemptCount + 1;
  const claimResult = await prisma.transfer.updateMany({
    where: {
      id: transfer.id,
      userId: user.id,
      status: transfer.status,
      payoutProviderCursor: transfer.payoutProviderCursor ?? 0,
      payoutAttemptCount: transfer.payoutAttemptCount,
    },
    data: {
      status: TransferStatus.PROCESSING,
      payoutAttemptCount: { increment: 1 },
      payoutLastAttemptAt: new Date(),
      payoutLastErrorCode: null,
      payoutLastErrorMessage: null,
      payoutProviderCursor: providerIndex,
    },
  });

  if (claimResult.count !== 1) {
    const current = await prisma.transfer.findUnique({
      where: { id: transfer.id },
      select: { status: true, providerPayoutId: true },
    });
    return NextResponse.json({
      ok: true,
      status: current?.status ?? transfer.status,
      providerPayoutId: current?.providerPayoutId ?? null,
    });
  }

  const attemptRecord = await prisma.$transaction(async (tx) => {
    const nextAttempt = await tx.payoutAttempt.count({
      where: { transferId: transfer.id },
    });
    return tx.payoutAttempt.create({
      data: {
        transferId: transfer.id,
        providerKey: executor.name,
        attemptNumber: nextAttempt + 1,
        status: "STARTED",
      },
    });
  });

  if (providerIndex !== (transfer.payoutProviderCursor ?? 0)) {
    await prisma.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: "PAYOUT_FAILOVER",
        message: formatEventMessage("Payout failover.", {
          provider: providers[transfer.payoutProviderCursor ?? 0]?.name ?? "unknown",
          message: `next=${providers[providerIndex]?.name ?? "unknown"}`,
        }),
      },
    });
  }

  const execution = await executor.execute({
    transferId: transfer.id,
    referenceCode: transfer.referenceCode,
    memo: transfer.memo,
  });
  const startMessage = formatEventMessage("Payout started.", {
    provider: execution.provider,
    attempt: attemptNumber,
    ref: execution.providerRef ?? execution.providerPayoutId,
  });
  const failedMessage = formatEventMessage("Payout failed.", {
    provider: execution.provider,
    attempt: attemptNumber,
    ref: execution.providerRef ?? execution.providerPayoutId,
    code: execution.errorCode,
    message: execution.errorMessage ?? execution.message,
  });

  const nextStatus =
    execution.status === "FAILED" ? TransferStatus.FAILED : TransferStatus.PROCESSING;

  await prisma.$transaction(async (tx) => {
    await tx.transfer.update({
      where: { id: transfer.id },
      data: {
        status: nextStatus,
        providerPayoutId: execution.providerPayoutId,
        providerPayoutStatus: execution.status,
        providerPayoutProvider: execution.provider,
        providerPayoutUpdatedAt: new Date(),
        payoutLastErrorCode: execution.errorCode ?? null,
        payoutLastErrorMessage: execution.errorMessage ?? execution.message ?? null,
      },
    });

    await tx.payoutAttempt.update({
      where: { id: attemptRecord.id },
      data: {
        status: execution.status === "FAILED" ? "FAILED" : "SUBMITTED",
        providerPayoutId: execution.providerPayoutId,
        errorCode: execution.errorCode ?? null,
        errorMessage: execution.errorMessage ?? execution.message ?? null,
        finishedAt: execution.status === "FAILED" ? new Date() : null,
      },
    });

    await tx.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: "PAYOUT_STARTED",
        message: startMessage,
      },
    });

    if (execution.status === "FAILED") {
      await tx.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: "PAYOUT_FAILED",
          message: failedMessage,
        },
      });
    }
  });

  await updateProviderHealth({
    providerKey: execution.provider,
    isHealthy: execution.status !== "FAILED",
    errorCode: execution.errorCode ?? null,
    errorMessage: execution.errorMessage ?? execution.message ?? null,
  });

  const response: ExecuteResponse = {
    ok: true,
    status: nextStatus,
    providerPayoutId: execution.providerPayoutId,
  };
  return NextResponse.json(response);
}
