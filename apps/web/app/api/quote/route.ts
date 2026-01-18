import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMarketRate } from "@/src/lib/rates";
import { enforceRateLimit } from "@/src/lib/rate-limit";
import { getClientIp } from "@/src/lib/security";

function parseOptionalNumber(value: string | null) {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

type NumberParamResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

function readNumberParam(
  value: string | null,
  fallback: number,
  label: string,
  { min }: { min?: number } = {}
): NumberParamResult {
  if (value === null) {
    return { ok: true, value: fallback };
  }
  const parsed = parseOptionalNumber(value);
  if (parsed === null) {
    return { ok: false, error: `${label} must be a number.` };
  }
  if (min !== undefined && parsed < min) {
    return { ok: false, error: `${label} must be at least ${min}.` };
  }
  return { ok: true, value: parsed };
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rate = await enforceRateLimit({
    key: `quote:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many quote requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);

  const fromParam = searchParams.get("fromAsset") || searchParams.get("from");
  const toParam = searchParams.get("toAsset") || searchParams.get("to");
  const railParam = searchParams.get("rail");
  const from = (fromParam?.trim() || "USD").toUpperCase();
  const to = (toParam?.trim() || "GHS").toUpperCase();
  const rail = (railParam?.trim() || "MOBILE_MONEY").toUpperCase();

  const allowedRails = new Set(["BANK", "MOBILE_MONEY", "LIGHTNING"]);
  if (!allowedRails.has(rail)) {
    return NextResponse.json({ error: "Please select a valid payout method (Bank, Mobile Money, or Bitcoin Lightning)." }, { status: 400 });
  }

  const [fromAsset, toAsset] = await prisma.$transaction([
    prisma.asset.findUnique({ where: { code: from } }),
    prisma.asset.findUnique({ where: { code: to } }),
  ]);

  if (!fromAsset || !fromAsset.isActive) {
    return NextResponse.json({ error: `We don't currently support ${from}. Please select a different currency.` }, { status: 400 });
  }
  if (!toAsset || !toAsset.isActive) {
    return NextResponse.json({ error: `We don't currently support ${to}. Please select a different currency.` }, { status: 400 });
  }

  const sendAmountResult = readNumberParam(
    searchParams.get("sendAmount"),
    100,
    "sendAmount",
    { min: 1 }
  );
  if (!sendAmountResult.ok) {
    return NextResponse.json({ error: sendAmountResult.error }, { status: 400 });
  }
  const sendAmount = sendAmountResult.value;
  const marketRateInput = parseOptionalNumber(searchParams.get("marketRate"));
  let marketRate = marketRateInput ?? 0;
  let rateSource = "manual";
  let rateTimestamp = new Date();
  if (marketRateInput === null) {
    const marketRateQuote = await getMarketRate(
      fromAsset.code,
      toAsset.code
    );
    marketRate = marketRateQuote.rate;
    rateSource = marketRateQuote.source;
    rateTimestamp = marketRateQuote.timestamp;
  }
  const fxMarginResult = readNumberParam(
    searchParams.get("fxMarginPct"),
    1.5,
    "fxMarginPct",
    { min: 0 }
  );
  if (!fxMarginResult.ok) {
    return NextResponse.json({ error: fxMarginResult.error }, { status: 400 });
  }
  const feeFixedResult = readNumberParam(
    searchParams.get("feeFixed"),
    1.0,
    "feeFixed",
    { min: 0 }
  );
  if (!feeFixedResult.ok) {
    return NextResponse.json({ error: feeFixedResult.error }, { status: 400 });
  }
  const feePctResult = readNumberParam(
    searchParams.get("feePct"),
    2.9,
    "feePct",
    { min: 0 }
  );
  if (!feePctResult.ok) {
    return NextResponse.json({ error: feePctResult.error }, { status: 400 });
  }

  const fxMarginPct = fxMarginResult.value;
  const feeFixed = feeFixedResult.value;
  const feePct = feePctResult.value;

  const feePercent = (feePct / 100) * sendAmount;
  const totalFee = feeFixed + feePercent;

  const appliedRate = marketRate * (1 - fxMarginPct / 100);
  const net = Math.max(0, sendAmount - totalFee);
  const recipientGets = net * appliedRate;

  const expiresAt = new Date(Date.now() + 30_000); // 30s validity

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        fromAssetId: fromAsset.id,
        toAssetId: toAsset.id,
        fromCode: fromAsset.code,
        toCode: toAsset.code,
        rail: rail as "BANK" | "MOBILE_MONEY" | "LIGHTNING",
        sendAmount: sendAmount.toFixed(2),
        marketRate: marketRate.toFixed(6),
        rateSource,
        rateTimestamp,
        fxMarginPct: fxMarginPct.toFixed(2),
        feeFixed: feeFixed.toFixed(2),
        feePct: feePct.toFixed(2),
        appliedRate: appliedRate.toFixed(6),
        totalFee: totalFee.toFixed(2),
        recipientGets: recipientGets.toFixed(2),
        expiresAt,
      },
    });

    await tx.auditLog.create({
      data: {
        actor: "system",
        action: "QUOTE_CREATED",
        entityType: "Quote",
        entityId: created.id,
        metadata: {
          from: fromAsset.code,
          to: toAsset.code,
          rail,
          sendAmount,
        },
      },
    });

    return created;
  });

  return NextResponse.json({
    id: quote.id,
    provider: rateSource,
    rateSource,
    rateTimestamp,
    from: fromAsset.code,
    to: toAsset.code,
    fromAsset: {
      code: fromAsset.code,
      name: fromAsset.name,
      decimals: fromAsset.decimals,
    },
    toAsset: {
      code: toAsset.code,
      name: toAsset.name,
      decimals: toAsset.decimals,
    },
    rail,
    sendAmount,
    marketRate,
    fxMarginPct,
    feeFixed,
    feePct,
    totalFee,
    appliedRate,
    recipientGets,
    expiresAt: quote.expiresAt,
    createdAt: quote.createdAt,
  });
}
