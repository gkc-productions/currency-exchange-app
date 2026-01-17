import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ??
    globalThis.crypto?.randomUUID?.() ??
    `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  try {
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: {
        code: true,
        name: true,
        symbol: true,
        decimals: true,
        kind: true,
      },
    });

    return NextResponse.json(assets);
  } catch {
    return NextResponse.json(
      { error: "Unable to load assets", requestId },
      { status: 500 }
    );
  }
}
