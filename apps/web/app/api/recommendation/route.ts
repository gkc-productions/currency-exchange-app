import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMarketRate } from "@/src/lib/rates";

// curl -s "http://127.0.0.1:3000/api/recommendation?from=USD&to=GHS&sendAmount=100"

function readCode(value: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

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

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = readCode(searchParams.get("from") ?? searchParams.get("fromAsset"));
  const to = readCode(searchParams.get("to") ?? searchParams.get("toAsset"));

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to are required" },
      { status: 400 }
    );
  }

  const sendAmountInput = parseOptionalNumber(searchParams.get("sendAmount"));
  if (sendAmountInput === null || sendAmountInput <= 0) {
    return NextResponse.json(
      { error: "sendAmount must be a positive number" },
      { status: 400 }
    );
  }

  const [fromAsset, toAsset] = await prisma.$transaction([
    prisma.asset.findUnique({ where: { code: from } }),
    prisma.asset.findUnique({ where: { code: to } }),
  ]);

  if (!fromAsset || !fromAsset.isActive) {
    return NextResponse.json(
      { error: `Unknown asset code: ${from}` },
      { status: 400 }
    );
  }
  if (!toAsset || !toAsset.isActive) {
    return NextResponse.json(
      { error: `Unknown asset code: ${to}` },
      { status: 400 }
    );
  }

  const corridor = await prisma.corridor.findUnique({
    where: {
      fromAssetId_toAssetId: {
        fromAssetId: fromAsset.id,
        toAssetId: toAsset.id,
      },
    },
    include: {
      routes: {
        where: { isActive: true },
      },
    },
  });

  if (!corridor || !corridor.isActive) {
    return NextResponse.json(
      { error: `Unknown corridor: ${from}->${to}` },
      { status: 400 }
    );
  }

  if (corridor.routes.length === 0) {
    return NextResponse.json(
      { error: `No active routes for corridor: ${from}->${to}` },
      { status: 400 }
    );
  }

  const marketRateInput = parseOptionalNumber(searchParams.get("marketRate"));
  let marketRate = marketRateInput ?? 0;
  let rateSource = "manual";
  let rateTimestamp = new Date();
  if (marketRateInput === null) {
    const marketRateQuote = await getMarketRate(fromAsset.code, toAsset.code);
    marketRate = marketRateQuote.rate;
    rateSource = marketRateQuote.source;
    rateTimestamp = marketRateQuote.timestamp;
  }

  const sendAmount = sendAmountInput;
  const routes = corridor.routes.map((route) => {
    const feeFixed = Number(route.feeFixed);
    const feePct = Number(route.feePct);
    const fxMarginPct = Number(route.fxMarginPct);
    const feePercent = (feePct / 100) * sendAmount;
    const totalFee = feeFixed + feePercent;
    const appliedRate = marketRate * (1 - fxMarginPct / 100);
    const net = Math.max(0, sendAmount - totalFee);
    const recipientGets = net * appliedRate;
    const effectiveCostPct =
      sendAmount > 0 ? (totalFee / sendAmount) * 100 + fxMarginPct : 0;

    return {
      id: route.id,
      corridorId: route.corridorId,
      rail: route.rail,
      provider: route.provider,
      feeFixed,
      feePct,
      fxMarginPct,
      etaMinMinutes: route.etaMinMinutes,
      etaMaxMinutes: route.etaMaxMinutes,
      totalFee,
      appliedRate,
      recipientGets,
      effectiveCostPct,
    };
  });

  const cheapestRoute = routes.reduce((best, route) =>
    route.totalFee < best.totalFee ? route : best
  );
  const fastestRoute = routes.reduce((best, route) => {
    if (route.etaMaxMinutes < best.etaMaxMinutes) {
      return route;
    }
    if (route.etaMaxMinutes === best.etaMaxMinutes) {
      return route.etaMinMinutes < best.etaMinMinutes ? route : best;
    }
    return best;
  });
  const bestValueRoute = routes.reduce((best, route) =>
    route.recipientGets > best.recipientGets ? route : best
  );

  const responseRoutes = routes.map((route) => {
    const highlights: string[] = [];
    if (route.id === cheapestRoute.id) {
      highlights.push("LOWEST_TOTAL_FEE");
    }
    if (route.id === fastestRoute.id) {
      highlights.push("FASTEST_ETA");
    }
    if (route.id === bestValueRoute.id) {
      highlights.push("HIGHEST_PAYOUT");
    }
    const highlightLabels: Record<string, string> = {
      LOWEST_TOTAL_FEE: "Lowest total fee",
      FASTEST_ETA: "Fastest ETA",
      HIGHEST_PAYOUT: "Highest recipient payout",
    };
    const explanationParts = highlights
      .map((code) => highlightLabels[code])
      .filter(Boolean);

    return {
      ...route,
      totalFee: round(route.totalFee, 2),
      appliedRate: round(route.appliedRate, 6),
      recipientGets: round(route.recipientGets, 2),
      effectiveCostPct: round(route.effectiveCostPct, 2),
      explanation:
        explanationParts.length > 0
          ? explanationParts.join(" · ")
          : "Active route",
      highlights,
    };
  });

  return NextResponse.json({
    from: fromAsset.code,
    to: toAsset.code,
    fromAsset: {
      code: fromAsset.code,
      name: fromAsset.name,
      decimals: fromAsset.decimals,
    },
    toAsset: { code: toAsset.code, name: toAsset.name, decimals: toAsset.decimals },
    sendAmount,
    marketRate,
    rateSource,
    rateTimestamp,
    cheapestRouteId: cheapestRoute.id,
    fastestRouteId: fastestRoute.id,
    bestValueRouteId: bestValueRoute.id,
    routes: responseRoutes,
  });
}
