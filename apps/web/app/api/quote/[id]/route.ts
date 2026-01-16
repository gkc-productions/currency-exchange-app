import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// curl -s http://127.0.0.1:3000/api/quote/<quoteId>
// curl -i http://127.0.0.1:3000/api/quote/<expiredQuoteId>

function quoteToResponse(quote: {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  sendAmount: unknown;
  marketRate: unknown;
  fxMarginPct: unknown;
  feeFixed: unknown;
  feePct: unknown;
  totalFee: unknown;
  appliedRate: unknown;
  recipientGets: unknown;
  expiresAt: Date;
  createdAt: Date;
}) {
  return {
    id: quote.id,
    provider: "database",
    from: quote.fromCurrency,
    to: quote.toCurrency,
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
  _req: Request,
  { params }: { params: { id: string } }
) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const response = quoteToResponse(quote);
  const expired = quote.expiresAt.getTime() <= Date.now();
  if (expired) {
    return NextResponse.json({ ...response, expired: true }, { status: 410 });
  }

  return NextResponse.json(response);
}
