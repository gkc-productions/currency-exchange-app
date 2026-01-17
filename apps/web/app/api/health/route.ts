import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getRateCacheSnapshot } from "@/src/lib/rates";

export async function GET() {
  const rateCache = getRateCacheSnapshot();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        rateCache,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    rateCache,
  });
}
