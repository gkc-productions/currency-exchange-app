import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/src/lib/prisma";
import { getMessages } from "@/src/lib/i18n/messages";

const payoutRails = new Set(["BANK", "MOBILE_MONEY", "LIGHTNING"]);
const cryptoNetworks = new Set(["BTC_LIGHTNING", "BTC_ONCHAIN"]);
const referenceAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const referenceLength = 6;
const maxReferenceAttempts = 6;

type TransferPayload = {
  quoteId?: unknown;
  payoutRail?: unknown;
  recipientName?: unknown;
  recipientCountry?: unknown;
  recipientPhone?: unknown;
  bank?: unknown;
  mobileMoney?: unknown;
  memo?: unknown;
  crypto?: unknown;
};

type IdempotencyKeyRecord = {
  key: string;
  requestHash: string;
  responseJson: Prisma.JsonValue;
};

const prismaWithIdempotency = prisma as typeof prisma & {
  idempotencyKey: {
    findUnique: (args: {
      where: { key: string };
    }) => Promise<IdempotencyKeyRecord | null>;
    create: (args: {
      data: {
        key: string;
        route: string;
        requestHash: string;
        responseJson: Prisma.JsonValue;
      };
    }) => Promise<IdempotencyKeyRecord>;
  };
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
  return `CS-${suffix}`;
}

function parsePositiveInt(value: unknown) {
  if (value === undefined || value === null) {
    return { provided: false, valid: true, value: null as number | null };
  }
  if (typeof value === "string" && value.trim().length === 0) {
    return { provided: true, valid: false, value: null as number | null };
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return { provided: true, valid: false, value: null as number | null };
  }
  const rounded = Math.round(parsed);
  if (rounded <= 0) {
    return { provided: true, valid: false, value: null as number | null };
  }
  return { provided: true, valid: true, value: rounded };
}

function createPaymentHash(seed: string) {
  return createHash("sha256").update(seed).digest("hex");
}

function createLightningInvoice({
  reference,
  amountSats,
}: {
  reference: string;
  amountSats: number;
}) {
  const paymentHash = createPaymentHash(`${reference}:${amountSats}`);
  const invoice = `lnbc${amountSats}n1${paymentHash.slice(0, 24)}${reference.toLowerCase()}`;
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
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: transfer.id,
    reference: transfer.referenceCode,
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
    memo: transfer.memo,
    createdAt: transfer.createdAt.toISOString(),
    updatedAt: transfer.updatedAt.toISOString(),
  };
}

export async function POST(req: Request) {
  const idempotencyKey = readOptionalString(
    req.headers.get("idempotency-key")
  );
  let payload: TransferPayload;
  let requestHash: string | null = null;

  if (idempotencyKey) {
    let rawBody = "";
    try {
      rawBody = await req.text();
      payload = JSON.parse(rawBody) as TransferPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    requestHash = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    const existingKey = await prismaWithIdempotency.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });
    if (existingKey) {
      if (existingKey.requestHash !== requestHash) {
        return NextResponse.json(
          { error: "Idempotency key conflict" },
          { status: 409 }
        );
      }
      return NextResponse.json(existingKey.responseJson);
    }
  } else {
    try {
      payload = (await req.json()) as TransferPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  const quoteId = readRequiredString(payload.quoteId);
  if (!quoteId) {
    return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
  }

  const payoutRailInput = readRequiredString(payload.payoutRail);
  const payoutRail = payoutRailInput?.toUpperCase() ?? "";
  if (!payoutRails.has(payoutRail)) {
    return NextResponse.json(
      { error: "payoutRail must be BANK, MOBILE_MONEY, or LIGHTNING" },
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
      { error: "recipientName is required" },
      { status: 400 }
    );
  }

  const recipientCountryInput = readRequiredString(payload.recipientCountry);
  const recipientCountry = recipientCountryInput?.toUpperCase() ?? "";
  if (!recipientCountry) {
    return NextResponse.json(
      { error: "recipientCountry is required" },
      { status: 400 }
    );
  }
  if (!/^[A-Z]{2}$/.test(recipientCountry)) {
    return NextResponse.json(
      { error: "recipientCountry must be ISO2 format" },
      { status: 400 }
    );
  }

  const recipientPhone = readOptionalString(payload.recipientPhone);
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
        { error: "bank name and account are required" },
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

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
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

  let transfer;
  try {
    for (let attempt = 0; attempt < maxReferenceAttempts; attempt += 1) {
      const referenceCode = createReferenceCode();
      const lightningInvoice =
        payoutRail === "LIGHTNING" && amountSats
          ? createLightningInvoice({ reference: referenceCode, amountSats })
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
        transfer = await prisma.transfer.create({
          data: {
            quoteId,
            status: "READY",
            payoutRail: payoutRail as "BANK" | "MOBILE_MONEY" | "LIGHTNING",
            recipientName,
            recipientCountry,
            recipientPhone,
            recipientBankName,
            recipientBankAccount,
            recipientMobileMoneyProvider,
            recipientMobileMoneyNumber,
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
            const existingKey = await prismaWithIdempotency.idempotencyKey.findUnique({
              where: { key: idempotencyKey },
            });
            if (existingKey) {
              if (requestHash && existingKey.requestHash !== requestHash) {
                return NextResponse.json(
                  { error: "Idempotency key conflict" },
                  { status: 409 }
                );
              }
              return NextResponse.json(existingKey.responseJson);
            }
            transfer = await prisma.transfer.findUnique({
              where: { idempotencyKey },
            });
            break;
          }
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Transfer create failed", error);
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

  const responsePayload = buildTransferResponse(transfer);

  if (idempotencyKey && requestHash) {
    try {
      await prismaWithIdempotency.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          route: "/api/transfers",
          requestHash,
          responseJson: responsePayload,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existingKey = await prismaWithIdempotency.idempotencyKey.findUnique({
          where: { key: idempotencyKey },
        });
        if (existingKey?.requestHash === requestHash) {
          return NextResponse.json(existingKey.responseJson);
        }
        return NextResponse.json(
          { error: "Idempotency key conflict" },
          { status: 409 }
        );
      }
    }
  }

  return NextResponse.json(responsePayload);
}
