import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { logError } from "@/src/lib/logging";

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
  transfers: {
    lastHour: number;
    last24Hours: number;
  };
  errors: {
    lastHour: number;
    last24Hours: number;
  };
  queue: {
    depth: number | null;
    note: string;
  };
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
    logError("status_db_check_failed", {
      meta: { error: error instanceof Error ? error.message : "unknown" },
    });
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
    logError("status_corridor_fetch_failed", {
      meta: { error: error instanceof Error ? error.message : "unknown" },
    });
  }

  const now = Date.now();
  const lastHour = new Date(now - 60 * 60 * 1000);
  const lastDay = new Date(now - 24 * 60 * 60 * 1000);

  let transfersLastHour = 0;
  let transfersLastDay = 0;
  let errorsLastHour = 0;
  let errorsLastDay = 0;

  try {
    const [recentHour, recentDay, errorHour, errorDay] = await prisma.$transaction([
      prisma.transfer.count({ where: { createdAt: { gte: lastHour } } }),
      prisma.transfer.count({ where: { createdAt: { gte: lastDay } } }),
      prisma.transfer.count({
        where: { status: { in: ["FAILED", "EXPIRED"] }, updatedAt: { gte: lastHour } },
      }),
      prisma.transfer.count({
        where: { status: { in: ["FAILED", "EXPIRED"] }, updatedAt: { gte: lastDay } },
      }),
    ]);
    transfersLastHour = recentHour;
    transfersLastDay = recentDay;
    errorsLastHour = errorHour;
    errorsLastDay = errorDay;
  } catch (error) {
    logError("status_transfer_metrics_failed", {
      meta: { error: error instanceof Error ? error.message : "unknown" },
    });
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
    transfers: {
      lastHour: transfersLastHour,
      last24Hours: transfersLastDay,
    },
    errors: {
      lastHour: errorsLastHour,
      last24Hours: errorsLastDay,
    },
    queue: {
      depth: null,
      note: "No async queue configured",
    },
  };

  const httpStatus = overallStatus === "down" ? 503 : 200;
  return NextResponse.json(response, { status: httpStatus });
}
