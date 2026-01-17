import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// curl -s "http://127.0.0.1:3000/api/routes?from=USD&to=GHS"

function readCode(value: string | null) {
  return value?.trim().toUpperCase() ?? "";
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
        orderBy: { etaMinMinutes: "asc" },
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

  return NextResponse.json({
    corridorId: corridor.id,
    from: fromAsset.code,
    to: toAsset.code,
    routes: corridor.routes.map((route: typeof corridor.routes[number]) => ({
      id: route.id,
      corridorId: route.corridorId,
      rail: route.rail,
      provider: route.provider,
      feeFixed: Number(route.feeFixed),
      feePct: Number(route.feePct),
      fxMarginPct: Number(route.fxMarginPct),
      etaMinMinutes: route.etaMinMinutes,
      etaMaxMinutes: route.etaMaxMinutes,
      isActive: route.isActive,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    })),
  });
}
