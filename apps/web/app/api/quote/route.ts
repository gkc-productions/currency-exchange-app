import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function parseNumber(value: string | null, fallback: number) {
  if (value === null) {
    return fallback;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  console.log("QUOTE URL:", req.url);
console.log("PARAMS:", Object.fromEntries(searchParams.entries()));


  const from = (searchParams.get("from") || "USD").toUpperCase();
  const to = (searchParams.get("to") || "GHS").toUpperCase();

  const sendAmount = parseNumber(searchParams.get("sendAmount"), 100);
  const marketRate = parseNumber(searchParams.get("marketRate"), 12.35);
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
      fromCurrency: from,
      toCurrency: to,
      sendAmount: sendAmount.toFixed(2) as any,
      marketRate: marketRate.toFixed(6) as any,
      fxMarginPct: fxMarginPct.toFixed(2) as any,
      feeFixed: feeFixed.toFixed(2) as any,
      feePct: feePct.toFixed(2) as any,
      appliedRate: appliedRate.toFixed(6) as any,
      totalFee: totalFee.toFixed(2) as any,
      recipientGets: recipientGets.toFixed(2) as any,
      expiresAt,
    },
  });

  return NextResponse.json({
    id: quote.id,
    from,
    to,
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
