import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import { isSameOrigin } from "@/src/lib/security";
import { ALLOW_SIMULATED_PAYOUTS } from "@/src/lib/runtime";
import { getPayoutExecutor } from "@/src/lib/payout";

const DEV_BYPASS_HEADER = "x-dev-bypass-auth";
const DEV_EMAIL_HEADER = "x-dev-user-email";

type SessionLike = { user?: { email?: string | null } | null } | null;

type ExecuteResponse = {
  ok: boolean;
  status: string;
  providerPayoutId?: string | null;
};

function formatEventMessage(
  base: string,
  meta: { ref?: string; code?: string; message?: string }
) {
  const parts = [base];
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

function readDevBypassSession(req: Request): SessionLike {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  if (process.env.DEV_BYPASS_AUTH !== "1") {
    return null;
  }
  const bypass = req.headers.get(DEV_BYPASS_HEADER);
  const email = req.headers.get(DEV_EMAIL_HEADER);
  if (bypass !== "1") {
    return null;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

function isDevBypassRequest(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (process.env.DEV_BYPASS_AUTH !== "1") {
    return false;
  }
  return req.headers.get(DEV_BYPASS_HEADER) === "1";
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
    select: {
      id: true,
      status: true,
      userId: true,
      referenceCode: true,
      memo: true,
      providerPayoutId: true,
    },
  });

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transfer.status === "COMPLETED" || transfer.status === "FAILED") {
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

  if (transfer.status !== "READY") {
    return NextResponse.json({ error: "Transfer not ready for payout." }, { status: 400 });
  }

  if (transfer.providerPayoutId) {
    return NextResponse.json({
      ok: true,
      status: TransferStatus.PROCESSING,
      providerPayoutId: transfer.providerPayoutId,
    });
  }

  const executor = getPayoutExecutor();
  const execution = await executor.execute({
    transferId: transfer.id,
    referenceCode: transfer.referenceCode,
    memo: transfer.memo,
  });
  const startMessage = formatEventMessage("Payout started.", {
    ref: execution.providerRef ?? execution.providerPayoutId,
    code: execution.errorCode,
    message: execution.errorMessage ?? execution.message,
  });

  const issued = await prisma.$transaction(async (tx) => {
    const updated = await tx.transfer.updateMany({
      where: {
        id: transfer.id,
        userId: user.id,
        status: TransferStatus.READY,
        providerPayoutId: null,
      },
      data: {
        status: TransferStatus.PROCESSING,
        providerPayoutId: execution.providerPayoutId,
        providerPayoutStatus: execution.status,
        providerPayoutProvider: execution.provider,
        providerPayoutUpdatedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      return false;
    }

    await tx.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: "PAYOUT_STARTED",
        message: startMessage,
      },
    });

    return true;
  });

  if (!issued) {
    const current = await prisma.transfer.findUnique({
      where: { id: transfer.id },
      select: { status: true, providerPayoutId: true, userId: true },
    });

    if (!current || current.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (current.status === "COMPLETED" || current.status === "FAILED" || current.status === "PROCESSING") {
      const response: ExecuteResponse = {
        ok: true,
        status: current.status,
        providerPayoutId: current.providerPayoutId ?? null,
      };
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Transfer not ready for payout." }, { status: 400 });
  }

  const response: ExecuteResponse = {
    ok: true,
    status: TransferStatus.PROCESSING,
    providerPayoutId: execution.providerPayoutId,
  };
  return NextResponse.json(response);
}
