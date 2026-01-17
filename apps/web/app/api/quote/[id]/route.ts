import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// curl -s http://127.0.0.1:3000/api/quote/<quoteId>
// curl -i http://127.0.0.1:3000/api/quote/<expiredQuoteId>

function quoteToResponse(quote: {
  id: string;
  fromCode: string | null;
  toCode: string | null;
  rail: string;
  sendAmount: unknown;
  marketRate: unknown;
  rateSource: string;
  rateTimestamp: Date;
  fxMarginPct: unknown;
  feeFixed: unknown;
  feePct: unknown;
  totalFee: unknown;
  appliedRate: unknown;
  recipientGets: unknown;
  expiresAt: Date;
  createdAt: Date;
  fromAsset: { code: string; name: string; decimals: number };
  toAsset: { code: string; name: string; decimals: number };
}) {
  return {
    id: quote.id,
    provider: quote.rateSource,
    rateSource: quote.rateSource,
    rateTimestamp: quote.rateTimestamp,
    from: quote.fromCode ?? quote.fromAsset.code,
    to: quote.toCode ?? quote.toAsset.code,
    fromAsset: {
      code: quote.fromAsset.code,
      name: quote.fromAsset.name,
      decimals: quote.fromAsset.decimals,
    },
    toAsset: {
      code: quote.toAsset.code,
      name: quote.toAsset.name,
      decimals: quote.toAsset.decimals,
    },
    rail: quote.rail,
    sendAmount: Number(quote.sendAmount),
    marketRate: Number(quote.marketRate),
    fxMarginPct: Number(quote.fxMarginPct),
    feeFixed: Number(quote.feeFixed),
    feePct: Number(quote.feePct),
    totalFee: Number(quote.totalFee),
    appliedRate: Number(quote.appliedRate),
    recipientGets: Number(quote.recipientGets),
    expiresAt: quote.expiresAt,
    createdAt: quote.createdAt,
  };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      fromAsset: { select: { code: true, name: true, decimals: true } },
      toAsset: { select: { code: true, name: true, decimals: true } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "This quote could not be found. It may have been deleted." }, { status: 404 });
  }

  const response = quoteToResponse(quote);
  const expired = quote.expiresAt.getTime() <= Date.now();

  if (expired) {
    return NextResponse.json({
      ...response,
      expired: true,
      error: "This quote has expired. Please request a new quote to see current rates."
    }, { status: 410 });
  }

  return NextResponse.json(response);
}
