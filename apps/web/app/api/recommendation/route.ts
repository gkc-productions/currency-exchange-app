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

type SuggestionType = "CHEAPEST" | "FASTEST" | "BEST_VALUE";

type ScoredRoute = {
  id: string;
  corridorId: string;
  rail: string;
  provider: string;
  feeFixed: number;
  feePct: number;
  fxMarginPct: number;
  etaMinMinutes: number;
  etaMaxMinutes: number;
  totalFee: number;
  appliedRate: number;
  recipientGets: number;
  effectiveCostPct: number;
  etaMidMinutes: number;
};

function compareNumbers(a: number, b: number) {
  return a === b ? 0 : a < b ? -1 : 1;
}

function pickBetterBestValue(a: ScoredRoute, b: ScoredRoute) {
  return sortBestValue(a, b) < 0 ? a : b;
}

function dedupeRoutes(routes: ScoredRoute[]) {
  const deduped = new Map<string, ScoredRoute>();
  for (const route of routes) {
    const key = `${route.rail}:${route.provider}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, route);
      continue;
    }
    deduped.set(key, pickBetterBestValue(route, existing));
  }
  return Array.from(deduped.values());
}

function sortCheapest(a: ScoredRoute, b: ScoredRoute) {
  return (
    compareNumbers(a.totalFee, b.totalFee) ||
    compareNumbers(b.recipientGets, a.recipientGets) ||
    compareNumbers(a.etaMaxMinutes, b.etaMaxMinutes) ||
    compareNumbers(a.etaMinMinutes, b.etaMinMinutes) ||
    a.id.localeCompare(b.id)
  );
}

function sortFastest(a: ScoredRoute, b: ScoredRoute) {
  return (
    compareNumbers(a.etaMaxMinutes, b.etaMaxMinutes) ||
    compareNumbers(a.etaMinMinutes, b.etaMinMinutes) ||
    compareNumbers(b.recipientGets, a.recipientGets) ||
    compareNumbers(a.totalFee, b.totalFee) ||
    a.id.localeCompare(b.id)
  );
}

function sortBestValue(a: ScoredRoute, b: ScoredRoute) {
  return (
    compareNumbers(b.recipientGets, a.recipientGets) ||
    compareNumbers(a.totalFee, b.totalFee) ||
    compareNumbers(a.etaMaxMinutes, b.etaMaxMinutes) ||
    compareNumbers(a.etaMinMinutes, b.etaMinMinutes) ||
    a.id.localeCompare(b.id)
  );
}

function buildReason(type: SuggestionType, rankIndex: number) {
  if (type === "CHEAPEST") {
    return rankIndex === 0 ? "Lowest total fee" : "Next-lowest total fee";
  }
  if (type === "FASTEST") {
    return rankIndex === 0 ? "Fastest ETA" : "Next-fastest ETA";
  }
  return rankIndex === 0 ? "Highest recipient payout" : "Next-best payout";
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
  const scoredRoutes: ScoredRoute[] = corridor.routes.map((route) => {
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
      etaMidMinutes: Math.round((route.etaMinMinutes + route.etaMaxMinutes) / 2),
    };
  });

  const routes = dedupeRoutes(scoredRoutes);
  const cheapestOrder = [...routes].sort(sortCheapest);
  const fastestOrder = [...routes].sort(sortFastest);
  const bestValueOrder = [...routes].sort(sortBestValue);

  const used = new Set<string>();
  const pickDistinct = (list: ScoredRoute[], type: SuggestionType) => {
    const index = list.findIndex((route) => !used.has(route.id));
    if (index === -1) {
      return null;
    }
    const route = list[index];
    used.add(route.id);
    return { type, route, rankIndex: index };
  };

  const bestValuePick = pickDistinct(bestValueOrder, "BEST_VALUE");
  const cheapestPick = pickDistinct(cheapestOrder, "CHEAPEST");
  const fastestPick = pickDistinct(fastestOrder, "FASTEST");

  const suggestions = [bestValuePick, cheapestPick, fastestPick]
    .filter((item) => item !== null)
    .map((item) => {
      const entry = item as {
        type: SuggestionType;
        route: ScoredRoute;
        rankIndex: number;
      };
      return {
        type: entry.type,
        routeId: entry.route.id,
        reason: buildReason(entry.type, entry.rankIndex),
        scoreBreakdown: {
          fee: round(entry.route.totalFee, 2),
          payout: round(entry.route.recipientGets, 2),
          etaMinutes: entry.route.etaMidMinutes,
        },
      };
    });

  const cheapestRoute = cheapestPick?.route ?? null;
  const fastestRoute = fastestPick?.route ?? null;
  const bestValueRoute = bestValuePick?.route ?? null;

  const responseRoutes = routes.map((route) => {
    const highlights: string[] = [];
    if (cheapestRoute && route.id === cheapestRoute.id) {
      highlights.push("LOWEST_TOTAL_FEE");
    }
    if (fastestRoute && route.id === fastestRoute.id) {
      highlights.push("FASTEST_ETA");
    }
    if (bestValueRoute && route.id === bestValueRoute.id) {
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
    cheapestRouteId: cheapestRoute?.id ?? null,
    fastestRouteId: fastestRoute?.id ?? null,
    bestValueRouteId: bestValueRoute?.id ?? null,
    routes: responseRoutes,
    suggestions,
  });
}
