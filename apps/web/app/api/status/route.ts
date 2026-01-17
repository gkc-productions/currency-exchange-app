import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// Build timestamp set at build time
const BUILD_TIMESTAMP = new Date().toISOString();
const APP_VERSION = process.env.npm_package_version || "0.1.0";

type RateCacheStats = {
  entries: number;
  lastUpdated: string | null;
  hits: number;
  misses: number;
};

type RailInfo = {
  corridor: string;
  rails: string[];
  activeRoutesCount: number;
};

type StatusResponse = {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  version: string;
  buildTimestamp: string;
  database: {
    status: "ok" | "fail";
    responseTimeMs: number | null;
    error?: string;
  };
  rateCache: RateCacheStats;
  corridors: RailInfo[];
};

// Simple in-memory cache stats tracking
let cacheHits = 0;
let cacheMs = 0;

export function trackCacheHit() {
  cacheHits++;
}

export function trackCacheMiss() {
  cacheMs++;
}

export async function GET() {
  const timestamp = new Date().toISOString();

  // Database health check
  const dbStart = Date.now();
  let dbStatus: "ok" | "fail" = "fail";
  let dbResponseTime: number | null = null;
  let dbError: string | undefined;

  try {
    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1 as health`;
    dbStatus = "ok";
    dbResponseTime = Date.now() - dbStart;
  } catch (error) {
    dbError = "Database connection failed";
    console.error("[status] Database health check failed:", error);
  }

  // Rate cache stats (basic implementation - tracks via module-level counters)
  const rateCacheStats: RateCacheStats = {
    entries: 0, // We'll enhance this if needed
    lastUpdated: null,
    hits: cacheHits,
    misses: cacheMs,
  };

  // Available rails per corridor
  const corridorRails: RailInfo[] = [];
  try {
    const corridors = await prisma.corridor.findMany({
      where: { isActive: true },
      include: {
        fromAsset: { select: { code: true } },
        toAsset: { select: { code: true } },
        routes: {
          where: { isActive: true },
          select: { rail: true },
        },
      },
    });

    for (const corridor of corridors) {
      const rails = [...new Set(corridor.routes.map((r) => r.rail))];
      corridorRails.push({
        corridor: `${corridor.fromAsset.code}→${corridor.toAsset.code}`,
        rails,
        activeRoutesCount: corridor.routes.length,
      });
    }
  } catch (error) {
    console.error("[status] Failed to fetch corridor data:", error);
  }

  // Determine overall status
  let overallStatus: "healthy" | "degraded" | "down" = "healthy";
  if (dbStatus === "fail") {
    overallStatus = "down";
  } else if (corridorRails.length === 0) {
    overallStatus = "degraded";
  }

  const response: StatusResponse = {
    status: overallStatus,
    timestamp,
    version: APP_VERSION,
    buildTimestamp: BUILD_TIMESTAMP,
    database: {
      status: dbStatus,
      responseTimeMs: dbResponseTime,
      ...(dbError && { error: dbError }),
    },
    rateCache: rateCacheStats,
    corridors: corridorRails,
  };

  const httpStatus = overallStatus === "down" ? 503 : 200;
  return NextResponse.json(response, { status: httpStatus });
}
