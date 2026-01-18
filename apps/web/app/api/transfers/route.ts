import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/src/lib/prisma";
import { getMessages } from "@/src/lib/i18n/messages";
import { getServerAuthSession } from "@/src/lib/auth";
import { sendTransferStatusEmail } from "@/src/lib/email";
import { enforceRateLimit } from "@/src/lib/rate-limit";
import { getClientIp, isSameOrigin } from "@/src/lib/security";

const payoutRails = new Set(["BANK", "MOBILE_MONEY", "LIGHTNING"]);
const cryptoNetworks = new Set(["BTC_LIGHTNING", "BTC_ONCHAIN"]);
const referenceAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const referenceLength = 6;
const maxReferenceAttempts = 6;

type TransferPayload = {
  quoteId?: unknown;
  payoutRail?: unknown;
  recipientId?: unknown;
  recipientName?: unknown;
  recipientCountry?: unknown;
  recipientPhone?: unknown;
  recipientLightningInvoice?: unknown;
  bank?: unknown;
  mobileMoney?: unknown;
  memo?: unknown;
  crypto?: unknown;
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

function createLightningInvoice({
  referenceCode,
  amountSats,
}: {
  referenceCode: string;
  amountSats: number;
}) {
  const paymentHash = createPaymentHash(`${referenceCode}:${amountSats}`);
  const invoice = `lnbc${amountSats}n1${paymentHash.slice(0, 24)}${referenceCode.toLowerCase()}`;
  return { invoice, paymentHash };
}

function buildTransferResponse(transfer: {
  id: string;
  referenceCode: string;
  quoteId: string;
  status: string;
  payoutRail: string;
  recipientName: string;
  recipientCountry: string;
  recipientPhone: string | null;
  recipientBankName: string | null;
  recipientBankAccount: string | null;
  recipientMobileMoneyProvider: string | null;
  recipientMobileMoneyNumber: string | null;
  recipientLightningInvoice: string | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
  };
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { error: "This action is only available from the ClariSend app." },
      { status: 403 }
    );
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
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }
    payload = body as TransferPayload;
  } catch {
    return NextResponse.json({ error: "We couldn't process your request. Please try again." }, { status: 400 });
  }

  const quoteId = readRequiredString(payload.quoteId);
  if (!quoteId) {
    return NextResponse.json({ error: "A quote is required to create a transfer. Please request a quote first." }, { status: 400 });
  }

  const payoutRailInput = readRequiredString(payload.payoutRail);
  const payoutRail = payoutRailInput?.toUpperCase() ?? "";
  if (!payoutRails.has(payoutRail)) {
    return NextResponse.json(
      { error: "Please select a valid payout method: Bank Transfer, Mobile Money, or Bitcoin Lightning." },
      { status: 400 }
    );
  }

  const cryptoPayload =
    payload.crypto && typeof payload.crypto === "object" ? payload.crypto : null;
  let cryptoNetwork: string | null = null;
  let requestedAmountSats: number | null = null;

  if (payoutRail === "LIGHTNING") {
    const networkInput = readRequiredString(
      (cryptoPayload as { network?: unknown } | null)?.network
    );
    const network = networkInput?.toUpperCase() ?? "";
    if (!cryptoNetworks.has(network)) {
      return NextResponse.json(
        { error: "crypto.network must be BTC_LIGHTNING or BTC_ONCHAIN" },
        { status: 400 }
      );
    }
    if (network !== "BTC_LIGHTNING") {
      return NextResponse.json(
        { error: "crypto.network must be BTC_LIGHTNING for Lightning payouts" },
        { status: 400 }
      );
    }
    cryptoNetwork = network;

    const amountSatsResult = parsePositiveInt(
      (cryptoPayload as { amountSats?: unknown } | null)?.amountSats
    );
    if (!amountSatsResult.valid) {
      return NextResponse.json(
        { error: "crypto.amountSats must be a positive integer" },
        { status: 400 }
      );
    }
    requestedAmountSats = amountSatsResult.value;
  }

  const recipientName = readRequiredString(payload.recipientName);
  if (!recipientName) {
    return NextResponse.json(
      { error: "Please provide the recipient's name." },
      { status: 400 }
    );
  }

  const recipientCountryInput = readRequiredString(payload.recipientCountry);
  const recipientCountry = recipientCountryInput?.toUpperCase() ?? "";
  if (!recipientCountry) {
    return NextResponse.json(
      { error: "Please select the recipient's country." },
      { status: 400 }
    );
  }
  if (!/^[A-Z]{2}$/.test(recipientCountry)) {
    return NextResponse.json(
      { error: "Please select a valid country from the list." },
      { status: 400 }
    );
  }

  const recipientPhone = readOptionalString(payload.recipientPhone);
  const recipientLightningInvoice = readOptionalString(
    payload.recipientLightningInvoice
  );
  const memo = readOptionalString(payload.memo);

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
      return NextResponse.json(
        { error: "Please provide both bank name and account number." },
        { status: 400 }
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
      return NextResponse.json(
        { error: "mobile money provider and number are required" },
        { status: 400 }
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
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.rail !== payoutRail) {
    return NextResponse.json(
      { error: "payoutRail must match the quote rail" },
      { status: 400 }
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
    return NextResponse.json(
      { error: "No active corridor for this asset pair. Choose another pair." },
      { status: 400 }
    );
  }

  const route = await prisma.route.findFirst({
    where: {
      corridorId: corridor.id,
      rail: payoutRail as "BANK" | "MOBILE_MONEY" | "LIGHTNING",
      isActive: true,
    },
  });

  if (!route) {
    return NextResponse.json(
      { error: "No active route for the selected rail. Pick a different rail." },
      { status: 400 }
    );
  }

  if (quote.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Quote expired", expired: true },
      { status: 410 }
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
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const rateKey = userId ? `transfer:user:${userId}` : `transfer:ip:${getClientIp(req)}`;
  const rate = await enforceRateLimit({
    key: rateKey,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many transfer requests. Please wait a moment and try again." },
      { status: 429 }
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
      const lightningInvoice =
        payoutRail === "LIGHTNING" && amountSats
          ? createLightningInvoice({ referenceCode, amountSats })
          : null;
      const events = [
        { type: "CREATED", message: messages.transferCreatedEvent },
        {
          type: "QUOTE_LOCKED",
          message: messages.quoteLockedEvent(expiresAtLabel),
        },
      ];
      if (payoutRail === "LIGHTNING") {
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
              payoutRail: payoutRail as "BANK" | "MOBILE_MONEY" | "LIGHTNING",
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
                payoutRail === "LIGHTNING" && amountSats && lightningInvoice
                  ? {
                      create: {
                        network: cryptoNetwork as "BTC_LIGHTNING",
                        invoice: lightningInvoice.invoice,
                        paymentHash: lightningInvoice.paymentHash,
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
                quoteId,
                payoutRail,
                from: quote.fromAsset.code,
                to: quote.toAsset.code,
                sendAmount: Number(quote.sendAmount),
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
    return NextResponse.json(
      { error: messages.transferCreateError },
      { status: 500 }
    );
  }

  if (!transfer) {
    return NextResponse.json(
      { error: messages.transferCreateError },
      { status: 500 }
    );
  }

  // Send INITIATED email (non-blocking)
  if (userId && session?.user?.email) {
    const receiptUrl = `${process.env.NEXTAUTH_URL ?? "https://app.clarisend.co"}/en/transfer/${transfer.id}`;
    sendTransferStatusEmail({
      to: session.user.email,
      type: "INITIATED",
      referenceCode: transfer.referenceCode,
      sendAmount: Number(quote.sendAmount),
      totalFee: Number(quote.totalFee),
      recipientGets: Number(quote.recipientGets),
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
