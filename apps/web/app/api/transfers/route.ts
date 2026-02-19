import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHash, randomInt, randomUUID } from "crypto";
import { prisma } from "@/src/lib/prisma";
import { getMessages } from "@/src/lib/i18n/messages";
import { getServerAuthSession } from "@/src/lib/auth";
import { sendTransferStatusEmail } from "@/src/lib/email";
import { enforceRateLimit } from "@/src/lib/rate-limit";
import {
  getClientIp,
  getReadOnlyResponse,
  isSameOrigin,
  isDevBypassRequest,
  readDevBypassEmail,
} from "@/src/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payoutRails = new Set(["BANK", "MOBILE_MONEY", "LIGHTNING", "CRYPTO"]);
const fundingMethods = new Set(["CARD", "BANK", "WALLET", "CRYPTO"]);
const cryptoNetworks = new Set(["BTC_LIGHTNING", "BTC_ONCHAIN"]);
const referenceAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const referenceLength = 6;
const maxReferenceAttempts = 6;

const allowHeaders = {
  Allow: "GET, POST, OPTIONS",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, idempotency-key, authorization",
};

type TransferPayload = {
  quoteId?: unknown;
  payoutRail?: unknown;
  fundingMethod?: unknown;
  recipientId?: unknown;
  recipientName?: unknown;
  recipientCountry?: unknown;
  recipientPhone?: unknown;
  recipientLightningInvoice?: unknown;
  bank?: unknown;
  mobileMoney?: unknown;
  memo?: unknown;
  saveRecipient?: unknown;
  crypto?: unknown;
};

type DevBypassResult = {
  active: boolean;
  email: string | null;
};

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  return null;
}

function createReferenceCode() {
  let suffix = "";
  for (let index = 0; index < referenceLength; index += 1) {
    suffix += referenceAlphabet[randomInt(referenceAlphabet.length)];
  }
  return `FX-${suffix}`;
}

function parsePositiveInt(value: unknown) {
  if (value === undefined || value === null) {
    return { provided: false, valid: true, value: null as number | null };
  }
  if (typeof value !== "number") {
    return { provided: true, valid: false, value: null as number | null };
  }
  if (!Number.isFinite(value)) {
    return { provided: true, valid: false, value: null as number | null };
  }
  const rounded = Math.round(value);
  if (rounded <= 0) {
    return { provided: true, valid: false, value: null as number | null };
  }
  return { provided: true, valid: true, value: rounded };
}

function createPaymentHash(seed: string) {
  return createHash("sha256").update(seed).digest("hex");
}

function createCryptoPaymentRequest({
  referenceCode,
  amountSats,
  network,
}: {
  referenceCode: string;
  amountSats: number;
  network: "BTC_LIGHTNING" | "BTC_ONCHAIN";
}) {
  const paymentHash = createPaymentHash(`${referenceCode}:${amountSats}:${network}`);
  if (network === "BTC_ONCHAIN") {
    const address = `bc1${paymentHash.slice(0, 32)}`;
    const invoice = `bitcoin:${address}?amount=${amountSats}`;
    return { invoice, paymentHash };
  }
  const invoice = `lnbc${amountSats}n1${paymentHash.slice(0, 24)}${referenceCode.toLowerCase()}`;
  return { invoice, paymentHash };
}

function jsonError(message: string, errorCode: string, status: number) {
  return NextResponse.json({ error: message, errorCode, message }, { status });
}

function buildTransferResponse(transfer: {
  id: string;
  referenceCode: string;
  quoteId: string;
  status: string;
  payoutRail: string;
  fundingMethod: string;
  recipientName: string;
  recipientCountry: string;
  recipientPhone: string | null;
  recipientBankName: string | null;
  recipientBankAccount: string | null;
  recipientMobileMoneyProvider: string | null;
  recipientMobileMoneyNumber: string | null;
  recipientLightningInvoice: string | null;
  memo: string | null;
  providerPayoutId: string | null;
  providerPayoutStatus: string | null;
  providerPayoutProvider: string | null;
  providerPayoutUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  quote?: {
    sendAmount: Prisma.Decimal;
    recipientGets: Prisma.Decimal;
    fromAsset: { code: string };
    toAsset: { code: string };
  } | null;
}) {
  return {
    id: transfer.id,
    referenceCode: transfer.referenceCode,
    quoteId: transfer.quoteId,
    status: transfer.status,
    payoutRail: transfer.payoutRail,
    fundingMethod: transfer.fundingMethod,
    recipientName: transfer.recipientName,
    recipientCountry: transfer.recipientCountry,
    recipientPhone: transfer.recipientPhone,
    recipientBankName: transfer.recipientBankName,
    recipientBankAccount: transfer.recipientBankAccount,
    recipientMobileMoneyProvider: transfer.recipientMobileMoneyProvider,
    recipientMobileMoneyNumber: transfer.recipientMobileMoneyNumber,
    recipientLightningInvoice: transfer.recipientLightningInvoice,
    memo: transfer.memo,
    providerPayoutId: transfer.providerPayoutId,
    providerPayoutStatus: transfer.providerPayoutStatus,
    providerPayoutProvider: transfer.providerPayoutProvider,
    providerPayoutUpdatedAt: transfer.providerPayoutUpdatedAt,
    sendAmount: transfer.quote ? Number(transfer.quote.sendAmount) : null,
    recipientGets: transfer.quote ? Number(transfer.quote.recipientGets) : null,
    fromAsset: transfer.quote?.fromAsset.code ?? null,
    toAsset: transfer.quote?.toAsset.code ?? null,
    createdAt: transfer.createdAt,
    updatedAt: transfer.updatedAt,
  };
}

function readDevBypass(req: Request): DevBypassResult {
  if (!isDevBypassRequest(req)) {
    return { active: false, email: null };
  }
  const email = readDevBypassEmail(req);
  return { active: true, email };
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: allowHeaders,
  });
}

export async function GET(req: Request) {
  const devBypass = readDevBypass(req);
  if (devBypass.active) {
    if (!devBypass.email) {
      return jsonError("unauthorized", "UNAUTHORIZED", 401);
    }

    const user = await ensureDevUser(devBypass.email);
    const transfers = await prisma.transfer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        quote: {
          select: {
            sendAmount: true,
            recipientGets: true,
            fromAsset: { select: { code: true } },
            toAsset: { select: { code: true } },
          },
        },
      },
    });

    return NextResponse.json(transfers.map(buildTransferResponse));
  }

  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return jsonError("unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return jsonError("unauthorized", "UNAUTHORIZED", 401);
    }

    const transfers = await prisma.transfer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        quote: {
          select: {
            sendAmount: true,
            recipientGets: true,
            fromAsset: { select: { code: true } },
            toAsset: { select: { code: true } },
          },
        },
      },
    });

    return NextResponse.json(transfers.map(buildTransferResponse));
  } catch (error) {
    console.error("transfers_get_failed", error);
    return jsonError("internal_error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: Request) {
  const readOnly = getReadOnlyResponse(req);
  if (readOnly) {
    return readOnly;
  }
  const devBypass = readDevBypass(req);
  if (!devBypass.active) {
    if (!isSameOrigin(req)) {
      return jsonError(
        "This action is only available from the ClariSend app.",
        "FORBIDDEN_ORIGIN",
        403
      );
    }
  }

  let devUser: { id: string; email: string } | null = null;
  if (devBypass.active) {
    if (!devBypass.email) {
      return jsonError("unauthorized", "UNAUTHORIZED", 401);
    }
    devUser = await ensureDevUser(devBypass.email);
  }

  const idempotencyKey = readOptionalString(
    req.headers.get("idempotency-key")
  );
  if (idempotencyKey) {
    const existing = await prisma.transfer.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return NextResponse.json(buildTransferResponse(existing));
    }
  }

  let payload: TransferPayload;
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("Invalid request payload.", "INVALID_PAYLOAD", 400);
    }
    payload = body as TransferPayload;
  } catch {
    return jsonError(
      "We couldn't process your request. Please try again.",
      "INVALID_JSON",
      400
    );
  }

  const quoteId = readRequiredString(payload.quoteId);
  if (!quoteId) {
    return jsonError(
      "A quote is required to create a transfer. Please request a quote first.",
      "MISSING_QUOTE",
      400
    );
  }

  const payoutRailInput = readRequiredString(payload.payoutRail);
  const payoutRail = payoutRailInput?.toUpperCase() ?? "";
  if (!payoutRails.has(payoutRail)) {
    return jsonError(
      "Please select a valid payout method: Bank Transfer, Mobile Money, Lightning, or Crypto.",
      "INVALID_PAYOUT_RAIL",
      400
    );
  }

  const fundingMethodInput = readOptionalString(payload.fundingMethod);
  const fundingMethod = fundingMethodInput?.toUpperCase() ?? "CARD";
  if (!fundingMethods.has(fundingMethod)) {
    return jsonError("Please select a valid funding method.", "INVALID_FUNDING_METHOD", 400);
  }

  const cryptoPayload =
    payload.crypto && typeof payload.crypto === "object" ? payload.crypto : null;
  let cryptoNetwork: string | null = null;
  let requestedAmountSats: number | null = null;

  if (payoutRail === "LIGHTNING" || payoutRail === "CRYPTO") {
    const networkInput = readRequiredString(
      (cryptoPayload as { network?: unknown } | null)?.network
    );
    const network = networkInput?.toUpperCase() ?? "";
    if (!cryptoNetworks.has(network)) {
      return jsonError(
        "crypto.network must be BTC_LIGHTNING or BTC_ONCHAIN",
        "INVALID_CRYPTO_NETWORK",
        400
      );
    }
    if (payoutRail === "LIGHTNING" && network !== "BTC_LIGHTNING") {
      return jsonError(
        "crypto.network must be BTC_LIGHTNING for Lightning payouts",
        "INVALID_CRYPTO_NETWORK",
        400
      );
    }
    cryptoNetwork = network;

    const amountSatsResult = parsePositiveInt(
      (cryptoPayload as { amountSats?: unknown } | null)?.amountSats
    );
    if (!amountSatsResult.valid) {
      return jsonError(
        "crypto.amountSats must be a positive integer",
        "INVALID_CRYPTO_AMOUNT",
        400
      );
    }
    requestedAmountSats = amountSatsResult.value;
  }

  const recipientName = readRequiredString(payload.recipientName);
  if (!recipientName) {
    return jsonError("Please provide the recipient's name.", "RECIPIENT_NAME_REQUIRED", 400);
  }

  const recipientCountryInput = readRequiredString(payload.recipientCountry);
  const recipientCountry = recipientCountryInput?.toUpperCase() ?? "";
  if (!recipientCountry) {
    return jsonError(
      "Please select the recipient's country.",
      "RECIPIENT_COUNTRY_REQUIRED",
      400
    );
  }
  if (!/^[A-Z]{2}$/.test(recipientCountry)) {
    return jsonError(
      "Please select a valid country from the list.",
      "RECIPIENT_COUNTRY_INVALID",
      400
    );
  }

  const recipientPhone = readOptionalString(payload.recipientPhone);
  const recipientLightningInvoice = readOptionalString(
    payload.recipientLightningInvoice
  );
  const memo = readOptionalString(payload.memo);
  const saveRecipient = readOptionalBoolean(payload.saveRecipient);

  let recipientBankName: string | null = null;
  let recipientBankAccount: string | null = null;
  let recipientMobileMoneyProvider: string | null = null;
  let recipientMobileMoneyNumber: string | null = null;

  if (payoutRail === "BANK") {
    const bank =
      payload.bank && typeof payload.bank === "object" ? payload.bank : null;
    const bankName = readRequiredString(
      (bank as { name?: unknown } | null)?.name
    );
    const bankAccount = readRequiredString(
      (bank as { account?: unknown } | null)?.account
    );
    if (!bankName || !bankAccount) {
      return jsonError(
        "Please provide both bank name and account number.",
        "BANK_DETAILS_REQUIRED",
        400
      );
    }
    recipientBankName = bankName;
    recipientBankAccount = bankAccount;
  }

  if (payoutRail === "MOBILE_MONEY") {
    const mobileMoney =
      payload.mobileMoney && typeof payload.mobileMoney === "object"
        ? payload.mobileMoney
        : null;
    const provider = readRequiredString(
      (mobileMoney as { provider?: unknown } | null)?.provider
    );
    const number = readRequiredString(
      (mobileMoney as { number?: unknown } | null)?.number
    );
    if (!provider || !number) {
      return jsonError(
        "mobile money provider and number are required",
        "MOBILE_MONEY_REQUIRED",
        400
      );
    }
    recipientMobileMoneyProvider = provider;
    recipientMobileMoneyNumber = number;
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      fromAsset: { select: { code: true } },
      toAsset: { select: { code: true } },
    },
  });
  if (!quote) {
    return jsonError("Quote not found.", "QUOTE_NOT_FOUND", 400);
  }

  if (quote.expiresAt.getTime() <= Date.now()) {
    return jsonError("Quote expired.", "QUOTE_EXPIRED", 400);
  }

  const quoteLock = await prisma.auditLog.findFirst({
    where: { action: "QUOTE_LOCKED", entityType: "Quote", entityId: quote.id },
    orderBy: { createdAt: "desc" },
  });
  const lockedAt = quoteLock?.createdAt ?? null;
  if (!lockedAt) {
    return jsonError("Quote must be locked.", "QUOTE_NOT_LOCKED", 400);
  }

  if (quote.rail !== payoutRail) {
    return jsonError(
      "payoutRail must match the quote rail",
      "PAYOUT_RAIL_MISMATCH",
      400
    );
  }

  const corridor = await prisma.corridor.findUnique({
    where: {
      fromAssetId_toAssetId: {
        fromAssetId: quote.fromAssetId,
        toAssetId: quote.toAssetId,
      },
    },
  });

  if (!corridor || !corridor.isActive) {
    return jsonError(
      "No active corridor for this asset pair. Choose another pair.",
      "NO_ACTIVE_CORRIDOR",
      400
    );
  }

  const routeRail =
    payoutRail === "CRYPTO" ? "LIGHTNING" : (payoutRail as "BANK" | "MOBILE_MONEY" | "LIGHTNING");

  const route = await prisma.route.findFirst({
    where: {
      corridorId: corridor.id,
      rail: routeRail,
      isActive: true,
    },
  });

  if (!route) {
    return jsonError(
      "No active route for the selected rail. Pick a different rail.",
      "NO_ACTIVE_ROUTE",
      400
    );
  }

  const messages = getMessages("en");
  const expiresAtLabel = quote.expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const baseSendAmount = Number(quote.sendAmount);
  const fallbackAmountSats = Number.isFinite(baseSendAmount)
    ? Math.max(1, Math.round(baseSendAmount * 1000))
    : 1000;
  const amountSats =
    payoutRail === "LIGHTNING"
      ? requestedAmountSats ?? fallbackAmountSats
      : null;

  const session = await getServerAuthSession();
  let userId: string | null = null;
  const requestId = typeof randomUUID === "function"
    ? randomUUID()
    : createHash("sha256")
        .update(`${Date.now()}:${randomInt(1_000_000)}`)
        .digest("hex");
  const clientIp = getClientIp(req);

  if (devUser) {
    userId = devUser.id;
  } else if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  if (!userId) {
    return jsonError("unauthorized", "UNAUTHORIZED", 401);
  }

  const rateKey = `transfer:user:${userId}`;
  const rate = await enforceRateLimit({
    key: rateKey,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return jsonError(
      "Too many transfer requests. Please wait a moment and try again.",
      "RATE_LIMITED",
      429
    );
  }

  const recipientIdInput = readOptionalString(payload.recipientId);
  let recipientId: string | null = null;
  if (recipientIdInput && userId) {
    const recipient = await prisma.recipient.findUnique({
      where: { id: recipientIdInput },
    });
    if (recipient && recipient.userId === userId) {
      recipientId = recipient.id;
    }
  }

  let transfer;
  try {
    for (let attempt = 0; attempt < maxReferenceAttempts; attempt += 1) {
      const referenceCode = createReferenceCode();
      const cryptoInvoice =
        (payoutRail === "LIGHTNING" || payoutRail === "CRYPTO") &&
        amountSats &&
        cryptoNetwork
          ? createCryptoPaymentRequest({
              referenceCode,
              amountSats,
              network: cryptoNetwork as "BTC_LIGHTNING" | "BTC_ONCHAIN",
            })
          : null;
      const events = [
        { type: "CREATED", message: messages.transferCreatedEvent },
        {
          type: "QUOTE_LOCKED",
          message: messages.quoteLockedEvent(expiresAtLabel),
        },
      ];
      if (payoutRail === "LIGHTNING" || payoutRail === "CRYPTO") {
        events.push({
          type: "INVOICE_ISSUED",
          message: messages.invoiceIssuedEvent,
        });
      }
      try {
        transfer = await prisma.$transaction(async (tx) => {
          const created = await tx.transfer.create({
            data: {
              quoteId,
              status: "READY",
              payoutRail: payoutRail as "BANK" | "MOBILE_MONEY" | "LIGHTNING" | "CRYPTO",
              fundingMethod: fundingMethod as "CARD" | "BANK" | "WALLET" | "CRYPTO",
              userId,
              recipientId,
              recipientName,
              recipientCountry,
              recipientPhone,
              recipientBankName,
              recipientBankAccount,
              recipientMobileMoneyProvider,
              recipientMobileMoneyNumber,
              recipientLightningInvoice,
              memo,
              referenceCode,
              idempotencyKey,
              cryptoPayout:
                (payoutRail === "LIGHTNING" || payoutRail === "CRYPTO") &&
                amountSats &&
                cryptoInvoice
                  ? {
                      create: {
                        network: cryptoNetwork as "BTC_LIGHTNING" | "BTC_ONCHAIN",
                        invoice: cryptoInvoice.invoice,
                        paymentHash: cryptoInvoice.paymentHash,
                        amountSats,
                        status: "REQUESTED",
                      },
                    }
                  : undefined,
              events: {
                create: events,
              },
            },
          });

          await tx.auditLog.create({
            data: {
              actor: "system",
              action: "TRANSFER_CREATED",
              entityType: "Transfer",
              entityId: created.id,
              metadata: {
                requestId,
                ip: clientIp,
                userId,
                createdAt: new Date().toISOString(),
                snapshot: {
                  quote: {
                    quoteId: quote.id,
                    fromAsset: quote.fromCode ?? quote.fromAsset.code,
                    toAsset: quote.toCode ?? quote.toAsset.code,
                    sendAmount: Number(quote.sendAmount.toString()),
                    marketRate: Number(quote.marketRate.toString()),
                    appliedRate: Number(quote.appliedRate.toString()),
                    fxMarginPct: Number(quote.fxMarginPct.toString()),
                    fixedFee: Number(quote.feeFixed.toString()),
                    percentFee: Number(quote.feePct.toString()),
                    totalFees: Number(quote.totalFee.toString()),
                    recipientGets: Number(quote.recipientGets.toString()),
                    rateSource: quote.rateSource,
                    rateTimestamp: quote.rateTimestamp.toISOString(),
                    expiresAt: quote.expiresAt.toISOString(),
                    lockedAt: lockedAt.toISOString(),
                  },
                  fundingMethod,
                  recipient: {
                    name: recipientName,
                    country: recipientCountry,
                    phone: recipientPhone,
                    rail: payoutRail,
                    bankName: recipientBankName,
                    bankAccount: recipientBankAccount,
                    mobileMoneyProvider: recipientMobileMoneyProvider,
                    mobileMoneyNumber: recipientMobileMoneyNumber,
                    lightningInvoice: recipientLightningInvoice,
                  },
                  memo,
                  saveRecipient,
                },
              },
            },
          });

          return created;
        });
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const targets = Array.isArray(error.meta?.target)
            ? (error.meta?.target as string[])
            : [];
          if (targets.includes("referenceCode")) {
            continue;
          }
          if (idempotencyKey && targets.includes("idempotencyKey")) {
            transfer = await prisma.transfer.findUnique({
              where: { idempotencyKey },
            });
            break;
          }
        }
        throw error;
      }
    }
  } catch {
    return jsonError(messages.transferCreateError, "TRANSFER_CREATE_FAILED", 500);
  }

  if (!transfer) {
    return jsonError(messages.transferCreateError, "TRANSFER_CREATE_FAILED", 500);
  }

  // Send INITIATED email (non-blocking)
  if (userId && session?.user?.email) {
    const receiptUrl = `${process.env.NEXTAUTH_URL ?? "https://app.clarisend.co"}/en/transfer/${transfer.id}`;
    sendTransferStatusEmail({
      to: session.user.email,
      type: "INITIATED",
      referenceCode: transfer.referenceCode,
      sendAmount: quote.sendAmount.toString(),
      totalFee: quote.totalFee.toString(),
      recipientGets: quote.recipientGets.toString(),
      fromAsset: quote.fromAsset.code,
      toAsset: quote.toAsset.code,
      recipientName,
      receiptUrl,
      transferId: transfer.id,
      timestamp: transfer.createdAt,
    }).catch(() => {
      // Email failures logged internally, should not break transfers
    });
  }

  return NextResponse.json(buildTransferResponse(transfer));
}
