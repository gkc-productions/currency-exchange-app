import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMarketRate } from "@/src/lib/rates";

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

function parseNumber(value: string | null, fallback: number) {
  const parsed = parseOptionalNumber(value);
  return parsed ?? fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const fromParam = searchParams.get("fromAsset") || searchParams.get("from");
  const toParam = searchParams.get("toAsset") || searchParams.get("to");
  const railParam = searchParams.get("rail");
  const from = (fromParam?.trim() || "USD").toUpperCase();
  const to = (toParam?.trim() || "GHS").toUpperCase();
  const rail = (railParam?.trim() || "MOBILE_MONEY").toUpperCase();

  const allowedRails = new Set(["BANK", "MOBILE_MONEY", "LIGHTNING"]);
  if (!allowedRails.has(rail)) {
    return NextResponse.json({ error: "Unknown rail" }, { status: 400 });
  }

  const [fromAsset, toAsset] = await prisma.$transaction([
    prisma.asset.findUnique({ where: { code: from } }),
    prisma.asset.findUnique({ where: { code: to } }),
  ]);

  if (!fromAsset || !fromAsset.isActive) {
    return NextResponse.json({ error: "Unknown asset code" }, { status: 400 });
  }
  if (!toAsset || !toAsset.isActive) {
    return NextResponse.json({ error: "Unknown asset code" }, { status: 400 });
  }

  const sendAmount = parseNumber(searchParams.get("sendAmount"), 100);
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
  const fxMarginPct = parseNumber(searchParams.get("fxMarginPct"), 1.5);
  const feeFixed = parseNumber(searchParams.get("feeFixed"), 1.0);
  const feePct = parseNumber(searchParams.get("feePct"), 2.9);

  const feePercent = (feePct / 100) * sendAmount;
  const totalFee = feeFixed + feePercent;

  const appliedRate = marketRate * (1 - fxMarginPct / 100);
  const net = Math.max(0, sendAmount - totalFee);
  const recipientGets = net * appliedRate;

  const expiresAt = new Date(Date.now() + 30_000); // 30s validity

  const quote = await prisma.quote.create({
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
