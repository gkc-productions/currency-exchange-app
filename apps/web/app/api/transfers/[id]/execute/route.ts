import { NextResponse } from "next/server";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import { isSameOrigin } from "@/src/lib/security";
import { ALLOW_SIMULATED_PAYOUTS } from "@/src/lib/runtime";

const DEV_BYPASS_HEADER = "x-dev-bypass-auth";
const DEV_EMAIL_HEADER = "x-dev-user-email";

type SessionLike = { user?: { email?: string | null } | null } | null;

type PayoutResult = {
  ok: boolean;
  provider: string;
  mode: "SIMULATED" | "LIVE";
  reason?: string;
};

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

function shouldFailPayout(referenceCode: string, memo: string | null) {
  if (referenceCode.endsWith("F")) {
    return true;
  }
  if (!memo) {
    return false;
  }
  return memo.toUpperCase().includes("FAIL");
}

function simulatePayout(referenceCode: string, memo: string | null): PayoutResult {
  if (shouldFailPayout(referenceCode, memo)) {
    return {
      ok: false,
      provider: "MockPayout",
      mode: "SIMULATED",
      reason: "Simulated payout failed",
    };
  }
  return {
    ok: true,
    provider: "MockPayout",
    mode: "SIMULATED",
  };
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
    select: { id: true, status: true, userId: true, referenceCode: true, memo: true },
  });

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transfer.status === "COMPLETED" || transfer.status === "FAILED") {
    return NextResponse.json({ ok: true, status: transfer.status });
  }

  if (transfer.status !== "READY") {
    return NextResponse.json({ error: "Transfer not ready for payout." }, { status: 400 });
  }

  const payout = simulatePayout(transfer.referenceCode, transfer.memo);
  const startedMessage = "Payout started (simulated).";
  const completedMessage = payout.ok
    ? "Payout completed (simulated)."
    : "Payout failed (simulated).";
  const finalStatus = payout.ok ? TransferStatus.COMPLETED : TransferStatus.FAILED;

  const issued = await prisma.$transaction(async (tx) => {
    const updated = await tx.transfer.updateMany({
      where: {
        id: transfer.id,
        userId: user.id,
        status: TransferStatus.READY,
      },
      data: { status: TransferStatus.PROCESSING },
    });

    if (updated.count !== 1) {
      return false;
    }

    await tx.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: "PAYOUT_STARTED",
        message: startedMessage,
      },
    });

    await tx.transfer.update({
      where: { id: transfer.id },
      data: { status: finalStatus },
    });

    await tx.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: payout.ok ? "PAYOUT_COMPLETED" : "PAYOUT_FAILED",
        message: completedMessage,
      },
    });

    return true;
  });

  if (!issued) {
    const current = await prisma.transfer.findUnique({
      where: { id: transfer.id },
      select: { status: true, userId: true },
    });

    if (!current || current.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (current.status === "COMPLETED" || current.status === "FAILED") {
      return NextResponse.json({ ok: true, status: current.status });
    }

    return NextResponse.json({ error: "Transfer not ready for payout." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: finalStatus, payout });
}
