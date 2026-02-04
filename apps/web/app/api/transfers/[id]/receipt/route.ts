import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import { sendReceiptEmail } from "@/src/lib/email";
import { enforceRateLimit } from "@/src/lib/rate-limit";
import { getClientIp, isSameOrigin } from "@/src/lib/security";

const RESEND_COOLDOWN_MS = 60 * 1000;

type QuoteAuditSnapshot = {
  quoteId: string;
  fromAsset: string;
  toAsset: string;
  sendAmount: number;
  marketRate: number;
  appliedRate: number;
  fxMarginPct: number;
  fixedFee: number;
  percentFee: number;
  totalFees: number;
  recipientGets: number;
  rateSource: string;
  rateTimestamp: string;
  expiresAt: string;
  lockedAt: string;
};

type AuditMetadata = {
  snapshot?: {
    quote?: QuoteAuditSnapshot;
  };
};

type SessionLike = { user?: { email?: string | null } | null } | null;

type TransferReceiptRow = {
  id: string;
  userId: string | null;
  status: string;
  referenceCode: string;
  receiptUrl: string | null;
  receiptIssuedAt: Date | null;
  receiptEmailSentAt: Date | null;
  receiptLastSentAt: Date | null;
  receiptSendCount: number;
};

function isQuoteAuditSnapshot(value: unknown): value is QuoteAuditSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.quoteId === "string" &&
    typeof candidate.fromAsset === "string" &&
    typeof candidate.toAsset === "string" &&
    typeof candidate.sendAmount === "number" &&
    typeof candidate.marketRate === "number" &&
    typeof candidate.appliedRate === "number" &&
    typeof candidate.fxMarginPct === "number" &&
    typeof candidate.fixedFee === "number" &&
    typeof candidate.percentFee === "number" &&
    typeof candidate.totalFees === "number" &&
    typeof candidate.recipientGets === "number" &&
    typeof candidate.rateSource === "string" &&
    typeof candidate.rateTimestamp === "string" &&
    typeof candidate.expiresAt === "string" &&
    typeof candidate.lockedAt === "string"
  );
}

function readDevBypassSession(req: Request): SessionLike {
  if (process.env.DEV_BYPASS_AUTH !== "1") {
    return null;
  }
  const bypass = req.headers.get("x-dev-bypass-auth");
  const email = req.headers.get("x-dev-user-email");
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
  return (
    process.env.DEV_BYPASS_AUTH === "1" &&
    req.headers.get("x-dev-bypass-auth") === "1" &&
    process.env.NODE_ENV !== "production"
  );
}

function getReceiptBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "https://app.clarisend.co";
}

function resolveLocale(req: Request) {
  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale");
  if (localeParam && localeParam.trim()) {
    return localeParam.trim();
  }
  const headerLocale = req.headers.get("x-locale");
  if (headerLocale && headerLocale.trim()) {
    return headerLocale.trim();
  }
  return "en";
}

async function resolveTransferSnapshot(transferId: string) {
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

  const auditLog = await prisma.auditLog.findFirst({
    where: { action: "TRANSFER_CREATED", entityType: "Transfer", entityId: transferId },
    orderBy: { createdAt: "desc" },
  });
  const metadata = auditLog?.metadata as AuditMetadata | null;
  const snapshotCandidate = metadata?.snapshot?.quote;
  const snapshot = isQuoteAuditSnapshot(snapshotCandidate) ? snapshotCandidate : null;

  return { transfer, snapshot, auditLog };
}

async function buildSnapshotFromTransfer(transfer: {
  id: string;
  quoteId: string;
  createdAt: Date;
  quote: {
    id: string;
    fromCode: string | null;
    toCode: string | null;
    fromAsset: { code: string };
    toAsset: { code: string };
    sendAmount: { toString(): string };
    marketRate: { toNumber?(): number; toString(): string };
    appliedRate: { toNumber?(): number; toString(): string };
    fxMarginPct: { toNumber?(): number; toString(): string };
    feeFixed: { toString(): string };
    feePct: { toNumber?(): number; toString(): string };
    totalFee: { toString(): string };
    recipientGets: { toString(): string };
    rateSource: string;
    rateTimestamp: Date;
    expiresAt: Date;
  };
}) {
  const lockLog = await prisma.auditLog.findFirst({
    where: { action: "QUOTE_LOCKED", entityType: "Quote", entityId: transfer.quoteId },
    orderBy: { createdAt: "desc" },
  });
  const lockedAt = lockLog?.createdAt ?? transfer.createdAt;

  const marketRate =
    typeof transfer.quote.marketRate.toNumber === "function"
      ? transfer.quote.marketRate.toNumber()
      : Number(transfer.quote.marketRate.toString());
  const appliedRate =
    typeof transfer.quote.appliedRate.toNumber === "function"
      ? transfer.quote.appliedRate.toNumber()
      : Number(transfer.quote.appliedRate.toString());
  const fxMarginPct =
    typeof transfer.quote.fxMarginPct.toNumber === "function"
      ? transfer.quote.fxMarginPct.toNumber()
      : Number(transfer.quote.fxMarginPct.toString());
  const percentFee =
    typeof transfer.quote.feePct.toNumber === "function"
      ? transfer.quote.feePct.toNumber()
      : Number(transfer.quote.feePct.toString());
  const sendAmount = Number(transfer.quote.sendAmount.toString());
  const fixedFee = Number(transfer.quote.feeFixed.toString());
  const totalFees = Number(transfer.quote.totalFee.toString());
  const recipientGets = Number(transfer.quote.recipientGets.toString());

  const snapshot: QuoteAuditSnapshot = {
    quoteId: transfer.quote.id,
    fromAsset: transfer.quote.fromCode ?? transfer.quote.fromAsset.code,
    toAsset: transfer.quote.toCode ?? transfer.quote.toAsset.code,
    sendAmount,
    marketRate,
    appliedRate,
    fxMarginPct,
    fixedFee,
    percentFee,
    totalFees,
    recipientGets,
    rateSource: transfer.quote.rateSource,
    rateTimestamp: transfer.quote.rateTimestamp.toISOString(),
    expiresAt: transfer.quote.expiresAt.toISOString(),
    lockedAt: lockedAt.toISOString(),
  };

  return snapshot;
}

async function findTransferReceiptRow(transferId: string) {
  return prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      id: true,
      userId: true,
      status: true,
      referenceCode: true,
      receiptUrl: true,
      receiptIssuedAt: true,
      receiptEmailSentAt: true,
      receiptLastSentAt: true,
      receiptSendCount: true,
    },
  });
}

async function issueReceiptAtomically(
  transferId: string,
  userId: string,
  receiptUrl: string
) {
  const issuedAt = new Date();
  const result = await prisma.transfer.updateMany({
    where: {
      id: transferId,
      userId,
      status: "COMPLETED",
      receiptIssuedAt: null,
      receiptUrl: null,
    },
    data: {
      receiptUrl,
      receiptIssuedAt: issuedAt,
    },
  });

  return { issuedAt, issued: result.count === 1 };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = readDevBypassSession(req) ?? await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transfer, snapshot, auditLog } = await resolveTransferSnapshot(transferId);

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!snapshot) {
    console.info("receipt_snapshot_missing", { transferId: transfer.id });
    const rebuilt = await buildSnapshotFromTransfer(transfer);

    if (auditLog) {
      await prisma.auditLog.update({
        where: { id: auditLog.id },
        data: {
          metadata: {
            ...(auditLog.metadata as Record<string, unknown> | null),
            snapshot: { quote: rebuilt },
          },
        },
      });
    } else {
      await prisma.auditLog.create({
        data: {
          actor: "system",
          action: "RECEIPT_SNAPSHOT_REBUILT",
          entityType: "Transfer",
          entityId: transfer.id,
          metadata: { snapshot: { quote: rebuilt } },
        },
      });
    }

    return NextResponse.json({
      transferId: transfer.id,
      referenceCode: transfer.referenceCode,
      status: transfer.status,
      receiptUrl: transfer.receiptUrl ?? null,
      snapshot: rebuilt,
    });
  }

  return NextResponse.json({
    transferId: transfer.id,
    referenceCode: transfer.referenceCode,
    status: transfer.status,
    receiptUrl: transfer.receiptUrl ?? null,
    snapshot,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  let transferId = "";
  const requestId = req.headers.get("x-request-id") ?? undefined;

  try {
    const session = readDevBypassSession(req) ?? await getServerAuthSession();
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
    transferId = resolvedParams.id?.trim();
    if (!transferId) {
      return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locale = resolveLocale(req);
    const receiptUrl = `${getReceiptBaseUrl()}/${locale}/transfer/${transferId}`;

    const issueResult = await issueReceiptAtomically(transferId, user.id, receiptUrl);

    const transferRow = await findTransferReceiptRow(transferId);
    if (!transferRow || transferRow.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (transferRow.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Receipt available after completion." },
        { status: 400 }
      );
    }

    const issuedUrl =
      typeof transferRow.receiptUrl === "string" ? transferRow.receiptUrl : receiptUrl;

    if (issueResult.issued) {
      console.info("receipt_issued", { transferId: transferRow.id });
    } else if (transferRow.receiptUrl || transferRow.receiptIssuedAt) {
      console.info("receipt_already_issued", { transferId: transferRow.id });
      return NextResponse.json({ ok: true, receiptUrl: issuedUrl });
    }

    if (!issueResult.issued && !transferRow.receiptUrl) {
      await prisma.transfer.updateMany({
        where: {
          id: transferId,
          userId: user.id,
          status: "COMPLETED",
          receiptUrl: null,
        },
        data: {
          receiptUrl: issuedUrl,
          receiptIssuedAt: transferRow.receiptIssuedAt ?? new Date(),
        },
      });
    }

    if (!devBypassActive) {
      try {
        const rateKey = `receipt:${user.id ?? getClientIp(req)}`;
        const rate = await enforceRateLimit({
          key: rateKey,
          limit: 3,
          windowMs: 60_000,
        });
        if (!rate.allowed) {
          return NextResponse.json({ ok: true, receiptUrl: issuedUrl });
        }
      } catch {
        return NextResponse.json({ ok: true, receiptUrl: issuedUrl });
      }
    } else if (transferRow.receiptLastSentAt) {
      const elapsed = Date.now() - transferRow.receiptLastSentAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        return NextResponse.json({ ok: true, receiptUrl: issuedUrl });
      }
    }

    const { transfer, snapshot } = await resolveTransferSnapshot(transferId);

    if (!transfer || transfer.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!snapshot) {
      return NextResponse.json(
        { error: "Receipt snapshot unavailable.", errorCode: "RECEIPT_SNAPSHOT_MISSING" },
        { status: 409 }
      );
    }

    try {
      await sendReceiptEmail({
        to: user.email,
        referenceCode: transfer.referenceCode,
        status: transfer.status,
        sendAmount: snapshot.sendAmount,
        totalFee: snapshot.totalFees,
        recipientGets: snapshot.recipientGets,
        fromAsset: snapshot.fromAsset,
        toAsset: snapshot.toAsset,
        receiptUrl: issuedUrl,
        transferId: transfer.id,
        marketRate: snapshot.marketRate,
        appliedRate: snapshot.appliedRate,
        fxMarginPct: snapshot.fxMarginPct,
        fixedFee: snapshot.fixedFee,
        percentFee: snapshot.percentFee,
        rateSource: snapshot.rateSource,
        rateTimestamp: snapshot.rateTimestamp,
        lockedAt: snapshot.lockedAt,
        expiresAt: snapshot.expiresAt,
      });

      await prisma.transfer.updateMany({
        where: { id: transfer.id, receiptEmailSentAt: null },
        data: {
          receiptEmailSentAt: new Date(),
          receiptLastSentAt: new Date(),
          receiptSendCount: { increment: 1 },
        },
      });
    } catch (err) {
      console.error("receipt_email_failed", {
        transferId: transfer.id,
        requestId,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      });
      return NextResponse.json({ ok: true, receiptUrl: issuedUrl });
    }

    return NextResponse.json({ ok: true, receiptUrl: issuedUrl });
  } catch (err) {
    console.error("receipt_post_failed", {
      transferId,
      requestId,
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
    });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
