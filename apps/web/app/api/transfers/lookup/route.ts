import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function readRequiredString(value: string | null) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function quoteSummary(quote: {
  id: string;
  sendAmount: unknown;
  appliedRate: unknown;
  totalFee: unknown;
  recipientGets: unknown;
  rateTimestamp: Date;
  expiresAt: Date;
  createdAt: Date;
  fromAsset: { code: string; name: string; decimals: number };
  toAsset: { code: string; name: string; decimals: number };
}) {
  return {
    id: quote.id,
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
    sendAmount: Number(quote.sendAmount),
    appliedRate: Number(quote.appliedRate),
    totalFee: Number(quote.totalFee),
    recipientGets: Number(quote.recipientGets),
    rateTimestamp: quote.rateTimestamp,
    expiresAt: quote.expiresAt,
    createdAt: quote.createdAt,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const referenceInput = readRequiredString(searchParams.get("reference"));
  if (!referenceInput) {
    return NextResponse.json(
      { error: "reference is required" },
      { status: 400 }
    );
  }
  const reference = referenceInput.toUpperCase();
  if (!/^[A-Z0-9-]{4,20}$/.test(reference)) {
    return NextResponse.json(
      { error: "Invalid reference format" },
      { status: 400 }
    );
  }

  const transfer = await prisma.transfer.findUnique({
    where: { referenceCode: reference },
    include: {
      quote: {
        include: {
          fromAsset: { select: { code: true, name: true, decimals: true } },
          toAsset: { select: { code: true, name: true, decimals: true } },
        },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  return NextResponse.json({
    transfer: {
      reference: transfer.referenceCode,
      status: transfer.status,
      payoutRail: transfer.payoutRail,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    },
    quote: quoteSummary(transfer.quote),
    events: transfer.events.map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      createdAt: event.createdAt,
    })),
  });
}
