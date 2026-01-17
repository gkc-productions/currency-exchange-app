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
      { error: `We don't currently support sending from ${from}. Please check available currencies.` },
      { status: 400 }
    );
  }
  if (!toAsset || !toAsset.isActive) {
    return NextResponse.json(
      { error: `We don't currently support sending to ${to}. Please check available currencies.` },
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
      { error: `We don't have a route from ${from} to ${to} yet. Please try a different currency pair.` },
      { status: 400 }
    );
  }

  if (corridor.routes.length === 0) {
    return NextResponse.json(
      { error: `This route is temporarily unavailable. Please try again later or contact support.` },
      { status: 503 }
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
  const routes = corridor.routes.map((route: typeof corridor.routes[number]) => {
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

  /**
   * Smart recommendation algorithm with deterministic tie-breaking.
   * Ensures three distinct routes whenever possible by:
   * 1. Finding true cheapest (lowest total fee)
   * 2. Finding true fastest (best ETA)
   * 3. Finding best value (highest payout, excluding previous winners)
   *
   * Tie-breaking rules:
   * - Cheapest: If fees equal, prefer faster route
   * - Fastest: If ETA equal, prefer cheaper route
   * - Best Value: Exclude cheapest and fastest, then pick highest payout
   */

  // Step 1: Find cheapest route (tie-break by speed)
  const cheapestRoute = routes.reduce((best: typeof routes[number], route: typeof routes[number]) => {
    if (route.totalFee < best.totalFee) return route;
    if (route.totalFee === best.totalFee && route.etaMaxMinutes < best.etaMaxMinutes) return route;
    return best;
  });

  // Step 2: Find fastest route (tie-break by cost)
  const fastestRoute = routes.reduce((best: typeof routes[number], route: typeof routes[number]) => {
    if (route.etaMaxMinutes < best.etaMaxMinutes) return route;
    if (route.etaMaxMinutes === best.etaMaxMinutes) {
      if (route.etaMinMinutes < best.etaMinMinutes) return route;
      if (route.etaMinMinutes === best.etaMinMinutes && route.totalFee < best.totalFee) return route;
    }
    return best;
  });

  // Step 3: Find best value route (highest payout, excluding previous winners)
  const usedRouteIds = new Set([cheapestRoute.id, fastestRoute.id]);
  const remainingRoutes = routes.filter(r => !usedRouteIds.has(r.id));

  // If we have remaining routes, pick the one with highest payout
  // Otherwise, fall back to the route with highest payout overall
  const bestValueRoute = remainingRoutes.length > 0
    ? remainingRoutes.reduce((best: typeof routes[number], route: typeof routes[number]) => {
        if (route.recipientGets > best.recipientGets) return route;
        if (route.recipientGets === best.recipientGets && route.totalFee < best.totalFee) return route;
        return best;
      })
    : routes.reduce((best: typeof routes[number], route: typeof routes[number]) => {
        // Only use if different from cheapest and fastest
        if (route.id === cheapestRoute.id || route.id === fastestRoute.id) return best;
        if (route.recipientGets > best.recipientGets) return route;
        return best;
      }, routes[0]);

  const responseRoutes = routes.map((route: typeof routes[number]) => {
    const highlights: string[] = [];
    if (route.id === cheapestRoute.id) {
      highlights.push("LOWEST_FEE");
    }
    if (route.id === fastestRoute.id) {
      highlights.push("FASTEST");
    }
    if (route.id === bestValueRoute.id) {
      highlights.push("BEST_VALUE");
    }
    const highlightLabels: Record<string, string> = {
      LOWEST_FEE: "Lowest Fee",
      FASTEST: "Fastest",
      BEST_VALUE: "Best Value",
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

  // Add recommendations array with clear labels
  const recommendations = [
    {
      type: "LOWEST_FEE",
      label: "Lowest Fee",
      description: "Minimize transfer costs",
      route: responseRoutes.find((r) => r.id === cheapestRoute.id),
    },
    {
      type: "FASTEST",
      label: "Fastest",
      description: "Get money there quickly",
      route: responseRoutes.find((r) => r.id === fastestRoute.id),
    },
    {
      type: "BEST_VALUE",
      label: "Best Value",
      description: "Maximize recipient payout",
      route: responseRoutes.find((r) => r.id === bestValueRoute.id),
    },
  ];

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
    recommendations,
    routes: responseRoutes,
  });
}
